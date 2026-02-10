import { subjects, modules, lessons, quizQuestions, badges } from "@shared/schema";

export async function seedSubjects(db: any): Promise<void> {
  await db.insert(subjects).values([
    { id: "ela_prek_k", name: "ELA & Phonics", description: "Letter recognition, sounds, tracing, and first words through playful stories and songs", gradeBand: "PreK-K", theme: "The Alphabet Forest", color: "rose", iconName: "BookOpen", sortOrder: 1 },
    { id: "ela_1_2", name: "ELA & Reading", description: "Building reading confidence with phonics patterns, sight words, and creative writing", gradeBand: "1-2", theme: "The Story Garden", color: "rose", iconName: "BookOpen", sortOrder: 2 },
    { id: "ela_3_5", name: "ELA & Writing", description: "Reading comprehension strategies, paragraph writing, and vocabulary adventures", gradeBand: "3-5", theme: "The Writer's Workshop", color: "rose", iconName: "BookOpen", sortOrder: 3 },
    { id: "ela_6_8", name: "ELA & Literature", description: "Literary analysis, essay writing, persuasive communication, and public speaking", gradeBand: "6-8", theme: "The Literary Guild", color: "rose", iconName: "BookOpen", sortOrder: 4 },
    { id: "ela_9_12", name: "ELA & Rhetoric", description: "Critical analysis, research writing, rhetoric, and advanced literary interpretation", gradeBand: "9-12", theme: "The Scholar's Forum", color: "rose", iconName: "BookOpen", sortOrder: 5 },
    { id: "math_prek_k", name: "Math Explorers", description: "Counting, shapes, patterns, and number sense through hands-on play and discovery", gradeBand: "PreK-K", theme: "The Number Kingdom", color: "blue", iconName: "Calculator", sortOrder: 6 },
    { id: "math_1_2", name: "Math Builders", description: "Addition, subtraction, place value, and measurement with real-world connections", gradeBand: "1-2", theme: "The Math Workshop", color: "blue", iconName: "Calculator", sortOrder: 7 },
    { id: "math_3_5", name: "Math Adventurers", description: "Multiplication, division, fractions, and geometry through problem-solving quests", gradeBand: "3-5", theme: "The Problem-Solving Quest", color: "blue", iconName: "Calculator", sortOrder: 8 },
    { id: "math_6_8", name: "Math Pathfinders", description: "Pre-algebra, ratios, statistics, and mathematical reasoning", gradeBand: "6-8", theme: "The Logic Lab", color: "blue", iconName: "Calculator", sortOrder: 9 },
    { id: "math_9_12", name: "Math Mastery", description: "Algebra, geometry proofs, statistics, and real-world mathematical modeling", gradeBand: "9-12", theme: "The Analytics Studio", color: "blue", iconName: "Calculator", sortOrder: 10 },
    { id: "science_prek_k", name: "Science Sprouts", description: "Weather, animals, plants, and the five senses through wonder and observation", gradeBand: "PreK-K", theme: "The Discovery Garden", color: "emerald", iconName: "Microscope", sortOrder: 11 },
    { id: "science_1_2", name: "Science Explorers", description: "Life cycles, simple machines, habitats, and beginning scientific observation", gradeBand: "1-2", theme: "The Nature Lab", color: "emerald", iconName: "Microscope", sortOrder: 12 },
    { id: "science_3_5", name: "Science Investigators", description: "Ecosystems, matter and energy, earth science, and the scientific method", gradeBand: "3-5", theme: "The Investigation Station", color: "emerald", iconName: "Microscope", sortOrder: 13 },
    { id: "science_6_8", name: "Science Scholars", description: "Biology, chemistry basics, physics concepts, and experimental design", gradeBand: "6-8", theme: "The Research Center", color: "emerald", iconName: "Microscope", sortOrder: 14 },
    { id: "science_9_12", name: "Science Innovators", description: "Advanced biology, chemistry, physics, and scientific research methodology", gradeBand: "9-12", theme: "The Innovation Lab", color: "emerald", iconName: "Microscope", sortOrder: 15 },
    { id: "social_prek_k", name: "My Community", description: "Family, helpers in our neighborhood, sharing, and being part of a community", gradeBand: "PreK-K", theme: "Our Neighborhood", color: "amber", iconName: "Globe", sortOrder: 16 },
    { id: "social_1_2", name: "Our World", description: "Maps, communities, holidays, traditions, and what it means to be a good citizen", gradeBand: "1-2", theme: "The World Around Us", color: "amber", iconName: "Globe", sortOrder: 17 },
    { id: "social_3_5", name: "History & Geography", description: "American history, world cultures, geography, and civic responsibility", gradeBand: "3-5", theme: "The Time Travelers", color: "amber", iconName: "Globe", sortOrder: 18 },
    { id: "social_6_8", name: "Civics & Culture", description: "Government, economics, world history, and understanding diverse perspectives", gradeBand: "6-8", theme: "The Global Forum", color: "amber", iconName: "Globe", sortOrder: 19 },
    { id: "social_9_12", name: "Society & Government", description: "Political science, economics, sociology, and civic engagement", gradeBand: "9-12", theme: "The Leadership Council", color: "amber", iconName: "Globe", sortOrder: 20 },
    { id: "sel_prek_k", name: "My Feelings Friend", description: "Naming emotions, calming strategies, friendship skills, and feeling safe", gradeBand: "PreK-K", theme: "The Feelings Treehouse", color: "pink", iconName: "Heart", sortOrder: 21 },
    { id: "sel_1_2", name: "Feelings & Friends", description: "Managing big feelings, making friends, solving problems peacefully, and empathy", gradeBand: "1-2", theme: "The Friendship Bridge", color: "pink", iconName: "Heart", sortOrder: 22 },
    { id: "sel_3_5", name: "Social Skills Builder", description: "Emotional intelligence, conflict resolution, teamwork, and growth mindset", gradeBand: "3-5", theme: "The Teamwork Tower", color: "pink", iconName: "Heart", sortOrder: 23 },
    { id: "sel_6_8", name: "Emotional Intelligence", description: "Self-awareness, stress management, healthy relationships, and identity exploration", gradeBand: "6-8", theme: "The Inner Compass", color: "pink", iconName: "Heart", sortOrder: 24 },
    { id: "sel_9_12", name: "Life Skills & Leadership", description: "Mental health awareness, communication, leadership, and planning for the future", gradeBand: "9-12", theme: "The Leadership Journey", color: "pink", iconName: "Heart", sortOrder: 25 },
    { id: "wellness_prek_k", name: "Healthy Me", description: "Handwashing, brushing teeth, healthy foods, sleep, and joyful movement", gradeBand: "PreK-K", theme: "The Wellness Clubhouse", color: "teal", iconName: "Salad", sortOrder: 26 },
    { id: "wellness_1_2", name: "Body & Mind Care", description: "Personal hygiene routines, nutrition basics, exercise, and rest", gradeBand: "1-2", theme: "The Health Heroes", color: "teal", iconName: "Salad", sortOrder: 27 },
    { id: "wellness_3_5", name: "Wellness Warriors", description: "Nutrition science, fitness goals, sleep hygiene, and stress management", gradeBand: "3-5", theme: "The Wellness Quest", color: "teal", iconName: "Salad", sortOrder: 28 },
    { id: "wellness_6_8", name: "Health & Wellness", description: "Adolescent health, mental wellness, digital wellness, and healthy habits", gradeBand: "6-8", theme: "The Wellness Lab", color: "teal", iconName: "Salad", sortOrder: 29 },
    { id: "wellness_9_12", name: "Holistic Health", description: "Comprehensive wellness planning, mental health, nutrition, and lifelong fitness", gradeBand: "9-12", theme: "The Wellness Blueprint", color: "teal", iconName: "Salad", sortOrder: 30 },
  ]);

  // ============================================================
  // PreK-K ELA & PHONICS - The Alphabet Forest
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ela_prek_k_module_1", levelId: 1, subjectId: "ela_prek_k", moduleNumber: 1,
      title: "The Alphabet Adventure", description: "Meet each letter of the alphabet! Learn their names, the sounds they make, and practice tracing them with your finger.",
      durationWeeks: 4,
      storyArcTitle: "Journey Through the Alphabet Forest",
      storyArcNarrative: "Welcome to the Alphabet Forest! Every tree has a special letter on it, and every letter has a sound and a story. Let's walk through the forest together and meet our letter friends. You'll learn to recognize them, say their sounds, and trace them with your finger. Every letter you learn is a step closer to reading your very first book!",
      learningObjectives: ["Recognize uppercase and lowercase letters A-C", "Say the sound each letter makes", "Trace letters with your finger", "Connect letters to words that start with them"],
      activities: ["Trace letters on screen with your finger", "Match letters to pictures (A = Apple)", "Sing the letter sound song", "Find the letter in your name"],
    },
    {
      id: "ela_prek_k_module_2", levelId: 1, subjectId: "ela_prek_k", moduleNumber: 2,
      title: "My First Words", description: "Start reading your very first words! Learn sight words, rhyming patterns, and build confidence as a beginning reader.",
      durationWeeks: 4,
      storyArcTitle: "The Word Garden",
      storyArcNarrative: "Now that you know some letters, something magical happens - letters come together to make WORDS! In the Word Garden, we'll plant seeds that grow into words you can read all by yourself. Every word you learn makes you a stronger reader. You are doing something amazing - you are learning to read!",
      learningObjectives: ["Read simple sight words: I, am, the, is, a", "Recognize rhyming words", "Build words from letter sounds", "Feel confident as a beginning reader"],
      activities: ["Match sight words to pictures", "Rhyming word game", "Build simple words with letter tiles", "Read your first sentence: I am happy"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "ela_prek_k_m1_l1", moduleId: "ela_prek_k_module_1", lessonNumber: 1,
      title: "A is for Apple", durationMinutes: 15, activityType: "tracing",
      activityData: JSON.stringify({
        type: "tracing",
        letter: "A",
        word: "Apple",
        imageDescription: "A bright, shiny red apple with a green leaf on top",
        upperPath: "M15,90 L50,10 L85,90 M30,60 L70,60",
        lowerPath: "M55,90 A25,30 0 1,1 55,35 L55,90",
        funFact: "Apples can be red, green, or yellow! They grow on trees and are a healthy snack.",
      }),
      content: `## A is for Apple!

Hello, little learner! Today we are going to meet our very first letter friend. Say hello to the letter A!

### The Letter A

A is a very special letter. It is the FIRST letter in the whole alphabet! A makes the sound "aah" like when a doctor asks you to open your mouth. Try it! Say "aaah!"

### A is for Apple

Can you picture a big, bright red apple? Apples are yummy and healthy. The word APPLE starts with the letter A. Can you hear the "aah" sound at the beginning? Aaaa-pple!

Here are more A words:
- Ant - a tiny little bug that works very hard
- Airplane - it flies way up high in the sky!
- Alligator - a big green animal with a long tail

### Let's Trace!

Now it's YOUR turn! Use your finger to trace the letter A. Start at the bottom left, go up to the tippy top, then come back down to the bottom right. Then draw a line across the middle - like a bridge!

For the little a, make a circle and then add a line going down on the right side.

### You Did It!

You just learned your very first letter! You should feel so proud. Tell someone at home: "I learned the letter A today! A is for Apple!"`,
    },
    {
      id: "ela_prek_k_m1_l2", moduleId: "ela_prek_k_module_1", lessonNumber: 2,
      title: "B is for Bear", durationMinutes: 15, activityType: "tracing",
      activityData: JSON.stringify({
        type: "tracing",
        letter: "B",
        word: "Bear",
        imageDescription: "A friendly brown teddy bear with a warm smile",
        upperPath: "M20,10 L20,90 M20,10 Q75,10 75,50 Q75,50 20,50 M20,50 Q75,50 75,90 Q75,90 20,90",
        lowerPath: "M25,10 L25,90 M25,50 Q70,50 70,70 Q70,90 25,90",
        funFact: "Bears love to eat berries, fish, and honey! Baby bears are called cubs.",
      }),
      content: `## B is for Bear!

Great job coming back for another letter! Today we're going to meet the letter B. B is the SECOND letter in the alphabet, right after A!

### The Letter B

B makes a "buh" sound. Press your lips together and let the sound pop out - "buh!" Like the beginning of the word "bubble." Try blowing bubbles with just the sound!

### B is for Bear

Think of a big, fluffy, friendly bear. Bears are strong and gentle animals. They love to eat berries and honey. The word BEAR starts with B. Can you hear it? Bbb-ear!

More B words:
- Ball - round and bouncy, so fun to play with!
- Butterfly - beautiful wings that flutter in the garden
- Banana - a yellow fruit that monkeys love

### Let's Trace!

Time to trace the letter B! For the big B, draw a tall line going down. Then add two bumps on the right side - one on top and one on the bottom.

For the little b, draw a tall line going down first, then add a round belly on the bottom right.

### Storytime Connection

Imagine a bear named Benny who loves blueberries. Benny the Bear ate big, blue blueberries by the beautiful brook! How many B words did you hear in that sentence?

### You Are Amazing!

Two letters learned! A and B! You are on your way to reading. Every letter you learn is a superpower. Keep going!`,
    },
    {
      id: "ela_prek_k_m1_l3", moduleId: "ela_prek_k_module_1", lessonNumber: 3,
      title: "C is for Cat", durationMinutes: 15, activityType: "tracing",
      activityData: JSON.stringify({
        type: "tracing",
        letter: "C",
        word: "Cat",
        imageDescription: "A cute orange tabby cat with green eyes, sitting and purring",
        upperPath: "M80,25 Q80,10 50,10 Q20,10 20,50 Q20,90 50,90 Q80,90 80,75",
        lowerPath: "M65,35 Q65,30 50,30 Q35,30 35,50 Q35,70 50,70 Q65,70 65,65",
        funFact: "Cats purr when they are happy. They can see in the dark much better than people!",
      }),
      content: `## C is for Cat!

Welcome back, superstar! You already know A and B. Today we meet the letter C!

### The Letter C

C makes a "kuh" sound, like the beginning of "cookie." It can also make a soft sound like "sss" in "circle." But most of the time, C says "kuh!" Try it!

### C is for Cat

Do you know any cats? Cats are soft, cuddly animals that say "meow!" The word CAT starts with the letter C. Listen carefully: Ccc-at!

More C words:
- Cup - you drink water or juice from it
- Car - it drives on the road, vroom vroom!
- Cookie - a yummy treat (C is for Cookie!)
- Cloud - the fluffy white shapes in the sky

### Let's Trace!

The letter C is like a big hug that doesn't close all the way! Start at the top right, curve up and around to the left, go down, and curve to the bottom right. Leave a little opening!

The little c looks just like the big C, but smaller. Same shape, same hug!

### Sing It!

Let's sing! (To the tune of "Twinkle Twinkle")
C is for cat and c is for cake,
C is for the cookies that we bake!

### Three Letters Strong!

A, B, C - you know THREE letters now! That's incredible. You are becoming a reader. Be proud of yourself today!`,
    },
    {
      id: "ela_prek_k_m2_l1", moduleId: "ela_prek_k_module_2", lessonNumber: 1,
      title: "My First Sight Words", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "I", right: "Points to yourself" },
          { left: "am", right: "Tells who you are" },
          { left: "the", right: "Points to something specific" },
          { left: "is", right: "Tells about one thing" },
          { left: "a", right: "Talks about any one thing" },
        ],
        instructions: "Match each word to what it means! These are words you'll see everywhere.",
      }),
      content: `## My First Sight Words!

Today is a very special day. You are going to learn to READ real words! These words are called "sight words" because you will see them SO much that you'll recognize them right away - just by looking!

### What Are Sight Words?

Sight words are small words that appear in almost every book, every sign, and every sentence. Once you learn them, you can start reading sentences all by yourself!

### Let's Meet Our Words!

Word 1: I
- This tiny word means YOU! When you say "I am happy," the word "I" is talking about you.

Word 2: am
- This word connects you to something about yourself. "I am brave. I am kind. I am learning!"

Word 3: the
- This little word points to something specific. "The cat. The sun. The book."

Word 4: is
- This word tells about one thing. "The sky is blue. The dog is fluffy."

Word 5: a
- This word means one of something. "A bird. A tree. A smile."

### Your First Sentences!

You can read these RIGHT NOW:
- I am a kid.
- The cat is a pet.
- I am the best!

### Reading Practice

Try reading each sentence out loud. Point to each word as you say it. You are reading! This is one of the most important things you will ever learn, and you are doing it RIGHT NOW!

### Tell Someone!

Go tell a grown-up: "I can read! Listen to this: I am a kid!" Watch how proud they will be of you!`,
    },
    {
      id: "ela_prek_k_m2_l2", moduleId: "ela_prek_k_module_2", lessonNumber: 2,
      title: "Rhyming Fun", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "cat", right: "hat" },
          { left: "man", right: "can" },
          { left: "pig", right: "big" },
          { left: "hop", right: "top" },
          { left: "sun", right: "fun" },
        ],
        instructions: "Match the words that rhyme! Words that rhyme sound the same at the end.",
      }),
      content: `## Rhyming Fun!

Do you know what rhyming means? Words that RHYME sound the same at the end! Like cat and hat. Or dog and log. Rhyming is like music for words!

### The -at Family

These words all end in -at and they rhyme:
- Cat - a furry pet that says meow
- Hat - something you wear on your head
- Bat - a flying animal that comes out at night
- Mat - something soft you stand on
- Sat - what you did when you sat down

Can you say them fast? Cat, hat, bat, mat, sat! They all rhyme!

### The -an Family

- Man - a grown-up person
- Can - you CAN do it! (also a tin can)
- Pan - you cook food in it
- Fan - it blows cool air
- Van - a big car for families

### The -ig Family

- Pig - oink oink! A pink farm animal
- Big - the opposite of small
- Dig - what you do in the sandbox
- Wig - pretend hair you can wear

### Rhyming Game

Can you think of a word that rhymes with these?
- "Sun" rhymes with ___? (fun! run! bun!)
- "Red" rhymes with ___? (bed! Ted! said!)
- "Top" rhymes with ___? (hop! pop! stop!)

### Why Rhyming Matters

When you know that "cat" and "hat" rhyme, your brain starts to see PATTERNS in words. This is a reading superpower! Patterns help you figure out new words, even words you've never seen before!

### You're a Rhyming Star!

You just learned something readers use every day. You can hear rhymes in songs, in stories, and all around you. Keep listening for rhymes everywhere you go!`,
    },
  ]);

  // ============================================================
  // PreK-K MATH - The Number Kingdom
  // ============================================================
  await db.insert(modules).values([
    {
      id: "math_prek_k_module_1", levelId: 1, subjectId: "math_prek_k", moduleNumber: 1,
      title: "Counting Friends", description: "Count from 1 to 10, match numbers to quantities, and discover numbers in everyday life.",
      durationWeeks: 3,
      storyArcTitle: "Welcome to the Number Kingdom",
      storyArcNarrative: "In the Number Kingdom, every number is a friend who helps us understand the world! Number 1 is the brave leader, Number 2 is the pair of best friends, and Number 3 is the three little pigs. Let's count our way through the kingdom and make every number our friend!",
      learningObjectives: ["Count from 1 to 10 with confidence", "Match numbers to groups of objects", "Recognize numbers in everyday life", "Understand that numbers tell us 'how many'"],
      activities: ["Count objects on screen", "Match numbers to pictures", "Number tracing practice", "Find numbers around your home"],
    },
    {
      id: "math_prek_k_module_2", levelId: 1, subjectId: "math_prek_k", moduleNumber: 2,
      title: "Shapes & Patterns", description: "Discover circles, squares, and triangles everywhere! Create and continue patterns.",
      durationWeeks: 3,
      storyArcTitle: "The Shape Explorers",
      storyArcNarrative: "Shapes are everywhere - the wheels on a bus are circles, windows are rectangles, and pizza slices are triangles! Let's become Shape Explorers and find all the amazing shapes hiding in the world around us.",
      learningObjectives: ["Identify circles, squares, triangles, and rectangles", "Find shapes in everyday objects", "Create and continue simple patterns", "Sort objects by shape"],
      activities: ["Shape hunt around your home", "Pattern building game", "Shape sorting activity", "Draw using shapes"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "math_prek_k_m1_l1", moduleId: "math_prek_k_module_1", lessonNumber: 1,
      title: "Numbers 1 to 5", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "1", right: "One star" },
          { left: "2", right: "Two hands" },
          { left: "3", right: "Three bears" },
          { left: "4", right: "Four wheels" },
          { left: "5", right: "Five fingers" },
        ],
        instructions: "Match each number to the right amount!",
      }),
      content: `## Numbers 1 to 5!

Let's count! Counting is one of the most useful things you'll ever learn. When you count, you can figure out how many cookies are on a plate, how many friends are at a party, or how many stars are in the sky!

### Number 1

Hold up ONE finger. That's the number 1! You have ONE nose. ONE mouth. You are ONE amazing kid!

### Number 2

Hold up TWO fingers. You have TWO eyes, TWO ears, TWO hands, and TWO feet. Things that come in pairs are always 2!

### Number 3

THREE! Like the three little pigs, or three scoops of ice cream (yum!). Hold up three fingers!

### Number 4

FOUR is like the four legs on a dog, or four wheels on a car. Can you hold up four fingers?

### Number 5

FIVE! That's a whole hand! High five! You have five fingers on each hand and five toes on each foot.

### Counting Practice

Let's count together! Point to each thing as we count:
- Count the people in your family
- Count the chairs at your table
- Count your favorite toys (up to 5)

### You're a Counter!

Every time you count something today, you're practicing math. Count the stairs, count your snacks, count the birds you see! Numbers are everywhere!`,
    },
    {
      id: "math_prek_k_m1_l2", moduleId: "math_prek_k_module_1", lessonNumber: 2,
      title: "Shapes Around Us", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Circle", right: "Clock, wheel, cookie" },
          { left: "Square", right: "Window, crackers, blocks" },
          { left: "Triangle", right: "Pizza slice, roof, tent" },
          { left: "Rectangle", right: "Door, phone, book" },
        ],
        instructions: "Match each shape to things that look like it!",
      }),
      content: `## Shapes Around Us!

Look around you right now. Can you spot any shapes? Shapes are EVERYWHERE, hiding in plain sight! Let's become shape detectives!

### Circle - Round and Round

A circle is perfectly round with no corners. Where can you find circles?
- The clock on the wall
- A wheel on a bicycle
- A cookie (yum!)
- The sun in the sky

Trace a circle in the air with your finger. Round and round!

### Square - Four Equal Sides

A square has four sides that are all the same size and four corners. Where do you see squares?
- A window
- A cracker
- A building block
- A picture frame

### Triangle - Three Sides

A triangle has three sides and three pointy corners. Can you find triangles?
- A slice of pizza (the best shape!)
- The roof on a house
- A tent when you go camping
- A yield sign on the road

### Rectangle - Like a Stretched Square

A rectangle is like a square that got stretched! It has four sides, but two sides are longer than the other two.
- A door
- Your phone or tablet
- A book
- A chocolate bar

### Shape Hunt!

Now it's YOUR turn! Walk around your room and find:
- 3 circles
- 3 squares
- 2 triangles
- 2 rectangles

You are a shape detective! Great work!`,
    },
  ]);

  // ============================================================
  // PreK-K SCIENCE - The Discovery Garden
  // ============================================================
  await db.insert(modules).values([
    {
      id: "science_prek_k_module_1", levelId: 1, subjectId: "science_prek_k", moduleNumber: 1,
      title: "Nature Explorers", description: "Observe weather, discover animals, and explore the wonderful world of nature through your senses.",
      durationWeeks: 3,
      storyArcTitle: "Adventures in the Discovery Garden",
      storyArcNarrative: "The Discovery Garden is full of amazing things to see, hear, smell, and touch! Every day, the weather changes. Animals come and go. Plants grow from tiny seeds. You are a scientist when you watch carefully and ask 'why?' Let's explore!",
      learningObjectives: ["Observe and describe different types of weather", "Name common animals and where they live", "Use senses to explore the natural world", "Ask questions about nature like a scientist"],
      activities: ["Weather sorting activity", "Animal habitats matching game", "Nature walk observation journal", "Five senses scavenger hunt"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "science_prek_k_m1_l1", moduleId: "science_prek_k_module_1", lessonNumber: 1,
      title: "Weather Watch", durationMinutes: 15, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Sunny Day Clothes", "Rainy Day Clothes"],
        items: [
          { text: "Sunglasses", category: "Sunny Day Clothes" },
          { text: "Rain boots", category: "Rainy Day Clothes" },
          { text: "Umbrella", category: "Rainy Day Clothes" },
          { text: "Shorts", category: "Sunny Day Clothes" },
          { text: "Raincoat", category: "Rainy Day Clothes" },
          { text: "Sandals", category: "Sunny Day Clothes" },
        ],
        instructions: "Sort the clothes! What do you wear on a sunny day vs. a rainy day?",
      }),
      content: `## Weather Watch!

Look outside your window right now. What do you see? Is the sun shining? Are clouds in the sky? Is it raining? What you see is called WEATHER!

### Types of Weather

Sunny - The sun is out and it feels warm! You might see your shadow.

Rainy - Water falls from the clouds! Puddles form and worms come out. You need an umbrella!

Cloudy - Clouds cover the sun like a blanket. It might rain later, or the clouds might go away.

Snowy - Tiny white snowflakes fall from the sky! You can catch them on your tongue (if it's clean!).

Windy - You can feel the air push against you! Leaves blow around and kites can fly!

### What Do You Wear?

The weather helps us decide what to wear:
- Sunny: Light clothes, hat, sunscreen
- Rainy: Rain boots, raincoat, umbrella
- Cold: Warm coat, hat, gloves, scarf
- Snowy: Snow boots, heavy coat, mittens

### Be a Weather Watcher!

Scientists who study weather are called meteorologists. You can be one too! Every day this week, look outside and say: "Today it is _____." (sunny, rainy, cloudy, windy, or snowy)

### Weather Song

(To the tune of "If You're Happy and You Know It")
If it's sunny and you know it, wear your hat!
If it's rainy and you know it, grab your boots!
If it's snowy and you know it, bundle up!
The weather tells us what to do!`,
    },
    {
      id: "science_prek_k_m1_l2", moduleId: "science_prek_k_module_1", lessonNumber: 2,
      title: "Amazing Animals", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Fish", right: "Water / Ocean" },
          { left: "Bird", right: "Sky / Trees" },
          { left: "Bear", right: "Forest / Cave" },
          { left: "Frog", right: "Pond / Swamp" },
          { left: "Camel", right: "Desert / Sand" },
        ],
        instructions: "Match each animal to where it lives! Every animal has a special home.",
      }),
      content: `## Amazing Animals!

The world is full of amazing animals! Big ones, tiny ones, fast ones, slow ones. Every animal is special and has a home that's just right for it.

### Where Do Animals Live?

Every animal has a special home called a HABITAT. A habitat gives an animal food, water, and shelter.

Fish live in WATER - they breathe underwater using gills! They swim with their fins and can be so many beautiful colors.

Birds live in the SKY and in TREES - they have wings to fly and build nests for their babies. Some birds sing beautiful songs!

Bears live in FORESTS - they are big and strong! They sleep all winter (that's called hibernation) and wake up hungry in the spring.

Frogs live near PONDS - they start as tiny eggs, become tadpoles, and then grow legs to become frogs! That's called metamorphosis - a big word that means "big change."

### Animal Sounds

Can you make these animal sounds?
- Dog says "woof woof!"
- Cat says "meow!"
- Cow says "mooo!"
- Duck says "quack quack!"
- Lion says "ROAR!"

### Be Kind to Animals

Animals are our friends on this planet. We should be gentle and kind to them. Even tiny bugs and worms are important! They all have jobs to do in nature.

### Animal Detective

This week, look for animals near your home. You might see:
- Birds in the trees
- Squirrels gathering nuts
- Butterflies in the garden
- Ants on the sidewalk

Every animal you notice makes you a better scientist!`,
    },
  ]);

  // ============================================================
  // PreK-K SEL - The Feelings Treehouse
  // ============================================================
  await db.insert(modules).values([
    {
      id: "sel_prek_k_module_1", levelId: 1, subjectId: "sel_prek_k", moduleNumber: 1,
      title: "My Feelings Friend", description: "Learn to name your feelings, calm your body when feelings get big, and be a good friend to others.",
      durationWeeks: 4,
      storyArcTitle: "The Feelings Treehouse",
      storyArcNarrative: "Welcome to the Feelings Treehouse - a safe, cozy place where ALL feelings are welcome. Sometimes we feel happy like sunshine, sometimes sad like rain, and sometimes angry like thunder. Every feeling is okay! In our treehouse, we'll learn that feelings are like weather - they come and go. We'll learn to name them, feel them, and let them pass. You are safe here.",
      learningObjectives: ["Name at least 5 different feelings", "Understand that ALL feelings are okay", "Learn 2 ways to calm down when feelings get big", "Practice being kind and empathetic to others"],
      activities: ["Feelings check-in activity", "Breathing exercise for calming", "Kindness matching game", "Draw how you feel today"],
    },
    {
      id: "sel_prek_k_module_2", levelId: 1, subjectId: "sel_prek_k", moduleNumber: 2,
      title: "Friendship Skills", description: "Learn how to make friends, share, take turns, and handle disagreements with kindness.",
      durationWeeks: 3,
      storyArcTitle: "The Friendship Bridge",
      storyArcNarrative: "A bridge connects two sides together, just like friendship connects two people! Building a friendship takes practice - sharing, listening, taking turns, and being kind even when it's hard. Every friendship starts with a smile and the brave words: 'Do you want to play?'",
      learningObjectives: ["Use kind words to make friends", "Practice sharing and taking turns", "Understand how others feel (empathy)", "Handle disagreements without hurting"],
      activities: ["Role-play making a new friend", "Sharing practice game", "How would you feel? scenarios", "Compliment chain activity"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "sel_prek_k_m1_l1", moduleId: "sel_prek_k_module_1", lessonNumber: 1,
      title: "Happy, Sad, and Everything In Between", durationMinutes: 15, activityType: "emotion_check",
      activityData: JSON.stringify({
        type: "emotion_check",
        emotions: ["Happy", "Sad", "Angry", "Scared", "Calm", "Excited", "Worried", "Proud"],
        prompt: "How are you feeling right now? It's okay to feel ANY feeling. Pick the one that fits best.",
        followUp: "Thank you for sharing. Every feeling you have is important and okay.",
      }),
      content: `## Happy, Sad, and Everything In Between

Hello, wonderful you! Today we're going to talk about something very important - your FEELINGS.

### All Feelings Are Welcome Here

Did you know that EVERY feeling you have is okay? Every single one! Let's meet some feelings:

HAPPY - When you feel warm and smiley inside. Like when someone you love gives you a hug, or when you see your favorite food for dinner!

SAD - When you feel like crying or want to be quiet. Like when a friend moves away, or when you miss someone. It's okay to feel sad. Sadness means you care about something.

ANGRY - When you feel hot inside and want to stomp or yell. Like when something feels unfair, or when someone takes your toy. Anger is telling you that something doesn't feel right.

SCARED - When your tummy feels funny and you want to hide. Like when it's dark or there's a loud noise. Being scared is your body trying to keep you safe.

CALM - When you feel peaceful and relaxed. Like after a warm bath or while being read a bedtime story. Calm feels so good.

EXCITED - When you feel bouncy and can't wait! Like on your birthday or before a fun trip!

### The Important Rule

Here is the most important thing: ALL feelings are okay. You are NEVER bad for having a feeling. Feelings are like clouds in the sky - they come, they stay for a while, and then they move on.

What IS important is what we DO with our feelings. We can feel angry, but we don't hit. We can feel sad, but we can ask for a hug.

### Check In With Yourself

Right now, how are you feeling? Take a deep breath and notice. There's no wrong answer. You might feel more than one thing at once - that's totally normal!

### You Are Brave

Talking about feelings takes courage. You are brave for learning about your feelings today. Be gentle with yourself - you're doing great!`,
    },
    {
      id: "sel_prek_k_m1_l2", moduleId: "sel_prek_k_module_1", lessonNumber: 2,
      title: "My Calm-Down Corner", durationMinutes: 15, activityType: "breathing",
      activityData: JSON.stringify({
        type: "breathing",
        pattern: "4-4-4",
        inhaleSeconds: 4,
        holdSeconds: 4,
        exhaleSeconds: 4,
        cycles: 3,
        name: "Balloon Breath",
        instructions: "Imagine you're blowing up a balloon! Breathe in slowly to fill your balloon, hold it, then let the air out slowly. Watch the balloon grow and shrink!",
        kidFriendlyTip: "Put your hands on your tummy. Feel it grow big like a balloon when you breathe in!",
      }),
      content: `## My Calm-Down Corner

Sometimes our feelings get REALLY BIG. So big they feel like they might burst! When that happens, we need a special tool to help us feel better. Today we're going to learn the most powerful calming tool in the world: BREATHING.

### Why Breathing Helps

When you feel scared, angry, or upset, your body gets tight and tense. Your heart beats fast. Your breathing gets quick. But here's the magic: when you slow down your breathing, your whole body calms down too!

### Balloon Breath

Let's try Balloon Breath! This is a special way of breathing:

Step 1: Put your hands on your tummy
Step 2: Breathe IN slowly through your nose (count 1, 2, 3, 4) - feel your tummy grow big like a balloon!
Step 3: HOLD your breath gently (count 1, 2, 3, 4) - the balloon is full!
Step 4: Breathe OUT slowly through your mouth (count 1, 2, 3, 4) - the balloon slowly lets out air
Step 5: Do it again! Three times total.

### Other Calm-Down Tools

Breathing is just one tool! Here are more:

SQUEEZE AND RELEASE - Make tight fists with your hands. Squeeze, squeeze, squeeze! Now open your hands and let all the tightness go. Feel the difference?

FIVE SENSES - Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. This helps your brain focus on right now.

SAFE PLACE - Think of your favorite safe, cozy place. Maybe it's your bed, or someone's lap, or a blanket fort. Close your eyes and imagine you're there.

### Your Calm-Down Corner

Everyone needs a calm-down spot at home. Ask a grown-up to help you set one up:
- A cozy corner with a soft pillow or blanket
- A stuffed animal to hug
- A picture of someone who loves you

### Remember

Calming down doesn't mean you stop feeling. It means you give your body and brain a gentle hug from the inside. You are learning something grown-ups still practice every day. You're amazing!`,
    },
    {
      id: "sel_prek_k_m1_l3", moduleId: "sel_prek_k_module_1", lessonNumber: 3,
      title: "Being a Good Friend", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Someone falls down", right: "Ask: Are you okay?" },
          { left: "Someone looks lonely", right: "Say: Want to play with me?" },
          { left: "Someone shares with you", right: "Say: Thank you!" },
          { left: "You bump into someone", right: "Say: I'm sorry" },
          { left: "Someone is crying", right: "Stay close and be gentle" },
        ],
        instructions: "What's the kind thing to do? Match each situation to the right response!",
      }),
      content: `## Being a Good Friend

One of the best things in the whole world is having a friend. And the best way to HAVE a friend is to BE a friend! Let's learn how.

### What Makes a Good Friend?

A good friend is someone who:
- Is KIND with their words and actions
- LISTENS when you talk
- SHARES toys and treats
- Takes TURNS during games
- Says SORRY when they make a mistake
- Makes you feel SAFE and happy

### Kind Words Are Powerful

Words can make someone's whole day better! Try these kind words:
- "I like playing with you!"
- "You're really good at that!"
- "Do you want to be my partner?"
- "That was so nice of you!"
- "I'm glad you're my friend!"

### What If Someone Is Sad?

Sometimes a friend feels sad. You don't have to fix it - just being there helps! You can:
- Sit next to them quietly
- Ask "Are you okay?"
- Offer a hug (if they want one)
- Tell a grown-up if they need help
- Just be there - that's enough

### What If You Disagree?

Friends don't always agree. That's normal! When you disagree:
- Use your words, not your hands
- Listen to your friend's side
- Try to find something you both like
- It's okay to take a break and come back

### The Golden Rule

Treat others the way YOU would like to be treated. If you would want someone to be kind to you, be kind to them! If you wouldn't want someone to call you a name, don't call them names.

### You Are a Good Friend

Just by learning about kindness, you're already being a wonderful friend. The world needs kind people like you!`,
    },
  ]);

  // ============================================================
  // PreK-K WELLNESS - The Wellness Clubhouse
  // ============================================================
  await db.insert(modules).values([
    {
      id: "wellness_prek_k_module_1", levelId: 1, subjectId: "wellness_prek_k", moduleNumber: 1,
      title: "Taking Care of Me", description: "Learn to wash hands, brush teeth, eat healthy foods, and move your body in fun ways!",
      durationWeeks: 3,
      storyArcTitle: "The Wellness Clubhouse",
      storyArcNarrative: "Welcome to the Wellness Clubhouse, where we learn to take care of our amazing bodies! Your body does so many incredible things - it lets you run, jump, laugh, hug, and play. Let's learn how to keep it happy and healthy so you can do all the things you love!",
      learningObjectives: ["Know the steps for proper handwashing", "Understand why healthy foods help our bodies grow", "Name 3 ways to move and exercise", "Learn basic hygiene routines"],
      activities: ["Handwashing steps song", "Healthy vs. unhealthy food sorting", "Movement breaks and exercises", "Daily routine checklist"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "wellness_prek_k_m1_l1", moduleId: "wellness_prek_k_module_1", lessonNumber: 1,
      title: "Wash Your Hands!", durationMinutes: 12, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Times to Wash Hands", "Don't Need to Wash"],
        items: [
          { text: "Before eating food", category: "Times to Wash Hands" },
          { text: "After using the bathroom", category: "Times to Wash Hands" },
          { text: "After petting a dog", category: "Times to Wash Hands" },
          { text: "After reading a book", category: "Don't Need to Wash" },
          { text: "After sneezing into hands", category: "Times to Wash Hands" },
          { text: "After watching TV", category: "Don't Need to Wash" },
        ],
        instructions: "When should you wash your hands? Sort these into the right category!",
      }),
      content: `## Wash Your Hands!

Your hands are incredible! They help you eat, draw, play, wave hello, and give hugs. But did you know that tiny things called GERMS can ride on your hands? You can't see them, but they're there! Washing your hands washes the germs away!

### When to Wash Your Hands

You should wash your hands:
- BEFORE eating or touching food
- AFTER using the bathroom
- AFTER playing outside
- AFTER petting animals
- AFTER sneezing or coughing into your hands
- AFTER touching something dirty

### The Handwashing Steps

Let's learn the perfect handwashing routine:

Step 1: Turn on the water (warm is best!)
Step 2: Get your hands wet
Step 3: Add soap (a little squirt!)
Step 4: Rub your hands together - scrub, scrub, scrub!
Step 5: Get between your fingers and under your nails
Step 6: Keep scrubbing while you sing "Happy Birthday" TWO times (that's about 20 seconds!)
Step 7: Rinse all the soap off
Step 8: Dry your hands with a clean towel

### The Handwashing Song

(To the tune of "Row Row Row Your Boat")
Wash, wash, wash your hands,
Scrub them nice and clean!
Scrub the tops and palms and fingers,
Best hands you've ever seen!

### You're a Germ Fighter!

Every time you wash your hands, you're protecting yourself AND the people around you. You're a superhero germ fighter!`,
    },
    {
      id: "wellness_prek_k_m1_l2", moduleId: "wellness_prek_k_module_1", lessonNumber: 2,
      title: "Healthy Yummy Foods", durationMinutes: 12, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Everyday Foods (Healthy!)", "Sometimes Foods (Treats!)"],
        items: [
          { text: "Apple", category: "Everyday Foods (Healthy!)" },
          { text: "Carrot sticks", category: "Everyday Foods (Healthy!)" },
          { text: "Candy bar", category: "Sometimes Foods (Treats!)" },
          { text: "Milk", category: "Everyday Foods (Healthy!)" },
          { text: "Cookies", category: "Sometimes Foods (Treats!)" },
          { text: "Banana", category: "Everyday Foods (Healthy!)" },
          { text: "Chicken", category: "Everyday Foods (Healthy!)" },
          { text: "Ice cream", category: "Sometimes Foods (Treats!)" },
        ],
        instructions: "Sort the foods! Everyday foods help your body grow strong. Sometimes foods are treats we enjoy once in a while.",
      }),
      content: `## Healthy Yummy Foods!

Did you know that food is like fuel for your body? Just like a car needs gas to go, YOUR body needs good food to run, play, think, and grow!

### Everyday Foods

These are foods that help your body grow strong and healthy. You can eat them every day!

FRUITS - Apples, bananas, strawberries, oranges, grapes. Fruits are sweet and full of vitamins!

VEGETABLES - Carrots, broccoli, peas, corn, spinach. Veggies help you see better, grow taller, and stay healthy!

PROTEINS - Chicken, fish, eggs, beans, nuts. Proteins build your muscles so you can run and jump!

GRAINS - Bread, rice, oatmeal, pasta. Grains give you energy to play all day!

DAIRY - Milk, cheese, yogurt. Dairy makes your bones and teeth strong!

WATER - The most important drink! Your body needs lots of water every day.

### Sometimes Foods

These are treats we enjoy once in a while. They taste yummy but don't help our bodies grow:
- Candy and chocolate
- Cookies and cake
- Soda and sugary drinks
- Chips and fries

It's okay to have treats sometimes! The important thing is to eat lots of everyday foods too.

### Rainbow Eating

Try to eat foods of EVERY color of the rainbow:
- RED: Tomatoes, strawberries, apples
- ORANGE: Carrots, oranges, sweet potatoes
- YELLOW: Bananas, corn, pineapple
- GREEN: Broccoli, peas, lettuce
- BLUE/PURPLE: Blueberries, grapes, eggplant

### You Are What You Eat!

When you eat healthy foods, you're giving your body a big gift. You'll have more energy, feel better, and grow stronger every day!`,
    },
    {
      id: "wellness_prek_k_m1_l3", moduleId: "wellness_prek_k_module_1", lessonNumber: 3,
      title: "Move Your Body!", durationMinutes: 12, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Strong muscles", right: "Climbing and jumping" },
          { left: "Flexible body", right: "Stretching and yoga" },
          { left: "Happy heart", right: "Running and dancing" },
          { left: "Good balance", right: "Standing on one foot" },
          { left: "Calm mind", right: "Deep breathing" },
        ],
        instructions: "Match each benefit to the exercise that helps!",
      }),
      content: `## Move Your Body!

Your body was made to MOVE! Running, jumping, dancing, climbing - movement makes your body strong and your brain happy. Let's learn fun ways to move every day!

### Why Moving Matters

When you move your body:
- Your muscles get STRONGER
- Your heart gets HEALTHIER
- Your brain works BETTER
- You sleep more SOUNDLY at night
- You feel HAPPIER!

### Fun Ways to Move

DANCE - Put on your favorite song and dance! Spin, wiggle, shake, and groove. There's no wrong way to dance!

JUMP - Can you jump like a frog? Hop like a bunny? Leap like a kangaroo? Jumping makes you strong!

STRETCH - Reach your arms up to the sky like a tall tree. Bend down and touch your toes. Twist your body gently from side to side.

RUN - Run around your yard or in the park. Play tag with friends. Race to the mailbox and back!

ANIMAL WALKS - Walk like a bear (hands and feet on the ground), waddle like a penguin, slither like a snake, stomp like an elephant!

### Movement Break Right Now!

Let's move RIGHT NOW! Stand up and try these:
- Jump up and down 5 times
- Spin around in a circle
- Touch your toes
- Flap your arms like a bird
- March in place for 10 steps
- Take a big, deep breath

How do you feel? Better, right?

### Move Every Day

Try to move and play for at least 60 minutes every day. That's about as long as one movie! You can break it up - a little in the morning, some at recess, and more after school.

### Your Body is Amazing

Your body can do so many incredible things. Take care of it by moving, eating well, drinking water, and getting good sleep. You only get one body - treat it like the treasure it is!`,
    },
  ]);

  // ============================================================
  // PreK-K SOCIAL STUDIES - Our Neighborhood
  // ============================================================
  await db.insert(modules).values([
    {
      id: "social_prek_k_module_1", levelId: 1, subjectId: "social_prek_k", moduleNumber: 1,
      title: "My Family & Community", description: "Learn about families, community helpers, and what makes our neighborhood special.",
      durationWeeks: 3,
      storyArcTitle: "Our Neighborhood Friends",
      storyArcNarrative: "Every day, special people in our neighborhood work hard to keep us safe, healthy, and happy. Let's go on a neighborhood walk and meet the amazing helpers all around us!",
      learningObjectives: ["Describe your family and what makes it special", "Name community helpers and what they do", "Understand what it means to be part of a community", "Practice being a good neighbor"],
      activities: ["Draw your family", "Community helpers matching game", "What does a good neighbor do?", "Thank a helper in your community"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "social_prek_k_m1_l1", moduleId: "social_prek_k_module_1", lessonNumber: 1,
      title: "Community Helpers", durationMinutes: 15, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Firefighter", right: "Puts out fires and keeps us safe" },
          { left: "Doctor", right: "Helps us feel better when we're sick" },
          { left: "Teacher", right: "Helps us learn new things every day" },
          { left: "Mail carrier", right: "Brings letters and packages to our homes" },
          { left: "Police officer", right: "Protects our neighborhood" },
        ],
        instructions: "Match each community helper to what they do for us!",
      }),
      content: `## Community Helpers!

Look around your neighborhood. Do you see people going to work, driving trucks, or wearing special uniforms? These are COMMUNITY HELPERS - people whose jobs help everyone around them!

### Who Are Community Helpers?

FIREFIGHTERS wear big yellow coats and drive red fire trucks. They put out fires and rescue people. They are SO brave! If you ever need help in an emergency, call 911.

DOCTORS AND NURSES help us feel better when we're sick. They listen to our hearts, check our temperature, and give us medicine. Going to the doctor can feel scary, but they are there to HELP you.

TEACHERS help us learn amazing things! They are patient and kind, and they want to help you grow smarter every day. Your teacher is one of your biggest fans!

POLICE OFFICERS help keep our neighborhoods safe. They make sure people follow the rules so everyone is protected.

MAIL CARRIERS bring letters, cards, and packages right to your door! Rain or shine, they make sure we get our mail.

### Other Helpers

There are SO many more helpers:
- Trash collectors keep our streets clean
- Bus drivers take us where we need to go
- Librarians help us find amazing books
- Store workers make sure we have food and supplies
- Construction workers build our homes and schools

### Saying Thank You

Next time you see a community helper, smile and say "thank you!" It will make their day. Everyone likes to know their work matters.

### You Can Be a Helper Too!

You don't have to be a grown-up to help your community:
- Pick up litter you see on the ground
- Hold the door open for someone
- Help a younger child
- Be kind to everyone you meet

You are a community helper in the making!`,
    },
  ]);

  // ============================================================
  // GRADES 1-2 CONTENT
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ela_1_2_module_1", levelId: 1, subjectId: "ela_1_2", moduleNumber: 1,
      title: "Reading Adventures", description: "Build reading fluency with phonics patterns, word families, and exciting short stories.",
      durationWeeks: 4,
      storyArcTitle: "The Reading Rocket",
      storyArcNarrative: "You are a reading astronaut, blasting off to new worlds with every book you read! Each word you learn is fuel for your rocket. The more you read, the farther you fly. Let's power up your reading rocket!",
      learningObjectives: ["Decode words using phonics patterns (sh, ch, th)", "Read simple sentences with fluency", "Identify story elements: characters, setting, events", "Build vocabulary through context clues"],
      activities: ["Sound pattern detective game", "Read-along stories with comprehension questions", "Build sentences with word cards", "Story sequencing activity"],
    },
    {
      id: "math_1_2_module_1", levelId: 1, subjectId: "math_1_2", moduleNumber: 1,
      title: "Addition & Subtraction", description: "Master adding and taking away numbers up to 20 through stories, games, and real-life problems.",
      durationWeeks: 4,
      storyArcTitle: "The Math Market",
      storyArcNarrative: "Welcome to the Math Market, where everything has a number! When you buy 3 apples and then 2 more, how many do you have? When you eat 1, how many are left? Addition and subtraction are everywhere!",
      learningObjectives: ["Add numbers up to 20", "Subtract numbers from 20", "Solve simple word problems", "Use objects and pictures to show math"],
      activities: ["Shopping math game", "Number line jumps", "Story problems with pictures", "Fact family practice"],
    },
    {
      id: "science_1_2_module_1", levelId: 1, subjectId: "science_1_2", moduleNumber: 1,
      title: "Plants & Life Cycles", description: "Watch seeds grow into plants and discover how living things change over time.",
      durationWeeks: 3,
      storyArcTitle: "The Growing Garden",
      storyArcNarrative: "Every giant tree started as a tiny seed! In our garden, we'll watch the miracle of growth - from seed to sprout to flower. You'll discover that all living things go through amazing changes.",
      learningObjectives: ["Describe the parts of a plant", "Explain the life cycle of a plant", "Understand what plants need to grow", "Observe and record changes over time"],
      activities: ["Plant a seed and observe", "Label plant parts", "Life cycle sequencing", "Plant needs experiment"],
    },
    {
      id: "sel_1_2_module_1", levelId: 1, subjectId: "sel_1_2", moduleNumber: 1,
      title: "Managing Big Feelings", description: "Learn powerful strategies for handling anger, frustration, and worry in healthy ways.",
      durationWeeks: 3,
      storyArcTitle: "The Feelings Toolbox",
      storyArcNarrative: "Imagine you have a special toolbox, but instead of hammers and screwdrivers, it's filled with tools for your feelings! When anger shows up, you reach for a calming tool. When worry knocks on your door, you have a brave tool ready. Let's fill your toolbox!",
      learningObjectives: ["Identify triggers for big feelings", "Use 3+ calming strategies independently", "Express feelings with words instead of actions", "Know when to ask for help from a trusted adult"],
      activities: ["Feelings thermometer", "Calm-down strategy cards", "Role-play scenarios", "When to ask for help discussion"],
    },
    {
      id: "wellness_1_2_module_1", levelId: 1, subjectId: "wellness_1_2", moduleNumber: 1,
      title: "My Daily Routine", description: "Build healthy habits with morning routines, bedtime routines, and daily self-care practices.",
      durationWeeks: 3,
      storyArcTitle: "The Healthy Habits Hero",
      storyArcNarrative: "Heroes have routines! Just like a superhero puts on their cape every morning, you have your own powerful routine. Brushing teeth, eating breakfast, getting dressed - these habits make you strong, healthy, and ready for anything!",
      learningObjectives: ["Follow a morning routine independently", "Understand why sleep is important", "Practice dental hygiene", "Make healthy food choices"],
      activities: ["Morning routine checklist", "Bedtime routine builder", "Tooth brushing timer", "Healthy plate creator"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "ela_1_2_m1_l1", moduleId: "ela_1_2_module_1", lessonNumber: 1,
      title: "Sound Patterns: SH, CH, TH", durationMinutes: 20, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "SH", right: "ship, shoe, sheep" },
          { left: "CH", right: "cheese, chair, chicken" },
          { left: "TH", right: "think, three, thumb" },
        ],
        instructions: "Match each sound pattern to its words! Say each word out loud and listen for the pattern.",
      }),
      content: `## Sound Patterns: SH, CH, TH

You already know individual letter sounds. But did you know that sometimes TWO letters team up to make a completely NEW sound? These are called digraphs, but we'll call them Sound Teams!

### The SH Team

When S and H work together, they make the "shhhh" sound - like when someone says "Shhhh, be quiet!" Words with SH: ship, shoe, sheep, shell, fish, wash, wish

### The CH Team

C and H team up to make the "ch" sound - like a train: "ch-ch-ch-ch!" Words with CH: cheese, chair, chicken, chocolate, lunch, each, teacher

### The TH Team

T and H make the "th" sound - stick your tongue out a tiny bit! Words with TH: think, three, thumb, bath, math, with, the

### Practice Time

Read these sentences and find the Sound Team words:
- "She has three fish."
- "The chicken is on the chair."
- "I wish I had chocolate chips."

### You're Getting Stronger!

Sound Teams are like reading superpowers. Now you can read even more words! Keep reading everything you see - signs, labels, menus, and books!`,
    },
    {
      id: "math_1_2_m1_l1", moduleId: "math_1_2_module_1", lessonNumber: 1,
      title: "Adding Up!", durationMinutes: 20, activityType: "interactive",
      activityData: JSON.stringify({ type: "matching", pairs: [{ left: "3 + 2", right: "5" }, { left: "4 + 1", right: "5" }, { left: "2 + 6", right: "8" }, { left: "5 + 3", right: "8" }, { left: "7 + 3", right: "10" }], instructions: "Match each addition problem to its answer!" }),
      content: `## Adding Up!

Addition means putting things TOGETHER to find out how many you have in all. When you combine groups, you're adding!

### Real-Life Addition

You have 3 crayons. Your friend gives you 2 more. How many do you have now? Count them: 1, 2, 3... 4, 5! You have 5 crayons! We write it like this: 3 + 2 = 5

The + sign means "and" or "plus." The = sign means "equals" or "the same as."

### Strategies for Adding

COUNTING ON: Start with the bigger number and count up. For 5 + 3, start at 5 and count: 6, 7, 8!

USING FINGERS: Hold up fingers for each number and count them all.

DRAWING: Draw circles or dots for each number and count the total.

### Practice Problems

Try these:
- 2 + 3 = ? (Think: 2 cookies plus 3 cookies)
- 4 + 4 = ? (Think: 4 friends plus 4 more friends)
- 1 + 6 = ? (Think: 1 cat plus 6 more cats)
- 5 + 5 = ? (Think: 5 fingers plus 5 fingers = all your fingers!)

### Math Is Everywhere!

You use addition every day! Counting your toys, adding snacks, figuring out how many steps to the door. You're a mathematician!`,
    },
    {
      id: "sel_1_2_m1_l1", moduleId: "sel_1_2_module_1", lessonNumber: 1,
      title: "The Feelings Thermometer", durationMinutes: 20, activityType: "emotion_check",
      activityData: JSON.stringify({
        type: "emotion_check",
        emotions: ["Calm & Cool (1)", "A Little Upset (2)", "Getting Frustrated (3)", "Really Mad or Scared (4)", "About to Explode (5)"],
        prompt: "Where are you on the feelings thermometer right now? Pick the level that matches how you feel. There are no wrong answers!",
        followUp: "Great job checking in! If you're at a 3 or higher, try one of our calming tools before continuing.",
      }),
      content: `## The Feelings Thermometer

Have you ever noticed that your feelings can be small or BIG? A little bit of annoyance is different from REALLY ANGRY. Today we're going to learn a tool that helps us understand how big our feelings are.

### Your Feelings Thermometer

Imagine a thermometer, but instead of measuring temperature, it measures your feelings:

Level 1 - CALM & COOL: Everything feels fine. You're relaxed and happy. Your body feels loose.

Level 2 - A LITTLE UPSET: Something is bothering you a little bit. Maybe someone said something that wasn't nice, or you made a small mistake.

Level 3 - GETTING FRUSTRATED: Your feelings are getting bigger. Maybe you tried something and it didn't work. Maybe someone won't listen to you.

Level 4 - REALLY MAD OR SCARED: Big feelings! Your face might feel hot. Your muscles might be tight. You might want to yell or cry.

Level 5 - ABOUT TO EXPLODE: The biggest feelings! Everything feels overwhelming. You need help RIGHT NOW.

### What To Do At Each Level

Levels 1-2: You're doing great! Keep going with what you're doing.

Level 3: Time to use a calming tool! Try: Take 3 deep breaths, count to 10, or squeeze a stress ball.

Level 4: Stop what you're doing. Walk to your calm-down spot. Use breathing exercises. It's okay to cry.

Level 5: Ask a trusted adult for help. Say "I need help" or "I'm not okay." It takes courage to ask for help, and it's always the right thing to do.

### You're Not Alone

Everyone - kids AND adults - sometimes reach a 4 or 5 on the thermometer. It doesn't make you bad. It makes you human. What matters is learning to bring yourself back down. And the more you practice, the easier it gets!`,
    },
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
    { id: "q_ela_pk_1", moduleId: "ela_prek_k_module_1", questionText: "What letter does the word APPLE start with?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }, { id: "d", text: "D" }]), correctAnswer: "a", explanation: "Apple starts with the letter A! A says 'aah' like in Apple.", points: 10 },
    { id: "q_ela_pk_2", moduleId: "ela_prek_k_module_1", questionText: "What sound does the letter B make?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "sss" }, { id: "b", text: "buh" }, { id: "c", text: "mmm" }, { id: "d", text: "rrr" }]), correctAnswer: "b", explanation: "B makes the 'buh' sound! Like Bear, Ball, and Banana.", points: 10 },
    { id: "q_ela_pk_3", moduleId: "ela_prek_k_module_2", questionText: "Which is a sight word?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "elephant" }, { id: "b", text: "the" }, { id: "c", text: "dinosaur" }, { id: "d", text: "butterfly" }]), correctAnswer: "b", explanation: "'The' is a sight word - a small word you see everywhere! You learned it!", points: 10 },
    { id: "q_math_pk_1", moduleId: "math_prek_k_module_1", questionText: "How many fingers are on one hand?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "3" }, { id: "b", text: "4" }, { id: "c", text: "5" }, { id: "d", text: "10" }]), correctAnswer: "c", explanation: "You have 5 fingers on each hand! Count them: 1, 2, 3, 4, 5!", points: 10 },
    { id: "q_math_pk_2", moduleId: "math_prek_k_module_2", questionText: "What shape is a wheel?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Square" }, { id: "b", text: "Triangle" }, { id: "c", text: "Circle" }, { id: "d", text: "Rectangle" }]), correctAnswer: "c", explanation: "A wheel is a circle - round and round with no corners!", points: 10 },
    { id: "q_sci_pk_1", moduleId: "science_prek_k_module_1", questionText: "What should you wear on a rainy day?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Sunglasses" }, { id: "b", text: "Rain boots and raincoat" }, { id: "c", text: "Swimsuit" }, { id: "d", text: "Shorts" }]), correctAnswer: "b", explanation: "Rain boots and a raincoat keep you dry when it rains! Good thinking!", points: 10 },
    { id: "q_sel_pk_1", moduleId: "sel_prek_k_module_1", questionText: "Is it okay to feel angry sometimes?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "No, you should never be angry" }, { id: "b", text: "Yes! All feelings are okay" }, { id: "c", text: "Only on weekends" }, { id: "d", text: "Only grown-ups can be angry" }]), correctAnswer: "b", explanation: "YES! All feelings are okay - even anger. What matters is what we DO with our feelings. We can feel angry but we handle it with care.", points: 10 },
    { id: "q_sel_pk_2", moduleId: "sel_prek_k_module_1", questionText: "What can you do when your feelings get too big?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Hold your breath forever" }, { id: "b", text: "Yell at someone" }, { id: "c", text: "Take slow, deep breaths" }, { id: "d", text: "Run as fast as you can" }]), correctAnswer: "c", explanation: "Taking slow, deep breaths (like Balloon Breath!) helps calm your body and mind. It's like giving yourself a gentle hug from the inside.", points: 10 },
    { id: "q_well_pk_1", moduleId: "wellness_prek_k_module_1", questionText: "When should you wash your hands?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Only at bedtime" }, { id: "b", text: "Before eating and after the bathroom" }, { id: "c", text: "Once a week" }, { id: "d", text: "Never" }]), correctAnswer: "b", explanation: "Washing hands before eating and after using the bathroom keeps germs away and keeps you healthy!", points: 10 },
    { id: "q_well_pk_2", moduleId: "wellness_prek_k_module_1", questionText: "Which is an 'everyday food' that helps your body grow?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Candy bar" }, { id: "b", text: "Soda" }, { id: "c", text: "Apple" }, { id: "d", text: "Cookies" }]), correctAnswer: "c", explanation: "Apples are an everyday food full of vitamins that help your body grow strong and healthy!", points: 10 },
    { id: "q_sel_35_1", moduleId: "sel_3_5_module_1", questionText: "What does having a 'growth mindset' mean?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Believing you're either smart or you're not" }, { id: "b", text: "Believing you can learn and improve with effort" }, { id: "c", text: "Never making any mistakes" }, { id: "d", text: "Being the smartest in class" }]), correctAnswer: "b", explanation: "A growth mindset means believing that your brain can grow and learn new things through effort and practice. You can always improve!", points: 10 },
    { id: "q_sel_68_1", moduleId: "sel_6_8_module_1", questionText: "When you're struggling with your identity, the best thing to do is:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Pretend everything is fine" }, { id: "b", text: "Copy exactly what others are doing" }, { id: "c", text: "Explore your values and be patient with yourself" }, { id: "d", text: "Give up trying to figure it out" }]), correctAnswer: "c", explanation: "Identity exploration is a journey, not a destination. Being patient with yourself and exploring what you truly value is the healthiest approach.", points: 10 },
    { id: "q_sel_912_1", moduleId: "sel_9_12_module_1", questionText: "Asking for help with mental health is:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "A sign of weakness" }, { id: "b", text: "Something only 'crazy' people do" }, { id: "c", text: "One of the bravest things you can do" }, { id: "d", text: "Not necessary if you're strong" }]), correctAnswer: "c", explanation: "Asking for help takes real courage and strength. Mental health is health, period. Everyone deserves support.", points: 10 },
  ]);

  // ============================================================
  // NEW SUBJECT BADGES
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
  ]);
}
