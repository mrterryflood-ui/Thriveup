import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Handshake,
  Flame,
  Repeat,
  Shield,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  Quote,
  Brain,
  BarChart3,
  Umbrella,
  Receipt,
  Lock,
  PieChart,
  Landmark,
  Target,
  ArrowRight,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KeyTerm {
  term: string;
  definition: string;
}

interface Story {
  title: string;
  content: string;
}

interface Module {
  id: string;
  title: string;
  icon: LucideIcon;
  intro: string;
  points: number;
  keyTerms: KeyTerm[];
  stories: Story[];
  thinkAboutIt: string;
  lifeLesson: string;
  lifeLessonAttribution?: string;
  redFlags?: string[];
  keyPrinciples?: string[];
  keyInsights?: string[];
  buildsOn?: string;
  connectionNote?: string;
  survivalModeNote?: string;
  stageOfChange?: string;
}

const modules: Module[] = [
  {
    id: "money-foundations",
    title: "Money Foundations",
    icon: DollarSign,
    intro: "Before you can build wealth, you need to understand the building blocks. This module covers the essential terms and concepts that every financially literate person knows.",
    points: 50,
    keyTerms: [
      { term: "Budget", definition: "A plan for how you will spend and save your money each month." },
      { term: "Income", definition: "Money you earn from work, allowance, or investments." },
      { term: "Expense", definition: "Money you spend on things you need or want." },
      { term: "Savings", definition: "Money you set aside for the future instead of spending it now." },
      { term: "Interest", definition: "Money a bank pays you for keeping your savings with them, or money you pay to borrow." },
      { term: "Credit", definition: "Borrowing money with a promise to pay it back later, usually with interest." },
      { term: "Debt", definition: "Money you owe to someone else." },
      { term: "Net Worth", definition: "Everything you own minus everything you owe. The true measure of wealth." },
    ],
    stories: [
      {
        title: "The Tale of Two Savers",
        content: "Imagine two students who both get $5 per week allowance. Student A saves every dollar. After one year, they have $260 and buy a high-quality bicycle they've been dreaming about. Student B spends everything immediately on snacks and small toys. At the end of the year, Student B has nothing to show for it and wishes they could afford that bike. Same income, completely different outcomes. The difference? A plan.",
      },
      {
        title: "The Magic Penny",
        content: "Would you rather have $1 million right now, or a single penny that doubles every day for 30 days? Most people take the million. But the penny becomes 2 cents on day 2, 4 cents on day 3, and keeps doubling. By day 15, it's only $163.84. But by day 20, it's $5,242.88. By day 25, it's $167,772.16. And by day 30? A staggering $5,368,709.12! That's over $5.3 million. This is the power of compound interest, and it's why starting to save early matters so much.",
      },
    ],
    thinkAboutIt: "If you received $20 right now, how would you split it between spending and saving? Why?",
    lifeLesson: "Money is a tool, not a goal. The person who controls their money controls their future.",
    stageOfChange: "Pre-contemplation",
    survivalModeNote: "If money feels scary or stressful in your family, that's okay. You're not behind. Learning about money now means you're already ahead of most adults who never got this chance.",
  },
  {
    id: "patience-pays",
    title: "Patience Pays: Short-Term vs Long-Term",
    icon: Clock,
    intro: "The hardest financial skill isn't math or budgeting. It's patience. Learning to wait for bigger rewards instead of grabbing small ones now is what separates the wealthy from the broke.",
    points: 50,
    keyTerms: [
      { term: "Investment", definition: "Putting money into something now with the hope it will grow in value over time." },
      { term: "Compound Interest", definition: "Earning interest on your interest. Your money grows faster and faster over time." },
      { term: "Delayed Gratification", definition: "Choosing to wait for a bigger reward instead of taking a smaller one right away." },
      { term: "Dividend", definition: "A share of a company's profits paid to people who own its stock." },
      { term: "Appreciation", definition: "When something increases in value over time." },
    ],
    stories: [
      {
        title: "Warren Buffett: The Patient Investor",
        content: "Warren Buffett bought his first stock at age 11. He's now worth over $100 billion. But here's the incredible part: over 99% of his wealth came after his 50th birthday. If he had cashed out early as a young man, he would have missed 99.9% of his fortune. His secret wasn't a magic formula. It was patience. He bought good investments and held onto them for decades while compound interest did its work.",
      },
      {
        title: "The Marshmallow Experiment",
        content: "In a famous study, researchers gave young children a choice: eat one marshmallow now, or wait 15 minutes and get two marshmallows. The children who waited performed better in school, earned higher test scores, and were more successful later in life. This wasn't about marshmallows. It was about self-control. The ability to resist a small reward now for a bigger reward later is one of the most powerful skills you can develop.",
      },
      {
        title: "Study Now, Win Later",
        content: "Think about a student who studies for 2 hours every evening while their friend plays video games. In the short term, the gamer is having more fun. But after a year, the student has better grades, more scholarship opportunities, and more doors opening for their future. The gamer is still at level 99 in a game that nobody will care about in 5 years. Short-term pain leads to long-term gain.",
      },
      {
        title: "LeBron James: The Long Game",
        content: "LeBron James earned his first NBA contract at 18 years old. But instead of blowing his money on flashy purchases, he lived off his endorsement deals and invested almost every dollar of his NBA salary. He hired financial advisors before buying his first house. By his 30s, he had built a business empire worth over a billion dollars including a production company, a pizza chain investment, and ownership stakes in the Boston Red Sox and Liverpool FC. When other athletes were going broke after retirement, LeBron was just getting started. He once said he treats every business decision like a chess move, thinking five steps ahead.",
      },
    ],
    thinkAboutIt: "Can you think of a time when waiting for something made it even better? What did that teach you?",
    lifeLesson: "The stock market is a device for transferring money from the impatient to the patient.",
    lifeLessonAttribution: "Warren Buffett",
    buildsOn: "Money Foundations",
    connectionNote: "Now that you know the building blocks from Money Foundations, let's talk about the hardest skill: patience.",
    stageOfChange: "Contemplation",
    survivalModeNote: "We know that when you're worried about today, thinking about 'the long term' can feel impossible. Start small. Even saving one dollar is an act of patience.",
  },
  {
    id: "spotting-scams",
    title: "Spotting Scams & Pyramid Schemes",
    icon: ShieldAlert,
    intro: "Not everyone who offers you a 'great deal' has your best interest at heart. Learning to spot scams and fraud is one of the most important financial skills you'll ever develop.",
    points: 75,
    keyTerms: [
      { term: "Pyramid Scheme", definition: "A fake business where people make money by recruiting others, not by selling real products." },
      { term: "Ponzi Scheme", definition: "A scam where early investors are paid with money from new investors, not actual profits." },
      { term: "MLM", definition: "Multi-Level Marketing. Sometimes legitimate, but often structured like a pyramid scheme." },
      { term: "Phishing", definition: "Fake emails or messages designed to trick you into giving away personal information." },
      { term: "Fraud", definition: "Intentionally deceiving someone to steal their money or property." },
      { term: "Due Diligence", definition: "Doing your research before investing money or trusting someone with it." },
      { term: "Red Flags", definition: "Warning signs that something might be a scam or too good to be true." },
    ],
    stories: [
      {
        title: "Bernie Madoff: The $65 Billion Lie",
        content: "Bernie Madoff ran the largest Ponzi scheme in history, stealing $65 billion from investors. He seemed trustworthy because he was wealthy, well-connected, and had been in finance for decades. But he was paying old investors with new investors' money. When the 2008 financial crisis hit and everyone wanted their money back, the whole scheme collapsed. Thousands of people lost their life savings. The warning signs were there: returns that were too consistent, secrecy about his methods, and no independent verification. But people trusted him because he seemed successful.",
      },
      {
        title: "The Pyramid Math",
        content: "Here's why pyramid schemes always fail: if each person needs to recruit just 5 people, and those 5 each recruit 5 more, watch what happens. Level 1: 5 people. Level 2: 25 people. Level 5: 3,125 people. Level 10: nearly 10 million people. By level 13, you'd need more people than exist on Earth. The math guarantees that most people will lose money. Only the people at the very top profit, and they do it by taking from everyone below them.",
      },
      {
        title: "Social Media Money Scams",
        content: "'Send me $100 and I'll send back $1,000!' You've probably seen posts like this on social media. Think about it: why would anyone give you $900 for free? Where is that money coming from? The answer is simple: it's not real. These scammers collect money from hundreds of people, send nothing back, and disappear. They create fake screenshots of 'payments' to trick more victims. If someone online is promising to multiply your money, they're trying to steal it.",
      },
    ],
    redFlags: [
      "\"Guaranteed returns\" - nothing in investing is ever guaranteed",
      "\"Get rich quick\" - real wealth takes time and effort to build",
      "\"Recruit your friends\" - if the money comes from recruiting, not from selling a product, it's a pyramid",
      "\"Secret method\" - legitimate businesses are transparent about how they make money",
      "\"Act now or miss out\" - pressure tactics are a form of manipulation",
    ],
    thinkAboutIt: "If a classmate told you they could double your money in a week, what questions would you ask before giving them anything?",
    lifeLesson: "If it sounds too good to be true, it probably is. Always ask: where is the money actually coming from?",
    buildsOn: "Patience Pays",
    connectionNote: "Patient people are harder to scam because they don't rush into 'get rich quick' schemes. This module protects the patience you're building.",
    stageOfChange: "Contemplation",
    survivalModeNote: "Scammers target people who are desperate. If your family has ever been in a tough spot, understanding these tricks protects you and the people you love.",
  },
  {
    id: "predatory-practices",
    title: "Predatory Practices & Interest Rates",
    icon: AlertTriangle,
    intro: "Some businesses make their money by trapping people in cycles of debt. Understanding interest rates and predatory lending can save you thousands of dollars and years of financial stress.",
    points: 75,
    keyTerms: [
      { term: "Interest Rate", definition: "The percentage charged for borrowing money, or earned on savings." },
      { term: "APR", definition: "Annual Percentage Rate. The true yearly cost of a loan including all fees." },
      { term: "Predatory Lending", definition: "Unfair lending practices that take advantage of people who are desperate for money." },
      { term: "Payday Loan", definition: "A short-term, high-interest loan meant to be repaid on your next payday. Often traps people in debt." },
      { term: "Fine Print", definition: "The small text in contracts that contains important terms most people don't read." },
      { term: "Audit Trail", definition: "A record of every financial transaction, used to track spending and prevent fraud." },
      { term: "Amortization", definition: "The process of paying off a loan over time through regular payments." },
    ],
    stories: [
      {
        title: "The Payday Loan Trap",
        content: "Imagine someone borrows $300 from a payday lender because they need cash fast. The fee is $45 for a two-week loan. That doesn't sound too bad, right? But do the math: $45 on $300 for just two weeks equals a 391% APR. If they can't pay it back in time (and most can't), they borrow again. And again. That original $300 loan can snowball into over $1,000 in debt. Payday lenders set up shop in neighborhoods where people have fewer financial options, deliberately targeting the vulnerable.",
      },
      {
        title: "The Minimum Payment Trap",
        content: "Say you charge $1,000 on a credit card with 24% interest and only make the minimum payment each month. It would take you over 9 years to pay it off, and you'd end up paying more than $1,500 in interest alone. That means you'd pay $2,500 total for $1,000 worth of purchases. Credit card companies love minimum payments because they make enormous profits from the interest. Always pay more than the minimum whenever possible.",
      },
      {
        title: "Why Records Matter",
        content: "Keeping an audit trail, a record of every dollar coming in and going out, isn't just about being organized. It protects you. If someone charges you twice for something, your records prove it. If a company says you didn't pay, your records show you did. If you're wondering where all your money went, your records tell you. The most financially successful people track every dollar. It's not about being cheap. It's about being in control.",
      },
    ],
    thinkAboutIt: "Why do you think payday loan stores are more common in some neighborhoods than others? What does that tell you about who they target?",
    lifeLesson: "Read the fine print. The big promises are in bold, but the real cost is in the small text.",
    buildsOn: "Spotting Scams",
    connectionNote: "Scams are illegal. But predatory lending is legal \u2014 and just as dangerous. This builds directly on what you learned about protecting yourself.",
    stageOfChange: "Preparation",
    survivalModeNote: "Payday lenders and high-interest loans are most common in communities that have fewer options. Knowing this isn't your fault \u2014 but knowing how it works is your power.",
  },
  {
    id: "hard-work-networking",
    title: "Hard Work, Networking & Building Trust",
    icon: Handshake,
    intro: "Success isn't just about what you know. It's about who you know, how hard you work, and whether people can trust you. These skills are worth more than any amount of money.",
    points: 50,
    keyTerms: [
      { term: "Networking", definition: "Building relationships with people who can help you grow personally and professionally." },
      { term: "Reputation", definition: "What people say about you when you're not in the room. Your most valuable asset." },
      { term: "Integrity", definition: "Doing the right thing even when nobody is watching." },
      { term: "Work Ethic", definition: "The belief that hard work and dedication lead to success." },
      { term: "Mentorship", definition: "A relationship where an experienced person guides and teaches a less experienced person." },
      { term: "Social Capital", definition: "The value you get from your relationships and social connections." },
      { term: "Professional Network", definition: "The group of people you know through work, school, and community activities." },
    ],
    stories: [
      {
        title: "Oprah Winfrey: From Poverty to Billions",
        content: "Oprah Winfrey grew up in extreme poverty in rural Mississippi. She started working in local media as a teenager, not because it paid well, but because she loved connecting with people. She worked harder than everyone around her, showed up early, stayed late, and genuinely cared about every person she met. Over decades, she built relationships based on trust and authenticity. Those relationships became her foundation for building a media empire worth billions. Her success wasn't overnight. It was built one honest conversation at a time.",
      },
      {
        title: "The Neighborhood Barbershop",
        content: "Think about the most successful barbershop in your neighborhood. The owner doesn't just cut hair. He remembers everyone's name, asks about their family, and treats every customer like a VIP. He never cuts corners on quality. When someone new moves to the area, three different people recommend his shop. He doesn't spend money on advertising because his reputation does all the work. His business grew entirely through word-of-mouth and trust. That's the power of treating people right.",
      },
      {
        title: "The Power of Who You Know",
        content: "Studies show that most jobs are filled through personal connections, not job applications. This doesn't mean the system is unfair. It means that when an employer has to choose between a stranger and someone recommended by a person they trust, they choose the recommendation. Every person you meet, your teacher, your neighbor, your parent's coworker, could be the connection that changes your life. But nobody wants to recommend someone who is unreliable or dishonest.",
      },
    ],
    keyPrinciples: [
      "Your reputation is your most valuable asset",
      "Show up early, stay late, do more than asked",
      "Every person you meet could change your life",
      "Trust is built in drops and lost in buckets",
    ],
    thinkAboutIt: "Who are three people in your life that you could learn from? What would you ask them?",
    lifeLesson: "Your network is your net worth. But no one wants to connect with someone who cuts corners.",
    buildsOn: "Predatory Practices",
    connectionNote: "You've learned what to avoid. Now let's build something positive \u2014 your reputation and your network are assets no one can take from you.",
    stageOfChange: "Preparation",
    survivalModeNote: "Your community, your family, your neighborhood \u2014 these are already your network. The connections you have right now are valuable, even if they don't look like what you see on TV.",
  },
  {
    id: "viral-vs-sustainable",
    title: "Going Viral vs. Building Sustainable",
    icon: Flame,
    intro: "Everyone wants to go viral. But what happens after the fame fades? This module teaches the difference between a moment of attention and a lifetime of success.",
    points: 50,
    keyTerms: [
      { term: "Viral", definition: "Something that spreads rapidly online, getting millions of views or shares in a short time." },
      { term: "Sustainable", definition: "Something that can continue working and earning money over a long period of time." },
      { term: "Revenue Model", definition: "How a business actually makes money. The engine that keeps it running." },
      { term: "Business Plan", definition: "A written document that describes how a business will operate, make money, and grow." },
      { term: "Overhead", definition: "The ongoing costs of running a business, like rent, salaries, and supplies." },
      { term: "Cash Flow", definition: "The movement of money in and out of a business. Positive cash flow means more comes in than goes out." },
      { term: "Scalability", definition: "The ability of a business to grow bigger without costs growing just as fast." },
    ],
    stories: [
      {
        title: "MC Hammer: $33 Million Gone",
        content: "In the early 1990s, MC Hammer earned $33 million from his music career. But he had no business plan. He hired over 200 staff members, bought a $30 million mansion, and spent lavishly on cars and jewelry. He had no savings and no plan for when the music revenue slowed down. When it did, he filed for bankruptcy. He went from $33 million to $13 million in debt. The lesson isn't that earning money is hard. It's that keeping money requires a plan.",
      },
      {
        title: "The Lottery Curse",
        content: "Studies show that 70% of lottery winners go broke within a few years. They receive millions of dollars overnight but lack the financial knowledge to manage it. They buy mansions, expensive cars, and give money to everyone who asks. Without a budget, without advisors, and without financial education, the money disappears. Meanwhile, someone who earns $50,000 per year but saves and invests wisely can retire a millionaire. Knowledge beats luck every time.",
      },
      {
        title: "Two YouTubers, Two Outcomes",
        content: "YouTuber A posted one video that got 10 million views. They celebrated, but never posted consistently again. Within a year, their channel was forgotten and they earned almost nothing. YouTuber B posted one video per week for three years. Their views grew slowly from hundreds to thousands to millions. They built an email list, launched a merchandise line, created an online course, and partnered with brands. When any single video underperformed, it didn't matter because they had multiple revenue streams. The slow builder won.",
      },
      {
        title: "Two Lemonade Stands",
        content: "Two kids started lemonade stands on the same street. Kid A's stand went viral on social media. Hundreds of people showed up one weekend. But Kid A wasn't prepared for the demand, ran out of supplies, and never set up again. Kid B served 10 customers the first day, 15 the second, and 20 the third. Kid B built a regular customer base, started delivering to neighbors, and eventually expanded to three locations. The viral stand is a memory. The steady stand is a business.",
      },
      {
        title: "Allen Iverson: $200 Million, Then Broke",
        content: "Allen Iverson earned over $200 million during his NBA career. He was one of the most talented players ever. But he spent $600,000 per month on jewelry, cars, and an entourage of 50 people he supported financially. He gambled heavily, bought multiple mansions, and had no budget. By 2012, he was broke and owed millions in debt. His talent earned the money, but his lack of a financial plan lost it all. Thankfully, Reebok had set aside a $30 million trust fund he couldn't touch until age 55, which saved him from total ruin. Without that safety net, one of basketball's greatest players would have had nothing.",
      },
      {
        title: "Antoine Walker: $108 Million Gone",
        content: "Antoine Walker played 12 seasons in the NBA and earned $108 million. He bought 140 pairs of shoes at a time, owned multiple houses, and financed the lifestyles of dozens of friends and family members. He once said he spent a million dollars in a single weekend. Two years after retirement, he filed for bankruptcy. He lost everything -- the cars, the houses, the jewelry. Walker now speaks to young athletes about financial literacy, telling them the hardest lesson he ever learned: 'You think the money will never stop coming. But it does. And if you don't have a plan, it all disappears overnight.'",
      },
      {
        title: "Shaq vs. The Average Pro Athlete",
        content: "Studies show that 60% of NBA players go broke within five years of retirement. 78% of NFL players face financial hardship within two years. But Shaquille O'Neal took a completely different path. After wasting a million dollars in his first 30 minutes as a millionaire, he got serious. He earned an MBA, hired financial advisors, and built a business empire including over 150 car washes, 40 fitness centers, and franchises in Auntie Anne's, Papa John's, and Five Guys. He invested in Google and Apple before they became giants. Today his net worth exceeds $400 million -- more than he ever earned playing basketball. The difference between Shaq and the players who went broke? A business plan, patience, and the humility to learn what he didn't know.",
      },
    ],
    keyInsights: [
      "Have a business plan before the money comes",
      "Get good advisors: an accountant, a lawyer, a mentor",
      "Save before you spend",
      "Diversify: never depend on one income source",
    ],
    thinkAboutIt: "If you suddenly received $10,000, what would your plan be? Would you spend it all, save it all, or do something in between?",
    lifeLesson: "Going viral is luck. Building a business is a skill. You need both to last, but only one is within your control.",
    buildsOn: "Hard Work & Networking",
    connectionNote: "Hard work builds the foundation. But what you build on it matters \u2014 this module shows why sustainable beats viral every time.",
    stageOfChange: "Action",
    survivalModeNote: "When money comes in a burst \u2014 a tax refund, a gift, a side hustle windfall \u2014 the instinct to spend it fast makes sense when you've gone without. But learning to plan for it changes the game.",
  },
  {
    id: "residual-income",
    title: "Residual Income: Money While You Sleep",
    icon: Repeat,
    intro: "Most people trade their time for money at a job. But the wealthiest people build systems that earn money even when they're not working. This is the concept of residual income.",
    points: 75,
    keyTerms: [
      { term: "Residual Income", definition: "Money that keeps coming in after the initial work is done." },
      { term: "Passive Income", definition: "Earnings that require little to no daily effort to maintain." },
      { term: "Asset", definition: "Something you own that puts money in your pocket." },
      { term: "Liability", definition: "Something you own that takes money out of your pocket." },
      { term: "Cash Flow", definition: "The regular movement of money into and out of your accounts." },
      { term: "Equity", definition: "The value of ownership in something, like a house or business." },
      { term: "Franchise", definition: "A business model where you pay to use an established brand and system." },
      { term: "Royalties", definition: "Payments made to creators every time their work is used, played, or sold." },
    ],
    stories: [
      {
        title: "The Laundromat Model",
        content: "A laundromat owner invests around $200,000 to set up a location with commercial washers and dryers. Once it's running, those machines work 24 hours a day, 7 days a week. Customers pay per load. The owner earns $3,000 to $5,000 per month, even while sleeping, on vacation, or spending time with family. The machines don't call in sick. They don't need motivation. They just work. This is what building a system looks like.",
      },
      {
        title: "Car Wash Cash Flow",
        content: "A well-run car wash location operates on a similar model. Customers drive in, pay, and drive out with a clean car. One location can generate $500,000 to $1,000,000 per year in revenue with the right setup, location, and management. The owner doesn't wash every car personally. They built a system with equipment and staff that runs whether the owner is there or not.",
      },
      {
        title: "The Duplex Strategy",
        content: "Here's a powerful real estate strategy: buy a duplex, which is a building with two separate living units. Live in one side and rent the other. Your tenant's rent covers most or all of your mortgage payment. You're essentially living for free while building equity in a property. After a few years, you can move out, rent both sides, and use the income to buy another property. This is how many real estate investors got their start.",
      },
      {
        title: "Songs That Pay Forever",
        content: "When a songwriter creates a hit song, they earn royalties every single time that song plays on the radio, streams on a platform, or gets used in a movie. Some songs written decades ago still generate thousands of dollars per month. The songwriter did the work once, but the income keeps flowing for years or even a lifetime. This is the ultimate example of residual income: create something valuable once, and get paid for it over and over again.",
      },
      {
        title: "Shaq's Car Wash and Franchise Empire",
        content: "Shaquille O'Neal owns over 150 car washes across the country. Each location runs whether Shaq is there or not, generating revenue 365 days a year. He also owns dozens of franchise restaurants. When asked why car washes and fast food instead of something glamorous, Shaq said: 'People always need clean cars and food. It's not exciting, but it's consistent.' That consistency is the definition of residual income. While other retired athletes struggle, Shaq's systems generate millions annually without him lifting a finger.",
      },
      {
        title: "Jay-Z: From Brooklyn to Billionaire",
        content: "Jay-Z didn't just make money from music. He built Roc-A-Fella Records and earned royalties from every artist on the label, not just himself. He invested in Tidal, a streaming platform. He launched a clothing line, Rocawear, and sold it for $204 million. He bought Armand de Brignac champagne and D'Usse cognac brands. He invested in real estate across New York City. Each of these businesses generates residual income whether Jay-Z records another song or not. He went from selling CDs out of his car trunk to becoming hip-hop's first billionaire because he understood one principle: own the system, don't just work in it.",
      },
    ],
    thinkAboutIt: "What's the difference between a job and a business? Which one keeps paying you even when you stop working?",
    lifeLesson: "Rich people don't work for money. They build systems that work for them.",
    buildsOn: "Going Viral vs. Sustainable",
    connectionNote: "Sustainable businesses create something even better: residual income. Money that keeps coming even when you stop working.",
    stageOfChange: "Action",
    survivalModeNote: "Residual income might feel like a rich person's luxury. But the laundromat model, the duplex strategy \u2014 these are tools people in every neighborhood use to build real stability.",
  },
  {
    id: "risk-diversification",
    title: "Risk, Diversification & Smart Decisions",
    icon: Shield,
    intro: "Every financial decision involves some level of risk. The goal isn't to avoid risk entirely. It's to understand it, manage it, and make smart choices that protect your future.",
    points: 50,
    keyTerms: [
      { term: "Risk", definition: "The chance that you could lose some or all of the money you invest." },
      { term: "Diversification", definition: "Spreading your money across different investments to reduce risk." },
      { term: "Portfolio", definition: "Your complete collection of investments." },
      { term: "Risk Tolerance", definition: "How much risk you're comfortable taking with your money." },
      { term: "Emergency Fund", definition: "Money saved specifically for unexpected expenses like medical bills or car repairs." },
      { term: "Insurance", definition: "A product you buy to protect yourself financially against unexpected events." },
      { term: "Hedge", definition: "An investment made to reduce the risk of another investment." },
    ],
    stories: [
      {
        title: "Don't Put All Your Eggs in One Basket",
        content: "In a classroom simulation, Student A invested all 1,000 virtual credits into a single tech stock. When that stock dropped 40%, they lost 400 credits overnight. Student B spread their 1,000 credits across 5 different stocks in different industries. When one stock dropped 40%, their overall portfolio only went down 8% because the other stocks stayed steady or went up. Same starting amount, dramatically different outcomes. Diversification doesn't prevent all losses, but it prevents catastrophic ones.",
      },
      {
        title: "The 50/30/20 Rule",
        content: "One of the simplest budgeting frameworks is the 50/30/20 rule. Put 50% of your income toward needs like food, housing, and transportation. Spend 30% on wants like entertainment, hobbies, and treats. Save 20% for the future, including emergency funds and investments. This works whether you earn $10 per week in allowance or $10,000 per month at a job. The percentages stay the same. It's a framework you can use for life.",
      },
      {
        title: "The Emergency Fund Shield",
        content: "Life throws curveballs. A car breaks down. A family member gets sick. You lose a job. Without an emergency fund, one bad event can spiral into credit card debt, missed rent, and financial disaster. Financial experts recommend saving 3 to 6 months of expenses. This money isn't for investing or spending. It's your safety net. Having it means one bad month doesn't become a bad year. It's the foundation of financial security.",
      },
    ],
    thinkAboutIt: "If you had to split $100 between 5 different investments, how would you divide it and why?",
    lifeLesson: "The biggest risk is not taking any risk at all, but smart risk means doing your homework first.",
    buildsOn: "Residual Income",
    connectionNote: "Now that you know how to build income streams, let's learn how to protect them. Diversification is your financial insurance policy.",
    stageOfChange: "Action",
    survivalModeNote: "The 50/30/20 rule works at any income level. Even $10 a week can be split. The percentage matters more than the dollar amount.",
  },
  {
    id: "data-driven-decisions",
    title: "Data-Driven Decisions: Let the Numbers Guide You",
    icon: BarChart3,
    intro: "Every choice you make can be improved with data. Right here in this program, you already have powerful analytics tools that show you patterns, trends, and insights. Learning to read data isn't just a school skill -- it's how successful people and businesses make winning decisions every single day.",
    points: 75,
    keyTerms: [
      { term: "Data Analysis", definition: "Examining information to find patterns, trends, and insights that help you make better decisions." },
      { term: "Trend", definition: "A pattern that shows whether something is going up, going down, or staying the same over time." },
      { term: "Metric", definition: "A specific measurement used to track performance or progress." },
      { term: "Dashboard", definition: "A visual display that shows your most important information at a glance, like the instrument panel of a car." },
      { term: "Benchmark", definition: "A standard or point of reference you compare your performance against." },
      { term: "Correlation", definition: "When two things tend to change together. If one goes up, the other often does too." },
      { term: "ROI (Return on Investment)", definition: "A measure of how much you gained compared to how much you put in." },
    ],
    stories: [
      {
        title: "Your Thrive Dashboard: A Personal GPS",
        content: "Right here in your Panther Village, the Thrive Dashboard tracks six areas of your life: Learning, Executive Function, Belonging, Wellbeing, Context, and Protective Factors. It produces a 0-to-100 score with trend lines so you can see exactly where you are growing and where you might need support. Imagine if you noticed your Belonging score dropping for three weeks straight. Without the data, you might not realize something is off. With it, you can talk to a mentor, join a study group, or reconnect with classmates before the dip becomes a problem. That is the power of data: it catches what your feelings might miss.",
      },
      {
        title: "Stock Market Page: Patterns Tell the Story",
        content: "When you look at the virtual Stock Market in this program, you see price charts that move up and down over time. Those are not random squiggles -- they are data telling a story. A stock trending upward for weeks might signal a strong company. One swinging wildly might be too risky for a patient investor. Professional traders on Wall Street and right here on East Sixth Street in Austin use the same skill: reading charts to spot patterns before making a move. You are already practicing that skill every time you check your portfolio.",
      },
      {
        title: "Panther Power Score: Measuring What Matters",
        content: "Your Panther Power Score tracks five categories: Education, Character, Leadership, Entrepreneurship, and Community. Every action you take in the Academy feeds data into these scores. If you notice your Leadership score is lower than your Education score, the data is telling you something: maybe you need to enter a competition, lead a study group, or mentor a younger student. In Austin, the Chamber of Commerce uses similar scorecards to measure whether the city is growing in the right ways. Businesses use them to decide where to invest. You already have your own personal scorecard right here.",
      },
      {
        title: "Marketplace Analytics: Supply, Demand, and Smart Pricing",
        content: "Every item listed on the Panther Marketplace generates data: how many views it gets, how quickly it sells, and at what price. If you list a study guide for 50 credits and it sells in two minutes, the data tells you the price was probably too low -- there was more demand than you expected. If it sits for a week with no buyers, the price might be too high or nobody needs that subject right now. Real businesses in Austin do the same thing. A food truck owner on South Congress tracks which tacos sell fastest at lunch versus dinner and adjusts the menu. An Airbnb host on East Riverside checks occupancy rates to set nightly prices. Data turns guessing into strategy.",
      },
      {
        title: "Self-Assessment Check-Ins: Data About You",
        content: "The daily self-assessment in this program asks about your energy, stress, focus, belonging, confidence, and mood. Over time, this builds a personal data set about you. Maybe you discover that your focus drops every Wednesday afternoon, which means you should schedule your hardest homework on Tuesday evening instead. Or maybe your confidence peaks after competition days, which tells you that challenges fuel your growth. Professional athletes track sleep, nutrition, and heart rate the same way. The Houston Texans and Austin FC analyze player data every single day. You have that same capability right here in Panther Village.",
      },
    ],
    keyPrinciples: [
      "Data does not lie, but it needs context to be useful",
      "Track trends over time, not single data points",
      "Use your dashboards regularly -- data only helps if you look at it",
      "Compare your progress to your own past performance, not just to others",
      "When the data and your gut feeling disagree, investigate further before deciding",
    ],
    thinkAboutIt: "Look at your Panther Power scores right now. Which category is highest and which is lowest? What does that data tell you about where to focus your energy this week?",
    lifeLesson: "The best decision-makers do not guess. They gather data, study the patterns, and then act. You already have the tools -- now use them.",
    buildsOn: "Risk & Diversification",
    connectionNote: "Smart risk management needs good data. This module shows you how the tools you already have in Panther Village help you make better financial decisions.",
    stageOfChange: "Action",
    survivalModeNote: "Data isn't just for scientists and Wall Street. Tracking your own patterns \u2014 spending, mood, energy \u2014 gives you control. And control is power.",
  },
  {
    id: "rainy-day-fund",
    title: "Rainy Day Fund & Asset Accountability",
    icon: Umbrella,
    intro: "Life is full of surprises, and not all of them are good ones. This module teaches you how to build a financial safety net and how to know exactly what you own versus what you owe. When the unexpected hits, the prepared survive.",
    points: 50,
    keyTerms: [
      { term: "Emergency Fund", definition: "Money saved specifically for unexpected expenses like medical bills, car repairs, or job loss." },
      { term: "Rainy Day Fund", definition: "A smaller savings stash for minor unexpected costs, like a broken phone or a last-minute school expense." },
      { term: "Asset", definition: "Something you own that has value or puts money in your pocket, like a savings account, a house, or a business." },
      { term: "Liability", definition: "Something you owe or that takes money out of your pocket, like a loan, credit card debt, or a car payment." },
      { term: "Net Worth", definition: "Everything you own (assets) minus everything you owe (liabilities). The true measure of your financial health." },
      { term: "Liquid Assets", definition: "Things you own that can be quickly converted to cash, like money in a savings account or stocks." },
      { term: "Fixed Assets", definition: "Things you own that take time to sell, like a house, land, or equipment." },
      { term: "Depreciation", definition: "When something loses value over time. A new car loses value the moment you drive it off the lot." },
    ],
    stories: [
      {
        title: "The Family Car Breakdown",
        content: "Two families get the same bad news: their car needs a $1,200 repair. Family A has a rainy day fund with $2,000 saved up. They pay the mechanic, drive home, and life goes on. Family B has no savings. They take out a payday loan at 391% APR to cover the repair. Two months later, that $1,200 has ballooned to $1,800 with fees and interest. They borrow again to cover the difference. Six months later, they owe over $3,000 on a $1,200 repair. Same problem, completely different outcomes. The only difference was preparation.",
      },
      {
        title: "Beyonce's Business Brain",
        content: "Beyonce isn't just one of the greatest performers of all time. She's also a serious businesswoman who tracks every asset she owns. Her production company, Parkwood Entertainment, controls her music, tours, and films. She has clothing lines, a fragrance collection, and real estate investments. But here's what makes her smart: she knows exactly what each asset is worth, what it costs to maintain, and whether it's making or losing money. She doesn't just earn money. She accounts for every dollar. That's asset accountability, and it's why her empire keeps growing.",
      },
      {
        title: "The Sneaker Collection Mistake",
        content: "Marcus spent $2,000 over a year buying limited edition sneakers, convinced he was 'investing.' But here's the reality check: most sneakers lose value once they're worn. They scuff, they crease, and new releases make old ones less desirable. After a year, his collection was worth maybe $800. Meanwhile, his friend Aaliyah put the same $2,000 into a high-yield savings account earning 4.5% interest. After one year, she had $2,090 and her money was completely liquid, meaning she could access it anytime. Marcus had shoes he couldn't easily sell. Aaliyah had cash that was growing. Know the difference between a purchase and an investment.",
      },
      {
        title: "Dave Ramsey's $1,000 Start",
        content: "Dave Ramsey is one of the most famous financial educators in America. But he wasn't always successful. In his 20s, he built a $4 million real estate portfolio, then lost everything and filed for bankruptcy. That experience taught him a lesson he now teaches millions of people: before you invest a single dollar, before you pay off debt aggressively, before you do anything else, save your first $1,000 as a starter emergency fund. It's not a lot, but it's enough to handle most small emergencies without going into debt. Ramsey rebuilt his entire financial life starting with that simple $1,000 cushion, and today his company is worth hundreds of millions.",
      },
    ],
    thinkAboutIt: "If your family had a surprise $500 expense tomorrow, could you handle it? What would you do differently to prepare?",
    lifeLesson: "An emergency fund isn't for emergencies you plan for. It's for the ones you never see coming. That's why you build it before you need it.",
    keyPrinciples: [
      "Save your first $1,000 before investing anything",
      "Know the difference between assets (things that make you money) and liabilities (things that cost you money)",
      "Track everything you own and everything you owe",
      "Your net worth is the real scorecard, not your income",
    ],
    buildsOn: "Data-Driven Decisions",
    connectionNote: "You've learned to track data and manage risk. Now let's build the most important safety net: your rainy day fund.",
    stageOfChange: "Action",
    survivalModeNote: "If saving feels impossible right now, that's okay. Start with one dollar. Then two. The habit matters more than the amount. Every dollar saved is one less emergency away from a crisis.",
  },
  {
    id: "taxes-and-capital-gains",
    title: "Taxes: Where Does Your Money Go?",
    icon: Receipt,
    intro: "You earned it, but Uncle Sam wants his cut. Understanding taxes, capital gains, and withdrawal penalties is the difference between keeping your money and watching it disappear. This module breaks down where your money actually goes and how to keep more of it legally.",
    points: 75,
    keyTerms: [
      { term: "Income Tax", definition: "A percentage of the money you earn that goes to the federal and state government to pay for public services." },
      { term: "Sales Tax", definition: "A small percentage added to the price of things you buy. It varies by state and city." },
      { term: "Capital Gains Tax", definition: "Tax you pay on the profit you make when you sell an investment for more than you paid for it." },
      { term: "Short-Term Capital Gains", definition: "Profit from selling an investment held for less than one year. Taxed at your regular income tax rate, which is higher." },
      { term: "Long-Term Capital Gains", definition: "Profit from selling an investment held for more than one year. Taxed at a lower rate as a reward for patience." },
      { term: "Tax Bracket", definition: "The percentage of income tax you pay, based on how much you earn. Higher income means a higher bracket." },
      { term: "W-2 Form", definition: "A document your employer gives you each year showing how much you earned and how much tax was already taken out." },
      { term: "Tax Return", definition: "A form you file with the government each year to report your income and calculate what you owe or what refund you get back." },
      { term: "Early Withdrawal Penalty", definition: "A fee you pay for taking money out of a retirement account before you reach age 59 and a half." },
      { term: "401(k)", definition: "A retirement savings account offered by employers where your money grows tax-deferred until you withdraw it in retirement." },
      { term: "IRA", definition: "Individual Retirement Account. A personal retirement savings account with tax advantages." },
      { term: "Tax-Deferred", definition: "You don't pay taxes on the money now, but you will when you withdraw it later, usually in retirement." },
    ],
    stories: [
      {
        title: "Your First Paycheck Shock",
        content: "Jaylen got his first summer job at a local store making $12 per hour. He worked 40 hours in his first week and was pumped to get $480. But when he opened his paycheck, it said $389. He thought there was a mistake. There wasn't. Federal income tax took $48. Social Security took $30. Medicare took $7. State tax took $6. Welcome to adulting. The money taken out pays for roads, schools, firefighters, Social Security for grandparents, and more. It's not fun to see, but understanding where it goes helps you plan better. The lesson? When you're budgeting, always calculate based on your take-home pay, not your hourly rate times hours worked.",
      },
      {
        title: "The Capital Gains Warning",
        content: "Marcus invested $1,000 in a stock he researched. Eight months later, the stock was worth $1,500. Excited, he sold everything, thinking he just made $500 in profit. But Marcus held the stock for less than one year, which means his $500 profit is taxed as short-term capital gains, the same rate as regular income. After taxes, his actual profit was closer to $375. Here's the thing: if Marcus had waited just four more months to sell, his profit would have been taxed at the long-term capital gains rate, which is significantly lower. He could have kept $425 or more instead of $375. Patience doesn't just grow your investments. It saves you money on taxes too.",
      },
      {
        title: "The 401(k) Early Withdrawal Trap",
        content: "Keisha's mom had $20,000 saved in her 401(k) retirement account. When an emergency hit and they needed $5,000 fast, she decided to withdraw it early. Bad move. Because she was under 59 and a half years old, she got hit with a 10% early withdrawal penalty, that's $500 gone immediately. Then she owed income taxes on the withdrawal, another $1,100. That $5,000 she needed actually cost her $6,600. She lost $1,600 just for touching her retirement money too early. This is exactly why you need a separate rainy day fund. Retirement accounts are for retirement. Dipping into them early is one of the most expensive financial mistakes you can make.",
      },
      {
        title: "LeBron James and the Tax Map",
        content: "LeBron James doesn't just play basketball in one city. He plays games in arenas across the country, and here's what most people don't realize: each state charges income tax on the money he earns while playing there. If LeBron earns $100,000 for a game in New York, New York state wants its cut. If he plays in California, California wants its cut too. His tax team has to file returns in over a dozen states every single year. This is why some professional athletes choose to live in states like Texas or Florida that have no state income tax. It's not just about the weather. It's about keeping more of their earnings. Taxes affect every single financial decision, even where you choose to live.",
      },
    ],
    redFlags: [
      "Never ignore taxes when calculating investment profits",
      "Early withdrawal from retirement accounts almost always costs more than you think",
      "Short-term capital gains are taxed much higher than long-term ones",
      "If someone says their investment is 'tax-free,' ask a lot of questions",
    ],
    thinkAboutIt: "If you earned $100 from selling something you made, how much do you think you'd actually keep after taxes? Does that change how you'd price your product?",
    lifeLesson: "It's not about how much you make. It's about how much you keep. Understanding taxes is the difference between wealth and just looking wealthy.",
    buildsOn: "Rainy Day Fund",
    connectionNote: "Your emergency fund is set. Now let's make sure you understand where your money goes before it even reaches you \u2014 taxes.",
    stageOfChange: "Action",
    survivalModeNote: "Taxes hit everyone, but they hit harder when you don't understand them. Knowledge about tax brackets and deductions is how working families keep more of what they earn.",
  },
  {
    id: "cds-trusts-estate",
    title: "CDs, Trusts & Planning for the Long Game",
    icon: Lock,
    intro: "Building wealth is only half the battle. Protecting it for yourself and the people you love is the other half. This module covers safe savings tools like CDs, the power of trusts, and why estate planning matters for everyone, not just the rich.",
    points: 75,
    keyTerms: [
      { term: "Certificate of Deposit (CD)", definition: "A savings product where you lock your money in a bank for a set period of time in exchange for a higher interest rate than a regular savings account." },
      { term: "Maturity Date", definition: "The date when a CD or bond reaches the end of its term and you can withdraw your money plus interest." },
      { term: "Trust", definition: "A legal arrangement where one person holds and manages money or property for the benefit of someone else." },
      { term: "Beneficiary", definition: "The person who receives money, property, or benefits from a trust, will, or insurance policy." },
      { term: "Estate", definition: "Everything a person owns at the time of their death, including money, property, and possessions." },
      { term: "Estate Planning", definition: "The process of deciding what happens to your money and property after you pass away or if you become unable to manage it yourself." },
      { term: "Will", definition: "A legal document that states who gets your property and assets after you die." },
      { term: "Trustee", definition: "The person or organization responsible for managing a trust and making sure the beneficiary receives what they're supposed to." },
      { term: "Irrevocable Trust", definition: "A trust that cannot be changed or cancelled once it's created. It offers stronger legal and tax protection." },
      { term: "Revocable Trust", definition: "A trust that can be changed or cancelled by the person who created it. More flexible but with fewer protections." },
      { term: "Probate", definition: "The legal process of distributing a person's estate after they die. It can be slow, expensive, and public." },
      { term: "Legacy", definition: "What you leave behind for future generations, including money, property, values, and impact on your community." },
    ],
    stories: [
      {
        title: "The CD Ladder Strategy",
        content: "When Grandma Rose gave her granddaughter Mia $1,200 in birthday money over several years, she didn't just put it all in a regular savings account earning almost nothing. Instead, she taught Mia the CD ladder strategy. They split the money into three CDs: $400 in a 6-month CD, $400 in a 1-year CD, and $400 in a 2-year CD. Each CD earned a higher interest rate than a savings account. Every time a CD matured, Mia could either use the money if she needed it or reinvest it into a new 2-year CD at an even higher rate. She always had money becoming available while earning better interest. It's like having three different piggy banks that pay you for being patient.",
      },
      {
        title: "Allen Iverson's Trust Fund Lifeline",
        content: "Remember Allen Iverson from Module 6? He earned over $200 million during his NBA career and burned through nearly all of it. Mansions, jewelry, an entourage of 50 people, gambling. By 2012, he was broke. But here's the twist that saved him: years earlier, Reebok had set up a $30 million trust fund that Iverson couldn't touch until he turned 55. No matter how much he spent, no matter how many bad decisions he made, that trust was untouchable. It literally saved him from having nothing. A trust protects money, sometimes even from yourself. That's not a weakness. That's wisdom built into a legal document.",
      },
      {
        title: "The Family Without a Will",
        content: "When Uncle James passed away unexpectedly, everyone assumed his daughter would get the house, his son would get the car, and the savings would be split evenly. But Uncle James never wrote a will. Without one, everything went to probate court. The state decided who got what, not the family. It took two years. Legal fees ate up $30,000 of the estate. Family members who hadn't spoken in years were forced into courtrooms arguing over possessions. Relationships were destroyed. A simple will, which costs as little as $300 to set up with a lawyer, could have prevented all of it. Uncle James worked his whole life to build something for his family. Without a will, most of it went to lawyers instead.",
      },
      {
        title: "Nipsey Hussle's Legacy",
        content: "Nipsey Hussle wasn't just a rapper. He was a visionary who was building generational wealth for his community in South Los Angeles. He owned the Marathon Clothing store, invested in real estate throughout the neighborhood, and earned royalties from his music. When he tragically passed away in 2019, his estate planning made sure his legacy continued. Because he had proper legal documents in place, his assets, including the store, the real estate, and the music royalties, were protected for his children. His family didn't have to fight in court. His businesses kept running. His community investments continued. Nipsey planned for a future he wouldn't see, and that planning ensured his impact lasted far beyond his lifetime.",
      },
    ],
    keyPrinciples: [
      "CDs are one of the safest ways to earn guaranteed interest on your savings",
      "A trust protects your money and your family's future",
      "Estate planning isn't just for rich or old people -- it's for anyone who wants to protect what they've built",
      "Starting early gives your money more time to grow",
      "Probate is expensive and public -- a trust avoids it",
    ],
    thinkAboutIt: "If you could set up a trust fund for someone you love, who would it be for and what would you want it to provide for them?",
    lifeLesson: "Building wealth is only half the job. Protecting it for the people you love is the other half.",
    buildsOn: "Taxes",
    connectionNote: "You know how taxes work. Now learn about legal tools \u2014 CDs, trusts, and wills \u2014 that protect your money and your family's future.",
    stageOfChange: "Maintenance",
    survivalModeNote: "Estate planning sounds like something for millionaires. It's not. A simple will can prevent your family from losing everything to court fees. Protecting what you have is just as important as earning more.",
  },
  {
    id: "diversified-portfolio",
    title: "Diversified Portfolios & Dividends: Making Money Work for You",
    icon: PieChart,
    intro: "Smart investors don't bet everything on one thing. They build a diversified portfolio, like a pie with many flavors, so if one slice goes bad, they still have plenty left. This module teaches you how to spread your investments and earn money just for owning them.",
    points: 75,
    keyTerms: [
      { term: "Diversified Portfolio", definition: "A collection of different types of investments spread across multiple areas to reduce risk." },
      { term: "Dividend", definition: "A payment a company makes to its shareholders, usually every quarter, as a share of its profits." },
      { term: "Dividend Yield", definition: "The percentage of a stock's price that gets paid out as dividends each year. A $100 stock paying $4 per year has a 4% yield." },
      { term: "Index Fund", definition: "A single investment that automatically holds shares in hundreds of companies, giving you instant diversification." },
      { term: "ETF (Exchange-Traded Fund)", definition: "Similar to an index fund but traded on the stock market like a regular stock. You can buy and sell it anytime during market hours." },
      { term: "Bonds", definition: "A loan you give to a company or government in exchange for regular interest payments plus your money back at the end." },
      { term: "Mutual Fund", definition: "A pool of money from many investors that a professional manager invests in a mix of stocks, bonds, or other assets." },
      { term: "Blue Chip Stocks", definition: "Shares in large, well-known, financially stable companies with a long history of reliable performance." },
      { term: "Growth Stocks", definition: "Shares in companies that are growing quickly and reinvesting profits to get even bigger, rather than paying dividends." },
      { term: "Rebalancing", definition: "Adjusting your portfolio periodically to maintain your desired mix of investments as values change over time." },
      { term: "Dollar-Cost Averaging", definition: "Investing the same amount of money on a regular schedule regardless of whether prices are up or down." },
      { term: "DRIP (Dividend Reinvestment Plan)", definition: "A program that automatically uses your dividend payments to buy more shares of the same stock, growing your investment faster." },
    ],
    stories: [
      {
        title: "The Investment Pie",
        content: "Think of your investment portfolio like a pie. You wouldn't want the entire pie to be one flavor, because if that flavor goes bad, you've got nothing. A smart investor might split their pie like this: 40% in stocks for growth, 20% in bonds for safety, 20% in index funds for broad diversity, 10% in savings accounts or CDs for guaranteed returns, and 10% in real estate or other investments for adventure. If the stock market has a bad month and that 40% slice drops in value, you still have 60% of your pie holding steady or even growing. That's the power of diversification. You don't need to pick the perfect investment. You need to build a balanced pie.",
      },
      {
        title: "Dividend Day: Getting Paid to Own",
        content: "Maya saved up $2,500 from summer jobs and birthday money. She bought 100 shares of a solid company at $25 each. The company pays a quarterly dividend of $1 per share. That means every three months, Maya receives $100 deposited into her account just for owning the stock. She doesn't have to do anything. She doesn't have to sell anything. The company simply shares its profits with her. That's $400 per year in passive income. After six years, Maya has earned $2,400 in dividends, nearly her entire original investment back. And here's the best part: she still owns all 100 shares. The stock is still hers, still growing in value, and still paying her every quarter.",
      },
      {
        title: "The Snowball Effect: DRIP",
        content: "Instead of pocketing her $100 quarterly dividends, Maya turns on DRIP, a Dividend Reinvestment Plan. Now her dividends automatically buy more shares of the same stock. After the first quarter, her $100 dividend buys 4 more shares. Now she owns 104 shares. Next quarter, those 104 shares earn $104 in dividends, which buys 4 more shares. Now she has 108 shares. Each quarter, she earns a little more, buys a little more, and her investment grows faster and faster, like a snowball rolling downhill. After 20 years, her original $2,500 investment has grown to over $12,000 without Maya adding another dollar of her own money. That's compound growth through dividends, and it's one of the most powerful wealth-building strategies that exists.",
      },
      {
        title: "Warren Buffett's Favorite Investment",
        content: "Warren Buffett, one of the richest people in the world, has said that for most people, the single best investment is a low-cost S&P 500 index fund. Why? Because it automatically diversifies you across 500 of America's biggest companies, including Apple, Amazon, Google, and hundreds more. You don't need to research individual stocks. You don't need to time the market. You just invest consistently, reinvest your dividends, and let time do the heavy lifting. Buffett was so confident in this advice that he made a $1 million bet that a simple S&P 500 index fund would beat professional hedge fund managers over 10 years. The hedge fund managers charged huge fees and used complex strategies. The index fund just held 500 companies and waited. After 10 years, Buffett won the bet. The index fund crushed the professionals.",
      },
    ],
    keyInsights: [
      "Diversification protects you -- don't put all your money in one stock, one industry, or one type of investment",
      "Dividends are like getting a paycheck from your investments without selling anything",
      "DRIP turns small dividends into serious wealth over time through compounding",
      "Dollar-cost averaging (investing the same amount regularly regardless of price) removes the stress of timing the market",
      "Index funds let you own a piece of hundreds of companies for one low price",
    ],
    thinkAboutIt: "If you were building your own investment pie right now, what 'flavors' would you include and why? Which would get the biggest slice?",
    lifeLesson: "Don't try to find the needle in the haystack. Just buy the whole haystack.",
    lifeLessonAttribution: "Jack Bogle, founder of Vanguard",
    buildsOn: "CDs, Trusts & Estate Planning",
    connectionNote: "You've learned to save and protect. Now learn to grow \u2014 through a diversified portfolio that spreads risk and builds wealth over time.",
    stageOfChange: "Maintenance",
    survivalModeNote: "You don't need a lot to start investing. Apps let you begin with as little as $1. The point isn't the amount \u2014 it's building the habit and understanding how growth works.",
  },
  {
    id: "investment-vehicles",
    title: "401(k)s, IRAs & Investment Vehicles: Your Wealth-Building Toolkit",
    icon: Landmark,
    intro: "There are special accounts designed to help you build wealth faster by giving you tax advantages. This module breaks down the most powerful investment vehicles, the habits that make them work, and simple formulas anyone can use to build real wealth over time.",
    points: 75,
    keyTerms: [
      { term: "401(k)", definition: "A retirement savings account offered by your employer. Money goes in before taxes, and many employers match your contributions, which is free money." },
      { term: "Roth IRA", definition: "A retirement account where you pay taxes now but never pay taxes on the growth. Your money grows completely tax-free." },
      { term: "Traditional IRA", definition: "A retirement account where you don't pay taxes now, but you pay taxes later when you withdraw the money in retirement." },
      { term: "Employer Match", definition: "When your employer adds money to your 401(k) for every dollar you contribute, usually up to a percentage of your salary. This is literally free money." },
      { term: "Vesting", definition: "The process of earning full ownership of your employer's matching contributions over time, usually 3 to 5 years." },
      { term: "HSA (Health Savings Account)", definition: "A triple-tax-advantaged account for medical expenses. Money goes in tax-free, grows tax-free, and comes out tax-free for medical costs." },
      { term: "529 Plan", definition: "A savings account specifically for education expenses. Earnings grow tax-free when used for college or trade school." },
      { term: "Brokerage Account", definition: "A regular investment account with no special tax advantages, but also no restrictions on when you can withdraw your money." },
      { term: "Rule of 72", definition: "A simple formula to estimate how long it takes your money to double. Divide 72 by your interest rate. At 8% return, your money doubles in about 9 years." },
      { term: "Pay Yourself First", definition: "The habit of automatically saving or investing a portion of every paycheck before spending on anything else." },
    ],
    stories: [
      {
        title: "The 401(k) Employer Match: Don't Leave Free Money on the Table",
        content: "When Destiny started her first real job at 22, her company offered a 401(k) with a 4% employer match. Her coworker explained it simply: 'If you put in 4% of your paycheck, the company gives you another 4% for free.' Destiny earned $40,000 per year. She contributed $1,600 (4%), and her company added another $1,600. That's $3,200 per year going into her retirement without her noticing the $133 per month from her paycheck. Her friend Carlos at the same company didn't sign up because he 'couldn't afford it.' He missed out on $1,600 in free money every year. Over 10 years, that's $16,000 in free money Carlos left on the table, and that's before any investment growth. A 401(k) match is the closest thing to free money you'll ever find.",
      },
      {
        title: "Roth IRA: Pay Taxes Now, Win Later",
        content: "At age 16, Amara started a Roth IRA with $500 from her part-time job. She added $100 per month from ages 16 to 25, then stopped contributing entirely. Total invested: about $11,400. But because a Roth IRA grows tax-free, and she started young, by age 65 her account had grown to over $400,000 without her adding another penny after 25. Her cousin David waited until 35 to start, invested $200 per month for 30 years (total: $72,000), and ended up with about $300,000. Amara invested less money but started earlier and ended up with more. The secret? Time. A Roth IRA rewards the early birds.",
      },
      {
        title: "The Rule of 72: The Simplest Math That Changes Everything",
        content: "Here's a formula every financially literate person knows: take the number 72 and divide it by your annual return rate. The answer tells you how many years it takes for your money to double. At 4% interest (savings account), your money doubles in 18 years. At 8% (stock market average), it doubles in 9 years. At 12%, it doubles in just 6 years. Now stack those doublings: $1,000 at 8% becomes $2,000 in 9 years, $4,000 in 18 years, $8,000 in 27 years, $16,000 in 36 years, and $32,000 in 45 years. One thousand dollars became thirty-two thousand without adding a single extra dollar. That's why starting early matters more than starting big.",
      },
      {
        title: "The Wealth-Building Formula: Automate It",
        content: "The wealthiest people in America don't have more willpower than everyone else. They have better systems. The number one wealth-building habit is automation: set up automatic transfers so money moves to your savings and investment accounts the same day your paycheck arrives. You never see it, so you never miss it. Financial experts call this 'paying yourself first.' Here's a simple starter formula: take your monthly income and split it: 50% for needs (rent, food, bills), 30% for wants (fun, hobbies, eating out), and 20% for future you (savings, investments, retirement accounts). When you get a raise, don't upgrade your lifestyle. Increase your automatic savings instead. This is called 'lifestyle creep prevention,' and it's how middle-income earners retire as millionaires.",
      },
    ],
    keyPrinciples: [
      "Never leave employer match money on the table -- it's free money",
      "Start investing as early as possible -- time matters more than amount",
      "The Rule of 72: divide 72 by your return rate to see how fast money doubles",
      "Automate your savings so you pay yourself first without thinking about it",
      "A Roth IRA is one of the most powerful tools for young people because your money grows tax-free for decades",
      "An HSA is a secret weapon -- triple tax advantage for medical expenses",
    ],
    thinkAboutIt: "Using the Rule of 72, if you invested $500 today at 8% annual return, how old would you be when it doubled? What about when it doubled again?",
    lifeLesson: "Wealth isn't built by earning more. It's built by keeping more, investing early, and letting time do the heavy lifting. The best time to start was yesterday. The second best time is today.",
    buildsOn: "Diversified Portfolios",
    connectionNote: "You know how to diversify. Now learn about the vehicles \u2014 401(k)s, IRAs, HSAs \u2014 that make your investments grow even faster with tax advantages.",
    stageOfChange: "Maintenance",
    survivalModeNote: "If no one in your family has ever had a 401(k) or IRA, you're not alone. But you're learning about them now, which means you'll be the first generation to use them. That's powerful.",
  },
  {
    id: "investing-vs-gambling",
    title: "Investing vs. Gambling: Why Robinhood Beats FanDuel",
    icon: Target,
    intro: "Sports betting apps make it look fun and easy to win money. But there's a massive difference between investing and gambling. One builds wealth over time. The other is designed to take yours. This module breaks down why putting your money in Robinhood is smarter than putting it on FanDuel.",
    points: 75,
    keyTerms: [
      { term: "Investing", definition: "Putting money into assets like stocks, bonds, or real estate with the expectation that they will grow in value over time." },
      { term: "Gambling", definition: "Risking money on an uncertain outcome, like a sports game or a hand of cards, where the odds are stacked against you." },
      { term: "House Edge", definition: "The mathematical advantage that a casino or betting platform has over you. It guarantees they profit over time, even if you win occasionally." },
      { term: "Expected Value", definition: "The average amount you can expect to win or lose per bet over time. In gambling, this is almost always negative." },
      { term: "Odds", definition: "The probability of a specific outcome happening. Sportsbooks set odds to ensure they profit regardless of who wins." },
      { term: "Vigorish (Vig)", definition: "The fee a sportsbook charges on every bet. It's built into the odds so you don't even notice it, but it guarantees the house always wins." },
      { term: "Dopamine", definition: "A brain chemical that creates feelings of pleasure and excitement. Gambling apps are designed to trigger dopamine hits that make you want to bet again and again." },
      { term: "Compounding", definition: "When your investment earnings generate their own earnings. Over time, this creates exponential growth that gambling can never match." },
      { term: "Risk-Adjusted Return", definition: "How much return you get for the amount of risk you take. Investments offer positive risk-adjusted returns. Gambling does not." },
    ],
    stories: [
      {
        title: "The Math Never Lies: $20 a Week for 10 Years",
        content: "Let's say two friends each have $20 per week to spare. Jamal puts his $20 per week into a diversified stock portfolio on a platform like Robinhood. Over 10 years, with an average 8% annual return, Jamal's total investment of $10,400 grows to about $16,000. He made roughly $5,600 in profit without doing anything special, just consistently investing. His friend DeShawn puts $20 per week into sports bets on FanDuel. The average sports bettor loses about 10% of what they wager over time because of the house edge. After 10 years, DeShawn has wagered $10,400 total and lost about $1,040. But that's the best case. Most casual bettors lose significantly more because they chase losses, bet emotionally, and increase their stakes when they're down. Jamal ended up with $16,000. DeShawn ended up with less than he started. Same $20. Completely different outcomes.",
      },
      {
        title: "How Sports Betting Apps Are Designed to Trap You",
        content: "FanDuel, DraftKings, and other betting apps spend billions of dollars on something called 'user experience design,' which is a polished way of saying they engineer their apps to keep you betting. Bright colors, celebratory animations when you win, instant deposits, slow withdrawals, 'free bet' bonuses that require you to wager more to unlock. They send push notifications during games to trigger FOMO (fear of missing out). They show you near-misses to make you think you 'almost won' and should try again. These are the exact same psychological tricks casinos use on slot machines. The apps are literally designed by teams of psychologists and data scientists whose entire job is to keep you playing. Meanwhile, investing apps like Robinhood or Fidelity are designed to help you buy assets that grow over time. One is designed to take your money. The other is designed to grow it.",
      },
      {
        title: "The House Always Wins: Understanding the Vig",
        content: "Here's something most sports bettors don't understand: the sportsbook wins no matter who wins the game. When you see odds like -110, that means you have to bet $110 to win $100. If two people bet opposite sides of the same game, one bets $110 on Team A and the other bets $110 on Team B, the sportsbook collects $220 total and pays out $210 to the winner. That extra $10 is the vig, and it's collected on every single bet. Multiply that by millions of bets per day and you understand why FanDuel's parent company is worth over $20 billion. They're not winning because they're lucky. They're winning because the math guarantees it. Every single bet you place, the odds are mathematically against you. In investing, the opposite is true: over long periods, the stock market has historically gone up, meaning time is on your side.",
      },
      {
        title: "Real Athletes, Real Losses",
        content: "Charles Barkley, one of the greatest basketball players of all time, has admitted to losing over $30 million gambling. He once lost $2.5 million in a single night at a casino. Michael Jordan's gambling was so well-known it became part of his public story, with reports of losing millions on golf bets and casino visits. These are men who earned hundreds of millions of dollars and still lost staggering amounts to gambling. If the greatest athletes in the world can't beat the house, what makes anyone think a phone app will be different? Meanwhile, athletes like LeBron James and Shaq invested their money instead of gambling it. LeBron's investments made him a billionaire. Shaq's franchise empire generates millions annually. They put their money where it could grow, not where it was designed to disappear.",
      },
      {
        title: "The '5 Years From Now' Test",
        content: "Here's a simple test for any financial decision: ask yourself, 'Where will this money be in 5 years?' If you invest $1,000 in an index fund on Robinhood, in 5 years at 8% average return, it becomes roughly $1,469. You still own it. It's still growing. You can sell it anytime. If you put $1,000 into sports bets on FanDuel, in 5 years that money is almost certainly gone. Statistically, less than 3% of sports bettors are profitable over a full year, and almost none are profitable over 5 years. The money went to the corporation that built the app. Every dollar you invest is working for your future. Every dollar you gamble is working for someone else's.",
      },
    ],
    redFlags: [
      "\"I'm really good at picking winners\" -- the data shows even professional sports analysts can't consistently beat the vig",
      "\"I'm up right now\" -- short-term wins are how gambling apps hook you. The house edge guarantees long-term losses",
      "\"It's just entertainment\" -- if you're tracking your wins and losses, it's not entertainment, it's gambling",
      "\"I can stop anytime\" -- if you need to say this, you might already have a problem",
      "\"My friend made $500 last weekend\" -- you never hear about the $2,000 they lost the month before",
    ],
    keyInsights: [
      "Investing puts the math on YOUR side. Gambling puts the math against you",
      "The stock market has averaged 8-10% annual returns over the past century. No gambler in history has matched that consistency",
      "Sports betting apps are designed by psychologists to trigger addictive behavior. Investing apps are designed to help you build wealth",
      "Time is an investor's best friend and a gambler's worst enemy",
      "Every dollar has two paths: it can work for you (investing) or work against you (gambling). Choose wisely",
    ],
    thinkAboutIt: "If someone offered you a choice between a guaranteed $50 or a 50/50 chance at $120, which would you pick? What does your answer tell you about how you think about risk?",
    lifeLesson: "Gambling is hoping to get lucky. Investing is planning to get wealthy. One is a wish. The other is a strategy. Always choose strategy.",
    buildsOn: "401(k)s & Investment Vehicles",
    connectionNote: "You've built your financial toolkit. This final module protects it by showing why investing beats gambling every single time.",
    stageOfChange: "Maintenance",
    survivalModeNote: "Sports betting apps target the same communities that payday lenders do. When money is tight, the promise of a quick win is incredibly tempting. But the math is designed to take your money, not grow it. Investing works differently \u2014 it's designed to grow your money over time.",
  },
];

export default function AcademyFinancialLiteracyPage() {
  useEffect(() => { document.title = 'Financial Literacy | ThriveUp Academy'; }, []);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" data-testid="loading-skeleton-financial-literacy">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="financial-literacy-page">
      <PageHeader
        title="Financial Literacy"
        description="Real-world money skills for future leaders."
        breadcrumbs={[{label:"Academy",href:"/academy"},{label:"Financial Literacy"}]}
        actions={<TrainingGuideButton moduleId="academy-financial-literacy" />}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 p-6 sm:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md p-2.5 bg-white/10">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-page-title">
              Financial Literacy Academy
            </h1>
          </div>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-page-subtitle">
          Real-World Money Skills for Future Leaders
        </p>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-module-count">
            15 Learning Modules
          </Badge>
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-total-points">
            975 Panther Power Points Available
          </Badge>
        </div>
      </div>

      <Card className="p-5 mb-8" data-testid="section-intro">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30 shrink-0">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-1">Welcome, Future Leaders</h2>
            <p className="text-sm text-muted-foreground">
              Financial literacy isn't about getting rich. It's about understanding how money works so you can make smart decisions, avoid traps, and build the life you want. Each module below contains real stories, essential vocabulary, and lessons that will serve you for a lifetime. Tap any module to explore.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4" data-testid="modules-list">
        {modules.map((mod) => {
          const isExpanded = expandedModule === mod.id;
          const Icon = mod.icon;

          return (
            <div key={mod.id} data-testid={`module-${mod.id}`}>
              <Card className="overflow-visible">
                <button
                  className="w-full text-left p-5 flex items-center gap-4 cursor-pointer bg-transparent border-none"
                  onClick={() => toggleModule(mod.id)}
                  data-testid={`button-toggle-${mod.id}`}
                >
                  <div className="rounded-md p-2.5 bg-rose-100 dark:bg-rose-900/30 shrink-0">
                    <Icon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{mod.intro}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Badge variant="secondary" data-testid={`badge-points-${mod.id}`}>
                      <Star className="h-3 w-3 mr-1" />
                      {mod.points} pts
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-6" data-testid={`content-${mod.id}`}>
                    <div className="border-t pt-5">
                      <p className="text-sm text-muted-foreground">{mod.intro}</p>
                    </div>

                    {mod.buildsOn && (
                      <div className="flex items-center gap-2 flex-wrap" data-testid={`builds-on-${mod.id}`}>
                        <Badge variant="secondary" className="text-xs">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Builds on: {mod.buildsOn}
                        </Badge>
                        {mod.connectionNote && (
                          <p className="text-sm text-muted-foreground italic">{mod.connectionNote}</p>
                        )}
                      </div>
                    )}

                    {mod.stageOfChange && (
                      <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid={`stage-${mod.id}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium">Growth Stage: {mod.stageOfChange}</span>
                        </div>
                      </Card>
                    )}

                    {mod.survivalModeNote && (
                      <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20" data-testid={`survival-note-${mod.id}`}>
                        <div className="flex items-start gap-2">
                          <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Meeting You Where You Are</span>
                            <p className="text-sm text-muted-foreground mt-1">{mod.survivalModeNote}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div data-testid={`terms-${mod.id}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold text-sm">Key Terms</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mod.keyTerms.map((kt) => (
                          <div
                            key={kt.term}
                            className="rounded-md bg-muted/50 p-3"
                            data-testid={`term-${mod.id}-${kt.term.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <Badge variant="secondary" className="mb-1.5" data-testid={`badge-term-${kt.term.toLowerCase().replace(/\s+/g, "-")}`}>
                              {kt.term}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{kt.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-testid={`stories-${mod.id}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold text-sm">Real World Stories</h4>
                      </div>
                      <div className="space-y-4">
                        {mod.stories.map((story, idx) => (
                          <Card
                            key={idx}
                            className="p-5"
                            data-testid={`story-${mod.id}-${idx}`}
                          >
                            <h5 className="font-semibold mb-2 flex items-center gap-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              {story.title}
                            </h5>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {story.content}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {mod.redFlags && (
                      <div data-testid={`red-flags-${mod.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <h4 className="font-semibold text-sm">Red Flags to Watch For</h4>
                        </div>
                        <Card className="p-5">
                          <ol className="space-y-2">
                            {mod.redFlags.map((flag, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`red-flag-${idx}`}>
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{flag}</span>
                              </li>
                            ))}
                          </ol>
                        </Card>
                      </div>
                    )}

                    {mod.keyPrinciples && (
                      <div data-testid={`principles-${mod.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <h4 className="font-semibold text-sm">Key Principles</h4>
                        </div>
                        <Card className="p-5">
                          <ol className="space-y-2">
                            {mod.keyPrinciples.map((principle, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`principle-${idx}`}>
                                <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{principle}</span>
                              </li>
                            ))}
                          </ol>
                        </Card>
                      </div>
                    )}

                    {mod.keyInsights && (
                      <div data-testid={`insights-${mod.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <h4 className="font-semibold text-sm">Key Insights</h4>
                        </div>
                        <Card className="p-5">
                          <ol className="space-y-2">
                            {mod.keyInsights.map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`insight-${idx}`}>
                                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{insight}</span>
                              </li>
                            ))}
                          </ol>
                        </Card>
                      </div>
                    )}

                    <Card className="p-5 bg-muted/30" data-testid={`think-about-it-${mod.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30 shrink-0">
                          <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Think About It</h4>
                          <p className="text-sm text-muted-foreground italic">{mod.thinkAboutIt}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30" data-testid={`life-lesson-${mod.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="rounded-md p-2 bg-rose-100 dark:bg-rose-900/40 shrink-0">
                          <Quote className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Life Lesson</h4>
                          <p className="text-sm font-medium">{mod.lifeLesson}</p>
                          {mod.lifeLessonAttribution && (
                            <p className="text-xs text-muted-foreground mt-1">
                              — {mod.lifeLessonAttribution}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleModule(mod.id)}
                        data-testid={`button-collapse-${mod.id}`}
                      >
                        <ChevronUp className="h-3.5 w-3.5 mr-1" />
                        Collapse Module
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
