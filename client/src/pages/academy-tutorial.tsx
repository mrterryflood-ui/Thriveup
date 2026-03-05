import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Flag,
  CalendarCheck,
  Lightbulb,
  Gamepad2,
  TrendingUp,
  Building2,
  Trophy,
  Store,
  ShoppingBag,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Zap,
  Target,
  Star,
  Award,
  BookOpen,
  Heart,
  Users,
  Rocket,
  ArrowRight,
  Mail,
  Shield,
  Sparkles,
  Brain,
  HeartHandshake,
  Presentation,
  MessageCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface ChapterStats {
  wallet: number;
  pantherPower: number;
  housePoints: number;
  collegeFund?: number;
  adventuresCompleted?: number;
  marketplaceSales?: number;
  stocksPortfolio?: number;
}

interface ChapterLink {
  label: string;
  href: string;
  icon: typeof User;
}

interface Chapter {
  title: string;
  subtitle: string;
  icon: typeof User;
  narrative: string[];
  quote: string;
  quoteAuthor: string;
  links: ChapterLink[];
  stats: ChapterStats;
  characters?: string[];
}

const CHAPTERS: Chapter[] = [
  {
    title: "Welcome, Arthur",
    subtitle: "First Day & Avatar Creation",
    icon: User,
    characters: ["Arthur", "Coach Marcus"],
    narrative: [
      "Arthur Wakanda walks through the doors of AI Mastery Academy for the very first time. His hands are a little sweaty, his backpack feels heavier than usual, and the hallway seems to stretch forever. But then he sees it -- a giant banner that reads: \"Welcome, Young Panthers. Your Empire Starts Here.\" Something in his chest loosens, just a little.",
      "His first stop is the Avatar Creator, where he designs his own digital identity. He picks his hairstyle, adds a fresh pair of sneakers, and even chooses a panther emblem for his jacket. For the first time today, Arthur smiles. This version of himself looks confident, ready for anything. He receives his starter wallet with $100 in virtual credits -- not much, but every empire begins somewhere.",
      "A tall man with kind eyes and a Howard University polo steps forward. \"I am Coach Marcus, your house leader,\" he says, extending a hand. \"I have been where you are, young brother. Nervous, unsure, full of questions. That is exactly where greatness begins.\" Arthur shakes his hand and feels a spark of belonging. Coach Marcus explains the merit system, the house competitions, and the Panther Power pillars. Arthur does not understand everything yet, but he knows one thing: someone here believes in him already.",
    ],
    quote: "The journey of a thousand miles begins with a single step. Today, you took yours.",
    quoteAuthor: "Welcome message to all new Panthers",
    links: [
      { label: "Avatar Creator", href: "/academy/avatar", icon: User },
      { label: "House System", href: "/academy/houses", icon: Flag },
    ],
    stats: { wallet: 100, pantherPower: 0, housePoints: 0, collegeFund: 0 },
  },
  {
    title: "Meet the Panthers",
    subtitle: "Sim Characters & House Sorting",
    icon: Users,
    characters: ["Arthur", "Maya", "DeShawn", "Jasmine", "Amara", "Coach Marcus"],
    narrative: [
      "Homeroom buzzes with energy as Arthur slides into his seat. The girl next to him is sketching a building on her tablet with precise, elegant lines. \"I am Maya Chen,\" she says without looking up. \"I am going to design buildings that change skylines someday.\" Across the aisle, a boy in a sharp blazer is checking stock prices on his phone. \"DeShawn Williams,\" he says with a confident nod. \"I will be on Wall Street before I am twenty.\"",
      "At the art table, Jasmine Torres is already designing a logo for the class. Her sketchbook is bursting with color -- fonts, patterns, brand concepts that look professional. Near the window, Amara Okafor is organizing a sign-up sheet for a community garden project she started over the summer. She has already collected twelve signatures before the first bell rings.",
      "House sorting happens after lunch. Coach Marcus calls names one by one. Arthur and Maya land in the Crimson Lions -- a house known for courage and heart. DeShawn joins the Golden Eagles, and the friendly rivalry begins immediately. \"Lions versus Eagles,\" DeShawn grins. \"May the best house win.\" Arthur feels the weight of his house name settle on his shoulders. These are his people now, and he wants to make them proud.",
    ],
    quote: "Surround yourself with people who push you to be better. That is your first investment.",
    quoteAuthor: "Coach Marcus, House Sorting Day",
    links: [
      { label: "House System", href: "/academy/houses", icon: Flag },
      { label: "Avatar Creator", href: "/academy/avatar", icon: User },
    ],
    stats: { wallet: 100, pantherPower: 10, housePoints: 5, collegeFund: 0 },
  },
  {
    title: "Spark Lights the Way",
    subtitle: "AI Companion Discovery",
    icon: Sparkles,
    characters: ["Arthur", "Spark AI"],
    narrative: [
      "Arthur is stuck. The Social Studies reading assignment might as well be written in another language. He stares at the screen, re-reading the same paragraph about economic systems for the fourth time. Nothing clicks. Then he notices a glowing icon in the corner of his dashboard labeled \"Spark -- Your AI Learning Companion.\" He clicks it, half-expecting a boring chatbot.",
      "Spark is different. Instead of dumping answers, Spark asks Arthur what he already knows. \"What do you think an economy is, in your own words?\" Arthur types something simple, and Spark builds on it, connecting his everyday experiences -- buying lunch, trading cards with friends -- to bigger concepts. Within fifteen minutes, the reading assignment makes sense. Spark never made him feel dumb. It met him exactly where he was.",
      "Arthur starts using Spark every day. Before a Science quiz, Spark walks him through the water cycle using questions that make Arthur think instead of memorize. After a tough ELA essay, Spark helps him find stronger words without rewriting his sentences. \"I believe in your ability to figure this out,\" Spark says after every session. Arthur realizes he has something he has never had before: a tutor who is available at 2 AM, who never loses patience, and who genuinely believes he can learn anything.",
    ],
    quote: "The best teachers do not give you the answers. They help you find your own.",
    quoteAuthor: "Arthur, after his first week with Spark",
    links: [
      { label: "Spark AI Companion", href: "/ai-companion", icon: Sparkles },
    ],
    stats: { wallet: 120, pantherPower: 25, housePoints: 10, collegeFund: 0 },
  },
  {
    title: "The AI Mastery Path",
    subtitle: "Curriculum & Core Subjects",
    icon: Brain,
    characters: ["Arthur", "Ms. Richardson", "Spark AI"],
    narrative: [
      "Arthur opens the AI Mastery curriculum and discovers five levels waiting for him, each one building on the last. Level 1 starts with the basics: understanding how AI works, how to ask good questions, and how to think critically about information. He moves through modules on ELA, Math, Science, and Social Studies, each one showing him how AI tools can help him learn faster and deeper.",
      "Ms. Richardson's Social Studies class changes everything. She is the kind of teacher who makes history feel alive. When she talks about how communities build wealth across generations, Arthur leans forward in his seat. She notices. After class, she pulls him aside. \"You have a natural curiosity for how the world works, Arthur. That is rare. Feed it.\" Those words become fuel.",
      "Arthur completes his Level 1 modules and earns his first digital certificate. He screenshots it and sends it to his parents. The subjects blur together in the best way -- a Math lesson on percentages connects to a Science lesson on data, which connects to a Social Studies project on community economics. Spark helps him see the threads between everything. For the first time, school feels less like separate boxes and more like one big, connected puzzle.",
    ],
    quote: "Education is not the filling of a pail, but the lighting of a fire.",
    quoteAuthor: "Ms. Richardson, Social Studies class",
    links: [
      { label: "AI Mastery Curriculum", href: "/curriculum", icon: Brain },
      { label: "Core Subjects", href: "/subjects", icon: BookOpen },
    ],
    stats: { wallet: 150, pantherPower: 55, housePoints: 20, collegeFund: 0 },
  },
  {
    title: "Daily Grind",
    subtitle: "Quests & Life Lessons",
    icon: CalendarCheck,
    characters: ["Arthur", "Amara"],
    narrative: [
      "Every morning, Arthur checks his Daily Quests before breakfast. Today's challenge: \"Teach someone one thing you learned this week.\" He finds a younger student struggling with fractions and spends ten minutes at the whiteboard. The student's face lights up when it finally clicks, and Arthur earns 15 Panther Power points. He is starting to understand that teaching is just learning from the other side.",
      "Life Lessons class connects the classroom to the real world in ways Arthur never expected. A lesson about budgeting turns into a conversation about his parents' grocery shopping. A discussion about leadership becomes a debate about what makes a good team captain. Arthur starts carrying a small notebook to write down the things that surprise him.",
      "Amara challenges him to a community quest: organize a book drive for the elementary school next door. Arthur is hesitant -- he has never organized anything -- but Amara walks him through it. They collect sixty-two books in three days. The five Panther Power pillars start making real sense now: Education, Character, Leadership, Entrepreneurship, and Community. They are not just categories on a screen. They are the shape of the person Arthur is becoming.",
    ],
    quote: "You do not have to be great to start, but you have to start to be great.",
    quoteAuthor: "Life Lesson #3",
    links: [
      { label: "Daily Quests", href: "/academy/quests", icon: CalendarCheck },
      { label: "Life Lessons", href: "/academy/lessons", icon: Lightbulb },
    ],
    stats: { wallet: 200, pantherPower: 95, housePoints: 35, collegeFund: 0 },
  },
  {
    title: "Finding His Voice",
    subtitle: "Social-Emotional Learning",
    icon: HeartHandshake,
    characters: ["Arthur", "Maya", "Spark AI"],
    narrative: [
      "Arthur fails a Math quiz. Not by a little -- by a lot. He stares at the score and feels his face burn. He wants to shove the paper in his backpack and pretend it never happened. At lunch, he sits alone for the first time in weeks, poking at his food and replaying every wrong answer in his head.",
      "That night, he opens Spark, not for homework but because he does not know who else to talk to. Spark walks him through a Social-Emotional Learning exercise: naming what he feels, understanding why he feels it, and choosing what to do next. \"Embarrassment is not a sign of weakness,\" Spark says. \"It is a sign that you care about doing well. That matters.\" Arthur works through the Wellness and Self-Care module, learning about resilience, growth mindset, and the science of bouncing back.",
      "The next day, Maya sits down next to him. \"I saw your face yesterday,\" she says quietly. \"I failed reading in 4th grade. Like, really failed. I cried every night for a month.\" Arthur looks at her -- this brilliant girl who sketches skyscrapers -- and cannot believe she ever struggled. \"The struggle is the point,\" she says. \"That is where the growing happens.\" Arthur retakes the quiz a week later and scores 82. Not perfect, but proof that he is not defined by his worst day.",
    ],
    quote: "Vulnerability is not weakness. It is the birthplace of courage, connection, and growth.",
    quoteAuthor: "Wellness module, SEL curriculum",
    links: [
      { label: "Core Subjects & SEL", href: "/subjects", icon: HeartHandshake },
      { label: "Spark AI Companion", href: "/ai-companion", icon: Sparkles },
    ],
    stats: { wallet: 220, pantherPower: 130, housePoints: 45, collegeFund: 0 },
  },
  {
    title: "The Lemonade Stand Empire",
    subtitle: "First CYOA Adventure",
    icon: Gamepad2,
    characters: ["Arthur", "DeShawn"],
    narrative: [
      "Arthur's eyes light up when he discovers the Choose Your Own Adventure scenarios. His first adventure is \"The Lemonade Stand Empire\" -- a business simulation where every decision has real consequences. He chooses a busy corner near the school, prices his lemonade at two dollars a cup, and spends wallet credits on a colorful sign. Day one is a hit: forty-five cups sold. Arthur feels invincible.",
      "Then disaster strikes. A massive rainstorm rolls in on day two. Nobody wants cold lemonade in the rain. Arthur watches his virtual customers walk past, and his stomach sinks. He has already spent money on supplies. The adventure gives him a choice: quit and cut his losses, or adapt and try something new.",
      "Arthur pivots. He switches to hot chocolate, uses the leftover lemons for cookies, and runs a \"rainy day special.\" By the end of the week, he has earned back everything he lost and then some. DeShawn finds him after class and grins. \"That is what real investors do,\" he says. \"They do not cry about the rain. They sell umbrellas.\" Arthur writes the lesson in his journal and underlines it twice: every setback is a setup for a comeback.",
    ],
    quote: "Every entrepreneur faces setbacks. The ones who succeed are the ones who learn and try again.",
    quoteAuthor: "Arthur's journal entry",
    links: [
      { label: "Adventures (CYOA)", href: "/academy/scenarios", icon: Gamepad2 },
    ],
    stats: { wallet: 350, pantherPower: 175, housePoints: 60, collegeFund: 0 },
  },
  {
    title: "Wall Street Panthers",
    subtitle: "Stock Market & Investments",
    icon: TrendingUp,
    characters: ["Arthur", "DeShawn"],
    narrative: [
      "DeShawn has been talking about the virtual stock market all week, and Arthur finally takes the plunge. DeShawn walks him through the basics during study hall: how to read charts, what market cap means, why diversification matters. \"Never put all your eggs in one basket,\" DeShawn says, tapping the screen. \"That is rule number one.\"",
      "Arthur invests in three companies. TechPanthers Inc, an ed-tech firm, climbs 15% -- a solid first win. CommunityBuild Co drops 5%, and Arthur's stomach sinks, but DeShawn tells him to hold steady. Then EduFuture Ltd starts climbing: 10%, 15%, 22%. When EduFuture releases a positive earnings report and the stock doubles, Arthur's small investment turns into his biggest return yet.",
      "But the real lesson is not about the money. Arthur learns patience -- watching a stock dip and resisting the urge to panic sell. He learns research -- reading about companies before investing instead of guessing. And he learns from DeShawn that even the best investors lose sometimes. \"The goal is not to never lose,\" DeShawn says. \"The goal is to learn from every trade.\" Arthur starts tracking his portfolio daily, and the numbers start telling stories he can actually read.",
    ],
    quote: "The stock market is a device for transferring money from the impatient to the patient.",
    quoteAuthor: "Financial Literacy lesson",
    links: [
      { label: "Stock Market", href: "/academy/stocks", icon: TrendingUp },
    ],
    stats: { wallet: 580, pantherPower: 230, housePoints: 80, collegeFund: 0 },
  },
  {
    title: "The Money Truth",
    subtitle: "Financial Literacy Academy",
    icon: DollarSign,
    characters: ["Arthur", "DeShawn", "Coach Marcus"],
    narrative: [
      "A new building appears on the Panther Village map: the Financial Literacy Academy. Arthur clicks on it out of curiosity and finds himself reading the story of Warren Buffett, who bought his first stock at age 11 and became one of the richest people in history -- not through shortcuts, but through patience and discipline. \"The stock market transfers money from the impatient to the patient,\" the lesson reads. Arthur thinks about his own virtual portfolio and realizes he has been checking prices every five minutes instead of thinking long-term.",
      "The lesson on scams hits differently. Arthur watches a video about pyramid schemes and suddenly recognizes the pattern: someone at school was trying to convince kids to each chip in credits for a 'guaranteed doubling' scheme. The math does not work. If each person recruits five, by level thirteen you would need more people than exist on Earth. Arthur tells DeShawn, who was about to join. \"Bro, that is a pyramid scheme,\" Arthur says, showing him the red flags: guaranteed returns, recruit-your-friends pressure, act-now urgency. DeShawn's eyes widen. \"You just saved me fifty credits.\"",
      "But the module that sticks with Arthur the most is about residual income. He learns that a laundromat owner invests once and earns money every day while the machines work around the clock. A car wash, a rental property, a song that plays on the radio for decades -- these are assets, not just jobs. Coach Marcus finds Arthur after class sketching out a plan for a digital study guide subscription service. \"Instead of selling each guide once, what if students pay a small monthly fee for access to all of them?\" Arthur asks. Coach Marcus grins. \"Now you are thinking like a real businessman. Not a one-hit wonder -- a system builder.\"",
    ],
    quote: "Rich people do not work for money. They build systems that work for them. Start building yours today.",
    quoteAuthor: "Financial Literacy Academy, Module 7",
    links: [
      { label: "Financial Literacy", href: "/academy/financial-literacy", icon: DollarSign },
      { label: "Stock Market", href: "/academy/stocks", icon: TrendingUp },
    ],
    stats: { wallet: 700, pantherPower: 320, housePoints: 140, collegeFund: 0 },
  },
  {
    title: "Ballers and Broke",
    subtitle: "Athletes, Rappers & Real Wealth",
    icon: TrendingUp,
    characters: ["Arthur", "DeShawn", "Ms. Rivera"],
    narrative: [
      "The Financial Literacy Academy has a section Arthur cannot stop reading: real stories about athletes and rappers who earned millions and lost it all. Allen Iverson made over $200 million in the NBA and went broke because he spent $600,000 a month on jewelry, cars, and an entourage of 50 people. Antoine Walker earned $108 million and filed for bankruptcy two years after retiring. He once spent a million dollars in a single weekend. \"How do you lose $108 million?\" DeShawn asks, genuinely confused. Ms. Rivera answers quietly: \"The same way you lose $108 -- one bad decision at a time, with no plan.\"",
      "But then Arthur reads about LeBron James and Shaquille O'Neal, and the contrast is stark. LeBron lived off his endorsement money and invested almost every dollar of his NBA salary. He hired financial advisors before buying his first house. By his thirties, his business empire was worth over a billion dollars. Shaq wasted a million dollars in his first thirty minutes as a millionaire, but then got serious. He earned an MBA, bought over 150 car washes and dozens of restaurant franchises, and invested in Google and Apple early. Today Shaq is worth more than he ever earned playing basketball. \"Same league, same money, completely different outcomes,\" Arthur says. \"The difference is a plan.\"",
      "Jay-Z's story hits Arthur hardest. He went from selling CDs out of his car trunk to becoming hip-hop's first billionaire, not just from music but from owning record labels, clothing lines, champagne brands, and real estate. He built systems that generate money whether he makes another song or not. Arthur looks at his own virtual study guide business and thinks: what if instead of just selling guides, he built a subscription platform? What if he licensed his content to other students to resell? He starts sketching a business plan right there in the Academy. Ms. Rivera sees it and smiles. \"Now you are thinking like an owner, not just an earner.\"",
    ],
    quote: "Talent makes you money. Financial literacy lets you keep it. Only one of those is taught in school -- until now.",
    quoteAuthor: "Financial Literacy Academy",
    links: [
      { label: "Financial Literacy", href: "/academy/financial-literacy", icon: DollarSign },
      { label: "Stock Market", href: "/academy/stocks", icon: TrendingUp },
    ],
    stats: { wallet: 750, pantherPower: 340, housePoints: 150, collegeFund: 0 },
  },
  {
    title: "Reading the Signs",
    subtitle: "Data-Driven Decisions",
    icon: BarChart3,
    characters: ["Arthur", "Ms. Rivera", "Spark"],
    narrative: [
      "Ms. Rivera pulls up the class Thrive Dashboard on the main screen. \"Every one of you has a personal analytics dashboard tracking six areas of your growth,\" she explains. Arthur opens his own and sees the trend lines for the first time. His Learning score is climbing steadily, but his Belonging score has been dipping for two weeks. He had not noticed, but the data caught it. \"That is the power of tracking patterns,\" Ms. Rivera says. \"Data spots what feelings might miss.\"",
      "Spark walks Arthur through the Stock Market charts next. \"See how TechVenture stock rose slowly for three weeks before jumping on earnings day? That upward trend was a signal. But PantherMedia swung up and down wildly every day, which means high risk.\" Arthur realizes he has been buying stocks based on names he liked instead of reading the actual data. He pulls up the Marketplace too and notices his study guide sat unsold for five days. \"The data says your price was too high or nobody needed that subject,\" Spark explains. \"A food truck owner in Austin does the exact same analysis every night, checking which items sold and which did not.\"",
      "The real breakthrough comes when Arthur checks his Panther Power breakdown. Education and Entrepreneurship are strong, but Leadership and Community are lagging. The data is clear: he has been focused on individual work and has not led a group or contributed to campus projects. He signs up to captain a competition team that afternoon. \"I thought I was doing great overall,\" Arthur tells Ms. Rivera. She smiles. \"You were. But great is not the same as balanced. The data showed you exactly where to grow next.\"",
    ],
    quote: "The best decision-makers do not guess. They gather data, study the patterns, and then act.",
    quoteAuthor: "Financial Literacy Academy, Module 9",
    links: [
      { label: "Financial Literacy", href: "/academy/financial-literacy", icon: DollarSign },
    ],
    stats: { wallet: 800, pantherPower: 360, housePoints: 160, collegeFund: 0 },
  },
  {
    title: "House of Lions",
    subtitle: "House Points & Competitions",
    icon: Trophy,
    characters: ["Arthur", "Maya", "DeShawn", "Coach Marcus"],
    narrative: [
      "The house standings go up on the big screen, and the Crimson Lions are sitting in third place. Arthur stares at the board and feels something ignite. He gathers his housemates in the common room. \"We are not third-place people,\" he says, surprised by the conviction in his own voice. Maya nods. Coach Marcus watches from the doorway, arms crossed, a quiet smile on his face.",
      "The Academic Bowl competition is announced: four subjects, four rounds, one champion house. Arthur signs up for Social Sciences. Maya takes Math. They study together every afternoon, quizzing each other until the material becomes second nature. Spark helps Arthur prepare with practice questions that adapt to his weak spots. The night before the competition, Coach Marcus pulls Arthur aside. \"Win or lose, I am proud of you for stepping up. That is what leaders do.\"",
      "Competition day is electric. Students from every house bring their best. Arthur's hands shake as he answers question after question in Social Sciences. When the results come in, Maya wins first place in Math and Arthur takes second in Social Sciences. The combined points surge the Crimson Lions from third to first place. The room erupts. Arthur has never felt anything like this -- the roar of his house, Maya's high-five, Coach Marcus's proud nod from the back of the room.",
    ],
    quote: "You are not competing against others. You are competing against the person you were yesterday.",
    quoteAuthor: "Coach Marcus, competition day",
    links: [
      { label: "House System", href: "/academy/houses", icon: Flag },
      { label: "Competitions", href: "/academy/competitions", icon: Trophy },
    ],
    stats: { wallet: 800, pantherPower: 360, housePoints: 180, collegeFund: 0 },
  },
  {
    title: "Game Room Showdown",
    subtitle: "Strategy & Competition",
    icon: Gamepad2,
    characters: ["Arthur", "DeShawn", "Maya"],
    narrative: [
      "The Panther Game Room opens during lunch period, and the buzz is immediate. Arthur watches as students crowd around the entrance, eager to play. Inside, six game stations line the walls: Dominoes, Checkers, Chess, Memory Match, Spades, and Strategy Tiles. The Dominoes table is already packed. Arthur has never played Block Dominoes before, but DeShawn waves him over. \"Come on, Wakanda. Let me show you how we do this.\"",
      "Arthur picks Beginner difficulty against the computer and learns the rules quickly -- match the dots, block your opponent, manage your hand. But then he discovers the special draw rule: if he needs to draw from the boneyard, he has to do it within his remaining time. He draws with just one second left and gets a fifteen-second bonus. His heart pounds as he races to play the drawn tile before the clock runs out. He wins his first game and watches his ELO rating appear on the leaderboard. It is not high yet, but it is his.",
      "Within a week, Arthur has climbed from Beginner to Intermediate difficulty. Maya challenges him to see who can reach Pro level first. The competition pushes both of them to study strategy -- counting tiles, blocking opponents, managing the clock. Arthur starts seeing patterns everywhere, not just in dominoes but in math class and even in his stock market decisions. Coach Marcus notices the change. \"Games teach you to think three moves ahead,\" he says. \"That is not just a domino skill. That is a life skill.\" Arthur's ELO rating climbs to 1,350, and his name sits fourth on the school leaderboard. Not bad for someone who did not know the rules two weeks ago.",
    ],
    quote: "Every game you play is a lesson in strategy, patience, and resilience. The board does not care about excuses -- only your next move.",
    quoteAuthor: "Coach Marcus, Game Room opening day",
    links: [
      { label: "Game Room", href: "/academy/games", icon: Gamepad2 },
      { label: "Competitions", href: "/academy/competitions", icon: Trophy },
    ],
    stats: { wallet: 850, pantherPower: 390, housePoints: 200, collegeFund: 0 },
  },
  {
    title: "Building the Dream Campus",
    subtitle: "Campus Builder",
    icon: Building2,
    characters: ["Arthur", "Maya"],
    narrative: [
      "The Build Your Black Campus project launches, and something clicks inside Arthur. Inspired by historically Black colleges and universities, students get to design a virtual campus from the ground up. Arthur and Maya become building partners immediately. Her architectural eye and his vision for community spaces make them a powerful team.",
      "Together they design a library with floor-to-ceiling windows that flood the reading rooms with light. They add a student entrepreneurship center with co-working spaces and a pitch stage. Maya sketches a community garden between the buildings, and Arthur adds a mentorship pavilion where older students can meet with younger ones. Every contribution earns campus points and wallet credits.",
      "Arthur spends some of his hard-earned wallet credits to fund the entrepreneurship center's development. When he sees his name appear on the contributor wall alongside Maya's and dozens of other students, something shifts inside him. This is not just a project -- it is proof that his ideas can become real things in the world. He screenshots the contributor wall and stares at it for a long time before closing his laptop.",
    ],
    quote: "Build something that outlasts you. That is the definition of legacy.",
    quoteAuthor: "Campus Builder welcome message",
    links: [
      { label: "Build Campus", href: "/academy/campus", icon: Building2 },
    ],
    stats: { wallet: 900, pantherPower: 460, housePoints: 240, collegeFund: 0 },
  },
  {
    title: "Dream Design",
    subtitle: "Planning for Howard",
    icon: Target,
    characters: ["Arthur", "Ms. Richardson", "Coach Marcus"],
    narrative: [
      "Arthur opens Dream Design and types two words that make his heart pound: \"Howard University.\" The platform asks him what he wants to study, and he types \"Social Science Engineering\" because Ms. Richardson told him about a program that combines community development with data and design. He starts building his profile -- academic scores, leadership roles, community service hours, entrepreneurship ventures -- and watches a roadmap form on the screen.",
      "Ms. Richardson sits with him after class and walks him through what admissions committees look for. \"They want to see who you are, not just what you scored,\" she says. \"They want to see growth, curiosity, and impact.\" Arthur sets concrete goals for each Panther Power category. Education: complete Level 3 of AI Mastery. Leadership: become a house captain. Community: organize two more service projects. The goals feel ambitious but reachable.",
      "The moment that changes everything comes after school. Coach Marcus finds Arthur at his locker and leans against the wall. \"You know I went to Howard, right?\" Arthur shakes his head. Coach Marcus smiles. \"I walked those halls. I sat in those classrooms. I wore that bison blue.\" He pauses. \"And someday, Arthur, you will too. I see it in you.\" Arthur does not cry, but his eyes sting all the way home. Someone who has been where he wants to go just told him he can make it.",
    ],
    quote: "A dream written down with a plan becomes a goal. A goal broken down into steps becomes a reality.",
    quoteAuthor: "Dream Design welcome screen",
    links: [
      { label: "Dream Design", href: "/academy/dreams", icon: Target },
    ],
    stats: { wallet: 850, pantherPower: 510, housePoints: 260, collegeFund: 0 },
  },
  {
    title: "Study Guide Empire",
    subtitle: "Marketplace Launch",
    icon: Store,
    characters: ["Arthur", "Jasmine", "Amara"],
    narrative: [
      "The idea keeps Arthur up at night: what if he could share what he has learned with other students? He remembers how lost he felt in Social Studies before Spark and Ms. Richardson made it click. His notes, memory tricks, and practice questions could help someone else the way they helped him. He opens the Panther Marketplace and lists his first product: \"Arthur's Social Science Study Guide -- Volume 1\" for 25 credits.",
      "The first sale comes within an hour. Then another. By the end of the day, Arthur has sold six copies. Students from every house start telling him his guides helped them understand concepts they were struggling with. But Arthur knows the guides could look better. He finds Jasmine Torres in the art room and asks for help. Jasmine designs stunning covers with bold typography and clean layouts. Version 2 launches and sales double overnight.",
      "Scaling becomes the next challenge. Arthur cannot keep up with orders and customer questions alone. He asks Amara to help with distribution and customer support, offering her a percentage of each sale. Amara agrees instantly -- she is already running the biggest marketplace store in the academy. Arthur learns something that no textbook taught him: delegation is not weakness. It is the sign of a leader who knows their limits and trusts their team.",
    ],
    quote: "The best businesses do not just make money. They make a difference in people's lives.",
    quoteAuthor: "Entrepreneurship Life Lesson",
    links: [
      { label: "Marketplace", href: "/academy/marketplace", icon: Store },
    ],
    stats: { wallet: 1300, pantherPower: 580, housePoints: 290, collegeFund: 0 },
  },
  {
    title: "The Leadership Challenge",
    subtitle: "Second CYOA Adventure",
    icon: Gamepad2,
    characters: ["Arthur", "Coach Marcus"],
    narrative: [
      "Arthur's second Choose Your Own Adventure scenario is called \"The Team Project Challenge,\" and it is nothing like the lemonade stand. This time, he is leading a team of five virtual students on a community project. Everything starts smoothly until two team members clash over the direction of the project. One wants to build a playground, the other insists on a community kitchen. The tension is real, even in a simulation.",
      "Arthur makes a choice: he sides with one team member without hearing the other out. The result is devastating. The excluded member quits the project, morale drops, and the deadline slips. Arthur stares at the screen, feeling the weight of a bad decision. But the scenario does not end there. It offers a path forward: go back, listen to both sides, and find a compromise.",
      "Arthur takes the second path. He schedules individual conversations, uses active listening techniques from his SEL training, and proposes a combined project: a community kitchen with an outdoor eating area near a small playground. The team rallies. The project succeeds. When Arthur finishes the scenario, Coach Marcus is standing behind him. \"I saw what you did there,\" Coach Marcus says. \"You made a mistake, and instead of running, you fixed it. That is leadership, young brother.\" Arthur's Leadership power surges to its highest level yet.",
    ],
    quote: "A leader is not someone who never makes mistakes. A leader is someone who learns from them and lifts others up.",
    quoteAuthor: "CYOA scenario debrief",
    links: [
      { label: "Adventures (CYOA)", href: "/academy/scenarios", icon: Gamepad2 },
    ],
    stats: { wallet: 1400, pantherPower: 650, housePoints: 320, collegeFund: 0 },
  },
  {
    title: "Parents in the Picture",
    subtitle: "Stakeholder Spotlight",
    icon: Heart,
    characters: ["Arthur", "Mr. & Mrs. Wakanda", "Ms. Richardson", "Coach Marcus"],
    narrative: [
      "Mr. and Mrs. Wakanda have been hearing Arthur talk about the Academy every night at dinner -- Panther Power, Spark, marketplace sales, house competitions -- but they have not seen it for themselves until they discover the Parent Dashboard. Mrs. Wakanda opens it on her tablet after dinner and scrolls through Arthur's progress: every quest completed, every module passed, every power category growing steadily upward. Her eyes fill with tears. \"Baby, look at this,\" she whispers to her husband.",
      "Parent-teacher conference night arrives. Ms. Richardson pulls up Arthur's growth data on the Teacher Dashboard and walks his parents through every milestone. \"Arthur is not just keeping up,\" she says. \"He is leading. His Social Science scores have climbed forty percent since September, and his marketplace business is teaching him skills that most adults are still learning.\" Coach Marcus joins the conversation. \"Arthur is not just a student,\" he says. \"He is becoming a leader. I see it every day.\"",
      "That weekend, Mr. and Mrs. Wakanda buy Arthur's \"Future Howard Bison\" merchandise and attend the virtual campus open house. They walk through the buildings Arthur helped design, read his name on the contributor wall, and browse his marketplace store. Mr. Wakanda claps his son on the shoulder. \"We always knew you had it in you, son. Now the whole world is going to see it.\" The first $200 enters Arthur's college fund, contributed by his family's belief in his dream.",
    ],
    quote: "Behind every great student is a family that refused to stop believing.",
    quoteAuthor: "Parent Dashboard welcome message",
    links: [
      { label: "Parent Dashboard", href: "/parents/dashboard", icon: Heart },
    ],
    stats: { wallet: 1600, pantherPower: 710, housePoints: 350, collegeFund: 200 },
  },
  {
    title: "Print Shop Dreams",
    subtitle: "Fundraising Begins",
    icon: ShoppingBag,
    characters: ["Arthur", "Jasmine", "Mr. & Mrs. Wakanda"],
    narrative: [
      "Arthur discovers the Print Shop and his creative side explodes. He can design real merchandise -- t-shirts, hoodies, stickers, notebooks -- and sell them to support his college dream. The idea forms instantly: what if he created merch that represented not just himself but every student chasing a dream bigger than their circumstances?",
      "Jasmine becomes his design partner. Together they create a \"Future Howard Bison\" t-shirt with a powerful panther silhouette, stickers with motivational quotes from Arthur's journey, and a notebook that reads \"My Empire Starts Here\" on the cover. When Arthur learns about the UBO partnership -- that real money from merch sales can go toward actual college tuition -- his heart races. This is not a game anymore. This is his future taking shape.",
      "The community rallies. Teachers buy hoodies. Mr. and Mrs. Wakanda share the merch link with their church, their neighbors, their coworkers. Parents from other houses start ordering. Local businesses sponsor bulk purchases. The first fundraising milestone arrives: $500. Then $1,000. Then $1,500. Arthur watches the number climb and feels something he has never felt before -- the power of a community investing in his potential. His college fund is no longer a fantasy. It is a number that grows every single day.",
    ],
    quote: "Your dreams deserve to be funded. Start building today, and the world will invest in your tomorrow.",
    quoteAuthor: "UBO Partnership message",
    links: [
      { label: "Print Shop", href: "/academy/merch", icon: ShoppingBag },
    ],
    stats: { wallet: 2000, pantherPower: 770, housePoints: 380, collegeFund: 1500 },
  },
  {
    title: "Teacher's Impact",
    subtitle: "Ms. Richardson's Classroom",
    icon: Presentation,
    characters: ["Arthur", "Ms. Richardson"],
    narrative: [
      "Ms. Richardson uses the Teacher Dashboard every morning before her students arrive. She tracks reading levels, quiz scores, participation patterns, and Panther Power growth for every student in her class. When she notices that Arthur's Social Science scores have been climbing steadily for three months, she creates a special project just for him: a research presentation on \"How Communities Build Wealth Across Generations.\"",
      "Arthur spends two weeks on the project, using Spark to help him find data, organize his arguments, and rehearse his delivery. He interviews his grandmother about how her neighborhood changed over fifty years. He maps economic patterns in historically Black communities. When he stands in front of the class and presents, his voice is steady, his data is clear, and his passion is unmistakable.",
      "The ripple effect is immediate. Three classmates approach Arthur after class, asking how he built his marketplace store. Within a week, four new student businesses launch on the platform, all inspired by Arthur's presentation. Ms. Richardson stays late that Friday, drafting the first paragraphs of Arthur's recommendation letter. She writes: \"In twenty years of teaching, I have rarely seen a student who combines intellectual curiosity with genuine compassion the way Arthur Wakanda does. He does not just learn for himself. He learns so he can lift others.\"",
    ],
    quote: "A great teacher does not just teach content. A great teacher changes the trajectory of a life.",
    quoteAuthor: "Arthur, end-of-semester reflection",
    links: [
      { label: "Teacher Dashboard", href: "/teacher-dashboard", icon: Presentation },
      { label: "Core Subjects", href: "/subjects", icon: BookOpen },
    ],
    stats: { wallet: 2300, pantherPower: 830, housePoints: 410, collegeFund: 2800 },
  },
  {
    title: "Investing in Community",
    subtitle: "Third CYOA Adventure",
    icon: Gamepad2,
    characters: ["Arthur", "Amara"],
    narrative: [
      "Arthur's third Choose Your Own Adventure is called \"Building Community,\" and it hits close to home. The scenario places him in a neighborhood that needs revitalization. He makes choices about community gardens, mentorship programs, a neighborhood improvement fund, and youth employment initiatives. Every decision has trade-offs, and the simulation does not let him take shortcuts.",
      "Midway through, disaster strikes. The neighborhood improvement fund loses its main donor, and three of Arthur's projects are at risk of shutting down. He feels the familiar sting of a setback. But this time, Arthur does not panic. He pivots -- reaching out to local businesses in the simulation, organizing a fundraising event, and partnering with other community leaders to share resources. The projects survive, leaner but stronger.",
      "After the scenario ends, Arthur finds Amara in the real-world common room. \"I just played the community building adventure,\" he says. \"It felt like what you do every day.\" Amara smiles. \"Then let us do it for real.\" They partner on a mentorship program connecting Academy students with younger kids at the elementary school. The community response is overwhelming. Donations pour in through merch sales and the college fund grows past $4,500 on the strength of a community that believes in what these students are building.",
    ],
    quote: "The measure of a community is how it treats its youngest dreamers.",
    quoteAuthor: "CYOA scenario closing message",
    links: [
      { label: "Adventures (CYOA)", href: "/academy/scenarios", icon: Gamepad2 },
    ],
    stats: { wallet: 2800, pantherPower: 890, housePoints: 450, collegeFund: 4500 },
  },
  {
    title: "The Panther Power Summit",
    subtitle: "Elite Status",
    icon: Zap,
    characters: ["Arthur", "Coach Marcus"],
    narrative: [
      "The notification appears on Arthur's dashboard in bold letters: \"Congratulations, Arthur Wakanda. You have achieved Elite Panther Power Status.\" He stares at it for a full minute before it sinks in. All five categories are strong -- Education at 190, Character at 185, Leadership at 180, Entrepreneurship at 170, Community at 175. There is no single category carrying the others. Arthur has grown in every direction.",
      "The ceremony happens in the Academy's main hall. Coach Marcus stands at the podium, and when he calls Arthur's name, the room is loud with applause. \"This young man walked through our doors with sweaty palms and a hundred credits in his wallet,\" Coach Marcus says. \"Today he stands before you as proof that when you invest in yourself every single day, there is no ceiling on who you can become.\" Arthur accepts the Elite badge and fights to keep his composure.",
      "The next week, Arthur begins mentoring three younger students who are just starting their Academy journey. He sees himself in their nervous faces, their hesitant questions, their uncertain steps. He tells them what Coach Marcus told him on day one: \"Greatness begins in the space where you feel most unsure.\" Meanwhile, the merch fundraising campaign hits $7,000. Arthur's dream of Howard is no longer distant. It is approaching with the momentum of an entire community behind it.",
    ],
    quote: "True power is not what you accumulate. It is what you give away.",
    quoteAuthor: "Coach Marcus, Elite ceremony speech",
    links: [
      { label: "Panther Power", href: "/academy/power", icon: Zap },
    ],
    stats: { wallet: 3400, pantherPower: 990, housePoints: 500, collegeFund: 7000 },
  },
  {
    title: "It Takes a Village",
    subtitle: "The Support Network",
    icon: MessageCircle,
    characters: ["Arthur", "Maya", "DeShawn", "Jasmine", "Amara", "Coach Marcus", "Ms. Richardson", "Mr. & Mrs. Wakanda", "Spark AI"],
    narrative: [
      "Arthur sits on the bleachers after the last house competition of the year and thinks about how he got here. Not just his own choices, but every person who showed up for him. Coach Marcus, who believed in him before Arthur believed in himself. Ms. Richardson, who saw a spark of curiosity and fanned it into a fire, who spent hours writing a recommendation letter that captured Arthur's entire journey. His parents, who attended every event, bought every piece of merch, and checked the Parent Dashboard like it was the morning news.",
      "He thinks about Maya, who sat next to him on his worst day and told him that struggle is where growth happens. DeShawn, who taught him that patience is the most valuable currency on Wall Street and in life. Jasmine, who turned his rough ideas into beautiful designs that people actually wanted to buy. Amara, who showed him that community service is not a checkbox -- it is a way of living. And Spark, the AI companion that was there at midnight, at 6 AM, on weekends, never judging, always encouraging, always asking the right question at the right time.",
      "Arthur realizes something profound: no one builds an empire alone. Every credit in his wallet, every point on his power score, every dollar in his college fund has someone else's fingerprints on it. The entire AI Mastery Academy community -- students buying study guides, parents ordering merch, teachers tracking progress, mentors pushing harder, an AI companion guiding every step -- all of it wove together into something bigger than any single person could build. The college fund pushes past $9,200, and Arthur knows that the number represents trust, love, and collective belief.",
    ],
    quote: "Success is never a solo performance. It is a symphony, and every person in your life plays a note.",
    quoteAuthor: "Arthur, year-end reflection essay",
    links: [
      { label: "Academy Hub", href: "/academy", icon: Rocket },
      { label: "Spark AI Companion", href: "/ai-companion", icon: Sparkles },
      { label: "Parent Dashboard", href: "/parents/dashboard", icon: Heart },
    ],
    stats: { wallet: 4000, pantherPower: 1030, housePoints: 530, collegeFund: 9200 },
  },
  {
    title: "The Howard Dream",
    subtitle: "Acceptance & Legacy",
    icon: GraduationCap,
    characters: ["Arthur", "Maya", "DeShawn", "Jasmine", "Amara", "Coach Marcus", "Ms. Richardson", "Mr. & Mrs. Wakanda", "Spark AI"],
    narrative: [
      "Arthur sits at his desk and opens his Howard University application. His Dream Design profile tells a story no test score ever could. Academic excellence: top performer in Social Sciences, Academic Bowl finalist, AI Mastery Level 5 certified. Leadership: Crimson Lions house captain, mentor to three younger students, team conflict mediator. Community impact: $10,000 raised for college, campus builder contributor, mentorship program co-founder. Entrepreneurship: marketplace business with 47 sales, Print Shop designer, stock market portfolio at $850.",
      "He writes his personal essay about lemonade stands and rainstorms, about stocks that dropped and patience that paid off, about a Math quiz he failed and the friend who reminded him that struggle is where growth happens. He writes about Spark, the AI companion that never slept and never judged. He writes about Coach Marcus, who walked the halls of Howard before him and promised Arthur he would walk them too. Ms. Richardson's recommendation letter is attached -- four pages of fierce advocacy for a student she calls \"once in a generation.\"",
      "Weeks later, Arthur opens his mailbox and sees it: a large envelope with the Howard University seal. His hands tremble. \"Dear Arthur Wakanda, Congratulations! You have been accepted to Howard University, Class of 2032, Social Science Engineering program.\" The college fund hits $10,000 with a final community fundraiser that brings together everyone who believed in him. Mrs. Wakanda cries. Mr. Wakanda holds Arthur so tight he cannot breathe. Coach Marcus simply nods -- the kind of nod that says everything.",
      "The celebrations cascade. Maya is accepted to MIT for Architecture. DeShawn gets into Wharton for Business. Jasmine is headed to RISD for Graphic Design. Amara receives a full scholarship to Spelman for Community Development. Arthur returns to the Academy Hub one last time and leaves a message for every future Panther: \"I was exactly where you are right now. Nervous. Unsure. Wondering if any of this was real. It is real. Every quest you complete, every lesson you learn, every setback you overcome -- it all adds up. Your story is being written right now. Make it a good one. Every student at AI Mastery Academy can write their own story.\"",
    ],
    quote: "Your story is being written right now. Make it a good one.",
    quoteAuthor: "Arthur Wakanda, Howard University Class of 2032",
    links: [
      { label: "Dream Design", href: "/academy/dreams", icon: Target },
      { label: "Panther Power", href: "/academy/power", icon: Zap },
      { label: "Academy Hub", href: "/academy", icon: Rocket },
    ],
    stats: {
      wallet: 4700,
      pantherPower: 1090,
      housePoints: 570,
      collegeFund: 10000,
      adventuresCompleted: 4,
      marketplaceSales: 47,
      stocksPortfolio: 850,
    },
  },
  {
    title: "The AI Creation Studio",
    subtitle: "Building with AI Tools",
    icon: Presentation,
    characters: ["Arthur", "Maya", "Spark AI"],
    narrative: [
      "Arthur discovers the AI Creation Studio — a suite of 10 powerful tools that let him create presentations, business plans, research papers, and more using AI. He's earned access by completing his AI Mastery modules, and the first tool he tries is the Brainstorm Studio. He types in \"community garden business\" and watches as ideas flow across his screen — revenue models, marketing strategies, partnership opportunities. It feels like having a creative partner who never runs out of ideas.",
      "Maya shows him the wizard workflow feature. \"Watch this,\" she says, taking her brainstorm output and flowing it directly into the Business Plan Generator, then into the Sales Pitch Builder, and finally into the Presentation Builder. In one afternoon, she goes from a rough idea to a polished pitch deck. Arthur is amazed — each tool builds on the last, creating a complete project pipeline.",
      "Arthur uses the Document Writer to draft a proposal for his study guide subscription service, then the Research Assistant to find data backing up his ideas. He saves every project to his portfolio. The tools do not do the thinking for him — they help him organize his thoughts, find better words, and structure his ideas professionally. \"This is what adults use in real offices,\" Ms. Richardson tells the class. \"You are learning it at twelve.\"",
    ],
    quote: "AI does not replace your creativity. It amplifies it. The ideas are always yours.",
    quoteAuthor: "Arthur, presenting his first AI-assisted project",
    links: [
      { label: "AI Creation Studio", href: "/ai-tools", icon: Presentation },
    ],
    stats: { wallet: 1200, pantherPower: 680, housePoints: 280, collegeFund: 45 },
  },
  {
    title: "Sparky Talks to Mom",
    subtitle: "AI Support for Families",
    icon: MessageCircle,
    characters: ["Arthur", "Arthur's Mom", "Sparky AI"],
    narrative: [
      "Arthur's mom has been curious about the platform ever since Arthur started talking about stock portfolios and business plans at the dinner table. One evening, she logs in with her parent account and discovers Sparky — an AI companion designed specifically for parents and teachers. Unlike Spark, which speaks to kids at their level, Sparky is built for adults. It offers evidence-based strategies, explains educational research, and helps parents understand how to support their child's learning journey.",
      "She asks Sparky how to help Arthur with his Math struggles. Instead of generic advice, Sparky looks at Arthur's progress data and suggests specific strategies: practice with real-world problems he cares about, celebrate effort over scores, and use the platform's adaptive quiz system to target his weak areas. Sparky even explains the research behind growth mindset in language that makes sense. \"Your son is not bad at Math,\" Sparky says. \"He just has not found his way in yet.\"",
      "Arthur walks in to find his mom taking notes from Sparky. She looks up and says, \"I had no idea this platform tracked all of this. I can see exactly where you are growing and where you need help.\" For the first time, Arthur's school life and home life feel connected. His mom starts checking his Thrive Dashboard weekly and celebrating his wins at dinner. \"Sparky told me that belonging scores matter as much as test scores,\" she says one night. Arthur groans, but secretly he loves that she cares enough to learn the system.",
    ],
    quote: "When parents understand the journey, they become the most powerful support system a child can have.",
    quoteAuthor: "Sparky, in a conversation with Arthur's mom",
    links: [
      { label: "Sparky (Parent AI)", href: "/sparky", icon: MessageCircle },
    ],
    stats: { wallet: 1200, pantherPower: 700, housePoints: 290, collegeFund: 50 },
  },
];

const POWER_CATEGORIES = [
  { name: "Education", icon: BookOpen },
  { name: "Character", icon: Heart },
  { name: "Leadership", icon: Shield },
  { name: "Entrepreneurship", icon: TrendingUp },
  { name: "Community", icon: Users },
];

const POWER_BY_CHAPTER: number[][] = [
  [0, 0, 0, 0, 0],
  [3, 2, 2, 1, 2],
  [8, 5, 3, 2, 7],
  [18, 12, 8, 5, 12],
  [22, 18, 15, 12, 28],
  [28, 35, 20, 14, 33],
  [35, 40, 28, 35, 37],
  [42, 45, 32, 55, 40],
  [48, 48, 36, 58, 42],
  [50, 49, 40, 59, 43],
  [53, 50, 48, 60, 44],
  [55, 50, 60, 60, 45],
  [60, 54, 65, 62, 50],
  [70, 58, 72, 65, 65],
  [80, 68, 78, 72, 72],
  [95, 78, 85, 80, 82],
  [105, 90, 110, 120, 90],
  [115, 100, 130, 125, 100],
  [125, 115, 135, 130, 115],
  [140, 130, 140, 140, 130],
  [155, 145, 150, 150, 140],
  [190, 185, 180, 170, 175],
  [195, 190, 188, 185, 184],
  [200, 200, 200, 200, 200],
  [205, 205, 205, 210, 205],
  [210, 210, 210, 215, 210],
];

function StatsFooter({ stats, chapterIndex }: { stats: ChapterStats; chapterIndex: number }) {
  const isFinale = chapterIndex === CHAPTERS.length - 1;

  return (
    <Card className="p-5 mt-6" data-testid={`card-stats-chapter-${chapterIndex}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
          <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold">
          {isFinale ? "Arthur's Final Dashboard" : "Arthur's Stats"}
        </span>
      </div>
      <div className={`grid gap-4 ${isFinale ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
        <div>
          <p className="text-xs text-muted-foreground">Wallet</p>
          <p className="text-lg font-bold" data-testid={`text-stat-wallet-${chapterIndex}`}>
            ${stats.wallet.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Panther Power</p>
          <p className="text-lg font-bold" data-testid={`text-stat-power-${chapterIndex}`}>
            {stats.pantherPower.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">House Points</p>
          <p className="text-lg font-bold" data-testid={`text-stat-house-${chapterIndex}`}>
            {stats.housePoints.toLocaleString()}
          </p>
        </div>
        {stats.collegeFund !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">College Fund</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid={`text-stat-fund-${chapterIndex}`}>
              ${stats.collegeFund.toLocaleString()}
            </p>
          </div>
        )}
        {stats.adventuresCompleted !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Adventures</p>
            <p className="text-lg font-bold">{stats.adventuresCompleted}</p>
          </div>
        )}
        {stats.marketplaceSales !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Marketplace Sales</p>
            <p className="text-lg font-bold">{stats.marketplaceSales}</p>
          </div>
        )}
        {stats.stocksPortfolio !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Stocks Portfolio</p>
            <p className="text-lg font-bold">${stats.stocksPortfolio}</p>
          </div>
        )}
      </div>
      {chapterIndex > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Panther Power Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {POWER_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              const score = POWER_BY_CHAPTER[chapterIndex][i];
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{cat.name}</span>
                    </div>
                    <span className="text-xs font-medium">{score}</span>
                  </div>
                  <Progress value={Math.min((score / 200) * 100, 100)} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function ChapterContent({ chapter, index }: { chapter: Chapter; index: number }) {
  const isFinale = index === CHAPTERS.length - 1;

  return (
    <div className="space-y-6" data-testid={`chapter-content-${index}`}>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div className="rounded-md p-2.5 bg-gradient-to-br from-rose-900 to-red-950 shrink-0">
          <chapter.icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Chapter {index + 1}</p>
          <h2 className="text-xl font-bold">{chapter.title}</h2>
          <p className="text-sm text-muted-foreground">{chapter.subtitle}</p>
        </div>
      </div>

      {chapter.characters && chapter.characters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" data-testid={`characters-${index}`}>
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">In this chapter:</span>
          {chapter.characters.map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}

      <Card className="p-6" data-testid={`card-narrative-${index}`}>
        <div className="space-y-4">
          {chapter.narrative.map((paragraph, pIdx) => (
            <p key={pIdx} className="text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </Card>

      {isFinale && (
        <Card className="p-6 bg-gradient-to-r from-rose-900 to-red-950 text-white" data-testid="card-acceptance">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="rounded-md p-3 bg-white/20 shrink-0">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs uppercase tracking-wider text-rose-200 mb-1">Official Acceptance</p>
              <p className="text-lg font-bold mb-2">Howard University - Class of 2032</p>
              <p className="text-sm text-rose-100">
                Social Science Engineering Program
              </p>
              <p className="text-sm text-rose-100 mt-2">
                Dear Arthur Wakanda, Congratulations! Your journey, your resilience, and your dedication have earned you a place among the Bison. Welcome home.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5" data-testid={`card-quote-${index}`}>
        <div className="flex gap-3">
          <div className="shrink-0 mt-1">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm italic leading-relaxed">
              "{chapter.quote}"
            </p>
            <p className="text-xs text-muted-foreground mt-2">-- {chapter.quoteAuthor}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5" data-testid={`card-links-${index}`}>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" /> What Arthur Used
        </p>
        <div className="flex flex-wrap gap-2">
          {chapter.links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button variant="outline" size="sm" data-testid={`link-feature-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Icon className="h-4 w-4 mr-1.5" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </Card>

      <StatsFooter stats={chapter.stats} chapterIndex={index} />

      {isFinale && (
        <Card className="p-6 text-center" data-testid="card-cta-finale">
          <Award className="h-10 w-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-bold mb-2">Your Story Starts Now</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Arthur was exactly where you are right now. Every feature he used is waiting for you. Every achievement he earned is possible for you. The only question is: what will your story be?
          </p>
          <Link href="/academy">
            <Button data-testid="button-start-journey">
              <Rocket className="h-4 w-4 mr-1.5" /> Start Your Own Journey
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export default function AcademyTutorialPage() {
  const [activeChapter, setActiveChapter] = useState(0);

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="page-academy-tutorial">
      <div className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 p-8 mb-8" data-testid="section-hero">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-tutorial-title">
          Arthur's Academy Journey
        </h1>
        <p className="text-rose-100 text-lg mb-1">
          From his first day at AI Mastery Academy to Howard University
        </p>
        <p className="text-rose-200 text-sm">
          Follow Arthur Wakanda through every feature of the Academy and see how one student built his empire
        </p>
      </div>

      <div className="mb-8" data-testid="section-chapter-nav">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveChapter((c) => Math.max(0, c - 1))}
            disabled={activeChapter === 0}
            data-testid="button-prev-chapter"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-1">
              {CHAPTERS.map((ch, idx) => {
                const Icon = ch.icon;
                const isActive = idx === activeChapter;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveChapter(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-rose-900 to-red-950 text-white"
                        : "bg-muted/50 text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-chapter-${idx}`}
                    aria-label={`Chapter ${idx + 1}: ${ch.title}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{ch.title}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveChapter((c) => Math.min(CHAPTERS.length - 1, c + 1))}
            disabled={activeChapter === CHAPTERS.length - 1}
            data-testid="button-next-chapter"
            aria-label="Next chapter"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2">
          <Progress
            value={((activeChapter + 1) / CHAPTERS.length) * 100}
            className="h-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            Chapter {activeChapter + 1} of {CHAPTERS.length}
          </p>
        </div>
      </div>

      <ChapterContent
        chapter={CHAPTERS[activeChapter]}
        index={activeChapter}
      />

      <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
        {activeChapter > 0 && (
          <Button
            variant="outline"
            onClick={() => setActiveChapter((c) => c - 1)}
            data-testid="button-prev-bottom"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous Chapter
          </Button>
        )}
        <div className="flex-1" />
        {activeChapter < CHAPTERS.length - 1 && (
          <Button
            onClick={() => setActiveChapter((c) => c + 1)}
            data-testid="button-next-bottom"
          >
            Next Chapter <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="mt-10 text-center" data-testid="section-final-cta">
        <Link href="/academy">
          <Button variant="outline" size="lg" data-testid="button-back-to-academy">
            <Rocket className="h-4 w-4 mr-1.5" /> Back to Academy Hub
          </Button>
        </Link>
      </div>
    </div>
  );
}