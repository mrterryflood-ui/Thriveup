import { useState } from "react";
import { Card } from "@/components/ui/card";
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
    ],
    thinkAboutIt: "Can you think of a time when waiting for something made it even better? What did that teach you?",
    lifeLesson: "The stock market is a device for transferring money from the impatient to the patient.",
    lifeLessonAttribution: "Warren Buffett",
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
    ],
    keyInsights: [
      "Have a business plan before the money comes",
      "Get good advisors: an accountant, a lawyer, a mentor",
      "Save before you spend",
      "Diversify: never depend on one income source",
    ],
    thinkAboutIt: "If you suddenly received $10,000, what would your plan be? Would you spend it all, save it all, or do something in between?",
    lifeLesson: "Going viral is luck. Building a business is a skill. You need both to last, but only one is within your control.",
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
    ],
    thinkAboutIt: "What's the difference between a job and a business? Which one keeps paying you even when you stop working?",
    lifeLesson: "Rich people don't work for money. They build systems that work for them.",
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
  },
];

export default function AcademyFinancialLiteracyPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="financial-literacy-page">
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
            8 Learning Modules
          </Badge>
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-total-points">
            475 Panther Power Points Available
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
