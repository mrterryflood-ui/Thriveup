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
}

const CHAPTERS: Chapter[] = [
  {
    title: "Welcome, Arthur",
    subtitle: "First Day & Avatar Creation",
    icon: User,
    narrative: [
      "Arthur Wakanda walks through the doors of TxEA 6th Grade Academy for the very first time. His hands are a little sweaty, his backpack feels heavier than usual, and the hallway seems to stretch forever. But then he sees it -- a giant banner that reads: \"Welcome, Young Panthers. Your Empire Starts Here.\"",
      "His first stop is the Avatar Creator, where he gets to design his own digital identity. He picks his hairstyle, his outfit, and even adds a pair of cool sneakers. For the first time today, Arthur smiles. This version of himself looks confident, ready for anything.",
      "Next comes the House Sorting. Arthur gets placed into the Crimson Lions -- a house known for courage and heart. His house leader explains how the merit system works: every act of kindness, every completed assignment, every moment of leadership earns points for the team. Arthur realizes this is not just about him. His whole house is counting on him.",
      "Arthur receives his starter wallet with $100 in virtual credits. It is not much, but it is a beginning. Every great empire started with a single step.",
    ],
    quote: "The journey of a thousand miles begins with a single step. Today, you took yours.",
    quoteAuthor: "Welcome message to all new Panthers",
    links: [
      { label: "Avatar Creator", href: "/academy/avatar", icon: User },
      { label: "House System", href: "/academy/houses", icon: Flag },
    ],
    stats: { wallet: 100, pantherPower: 0, housePoints: 0 },
  },
  {
    title: "Finding His Voice",
    subtitle: "Daily Quests & Life Lessons",
    icon: CalendarCheck,
    narrative: [
      "A week into the Academy, Arthur starts getting the hang of things. Every morning, he checks his Daily Quests -- small challenges that push him to grow. Today's quest: \"Introduce yourself to someone new and learn one thing about them.\" Arthur is nervous, but he walks up to a classmate named Maya and learns that she wants to be an architect.",
      "In Life Lessons class, Arthur discovers something amazing: the things he is learning in school connect directly to the real world. A math lesson about percentages turns into a conversation about business profits. A reading assignment about community leaders becomes a discussion about what leadership really means.",
      "Arthur's Panther Power score starts growing across five categories: Education, Character, Leadership, Entrepreneurship, and Community. He is not the strongest in any single area yet, but he is growing in all of them. His teachers notice. His house notices. And most importantly, Arthur notices.",
      "By the end of the second week, Arthur has completed twelve quests and attended four Life Lessons. He is starting to understand that success is not about being perfect -- it is about showing up every day and giving your best.",
    ],
    quote: "You do not have to be great to start, but you have to start to be great.",
    quoteAuthor: "Life Lesson #3",
    links: [
      { label: "Daily Quests", href: "/academy/quests", icon: CalendarCheck },
      { label: "Life Lessons", href: "/academy/lessons", icon: Lightbulb },
    ],
    stats: { wallet: 150, pantherPower: 45, housePoints: 15 },
  },
  {
    title: "The Lemonade Stand Empire",
    subtitle: "Choose Your Own Adventure",
    icon: Gamepad2,
    narrative: [
      "Arthur's eyes light up when he discovers the Choose Your Own Adventure scenarios. His first adventure: \"The Lemonade Stand Empire.\" He gets to make real business decisions -- where to set up shop, how to price his drinks, whether to spend money on fancy cups or save it for advertising.",
      "Arthur chooses a busy corner near the school, prices his lemonade at $2 a cup, and spends some of his wallet credits on a colorful sign. Business is booming on day one! He sells 45 cups and feels like a real entrepreneur.",
      "Then disaster strikes. A massive rainstorm hits on day two. Nobody wants cold lemonade in the rain. Arthur loses money on supplies he already bought. He feels defeated. Was this whole thing a mistake?",
      "But the adventure does not end there. Arthur gets a choice: give up, or adapt. He chooses to adapt. He pivots to selling hot chocolate instead, uses the leftover lemons to make lemon cookies, and even offers a \"rainy day special\" discount. By the end of the week, he has made back everything he lost -- and then some.",
      "The lesson hits Arthur like a bolt of lightning: Every entrepreneur faces setbacks. The ones who succeed are the ones who learn and try again. He writes this in his journal and underlines it twice.",
    ],
    quote: "Every entrepreneur faces setbacks. The ones who succeed are the ones who learn and try again.",
    quoteAuthor: "Arthur's journal entry",
    links: [
      { label: "Adventures (CYOA)", href: "/academy/scenarios", icon: Gamepad2 },
    ],
    stats: { wallet: 275, pantherPower: 120, housePoints: 35 },
  },
  {
    title: "Wall Street Panther",
    subtitle: "Stock Market & Investments",
    icon: TrendingUp,
    narrative: [
      "Arthur hears some older students talking about the virtual stock market, and his curiosity takes over. He opens the Stock Market page and sees a world of companies, charts, and numbers. It is intimidating at first, but Arthur remembers what he learned from the lemonade stand: research first, then act.",
      "He starts small, investing carefully in three companies that catch his eye. TechPanthers Inc, a company building educational technology, gets his first investment. Then CommunityBuild Co, which focuses on neighborhood improvement. And finally EduFuture Ltd, an education innovation company that Arthur believes in deeply.",
      "The results are a rollercoaster. TechPanthers Inc climbs 15% -- a solid win. CommunityBuild Co drops 5% -- Arthur's stomach sinks, but he holds steady. Then EduFuture Ltd starts climbing: 10%, 15%, 22%. Arthur learns that patience pays off.",
      "The big moment comes when EduFuture releases a positive earnings report and the stock doubles. Arthur's small investment turns into a serious return. But more importantly, he learns three lessons that will stay with him forever: do your research, diversify your investments, and be patient even when things look scary.",
      "Arthur starts tracking his portfolio like a hawk. He is not just playing a game -- he is learning how money really works.",
    ],
    quote: "The stock market is a device for transferring money from the impatient to the patient.",
    quoteAuthor: "Financial Literacy lesson",
    links: [
      { label: "Stock Market", href: "/academy/stocks", icon: TrendingUp },
    ],
    stats: { wallet: 520, pantherPower: 200, housePoints: 55 },
  },
  {
    title: "Building Dreams",
    subtitle: "Campus Builder & Competitions",
    icon: Building2,
    narrative: [
      "Arthur discovers the Build Your Black Campus project and something clicks inside him. He gets to help design a virtual campus inspired by historically Black colleges and universities. He adds a library with floor-to-ceiling windows, a community garden, and a student entrepreneurship center. Every contribution earns him campus points and wallet credits.",
      "When the Academic Bowl competition is announced, Arthur's house -- the Crimson Lions -- rallies together. Arthur enters the Social Sciences category because he has fallen in love with understanding how communities work, how economies function, and how leaders create change.",
      "The competition is fierce. Students from every house bring their A-game. Arthur studies hard, reviews his Life Lessons notes, and even asks his teachers for extra practice questions. On competition day, his hands shake as he answers question after question.",
      "When the results come in, Arthur has won 2nd place in Social Sciences. He did not get first, but he is proud. His house erupts in cheers, and they earn massive house points. Arthur learns that competing is not just about winning -- it is about pushing yourself to be better than you were yesterday.",
      "That night, Arthur opens Dream Design for the first time. He types in his dream college: Howard University. He types in his dream career: Social Science Engineer. The profile starts building, and so does his confidence.",
    ],
    quote: "You are not competing against others. You are competing against the person you were yesterday.",
    quoteAuthor: "Competition day speech",
    links: [
      { label: "Build Campus", href: "/academy/campus", icon: Building2 },
      { label: "Competitions", href: "/academy/competitions", icon: Trophy },
      { label: "Dream Design", href: "/academy/dreams", icon: Target },
    ],
    stats: { wallet: 680, pantherPower: 350, housePoints: 120 },
  },
  {
    title: "Panther Marketplace Mogul",
    subtitle: "Entrepreneurship",
    icon: Store,
    narrative: [
      "Arthur has an idea that keeps him up at night: What if he could share what he has learned with other students? He remembers how hard Social Sciences felt at first, and how his notes and study strategies eventually made everything click. What if he turned those notes into something others could use?",
      "He opens the Panther Marketplace and lists his first product: \"Arthur's Social Science Study Guide -- Volume 1.\" It is a collection of his best notes, practice questions, and memory tricks. He prices it at 25 wallet credits.",
      "The first sale comes within an hour. Then another. And another. By the end of the week, classmates from every house are buying Arthur's guides. Students start telling him that his guides helped them understand concepts they were struggling with. Arthur realizes that entrepreneurship is not just about making money -- it is about solving problems for people.",
      "He takes some of his earnings and buys a graphic design service from a classmate named Jasmine, who creates beautiful cover art for his guides. Version 2 of the study guides sells even faster. Arthur learns the power of collaboration -- he does not have to do everything alone.",
      "His marketplace sales grow his wallet significantly, and his Entrepreneurship Panther Power score skyrockets. Arthur is building something real.",
    ],
    quote: "The best businesses do not just make money. They make a difference in people's lives.",
    quoteAuthor: "Entrepreneurship Life Lesson",
    links: [
      { label: "Marketplace", href: "/academy/marketplace", icon: Store },
    ],
    stats: { wallet: 1250, pantherPower: 500, housePoints: 180 },
  },
  {
    title: "Fundraising for the Future",
    subtitle: "Print Shop & Merch",
    icon: ShoppingBag,
    narrative: [
      "Arthur discovers the Print Shop and his creative side explodes. He can design real merchandise -- t-shirts, stickers, notebooks -- and sell them to support his goals. An idea forms: What if he created merchandise that represented his dream?",
      "He designs a t-shirt that reads \"Future Howard Bison\" with a powerful panther silhouette. He creates stickers with motivational quotes from his journey. He even designs a notebook cover that says \"My Empire Starts Here.\" Every design reflects who Arthur is becoming.",
      "When Arthur learns about the UBO partnership for real college tuition fundraising, his heart races. This is not just a game anymore. The money from his merch sales can go toward actual college savings. He partners with the program and watches as his merch raises $450 toward his college fund.",
      "The community rallies behind Arthur's story. Teachers share his designs. Parents buy his merchandise. Other students start creating their own merch, inspired by what Arthur built. The Print Shop becomes a place where dreams take physical form.",
      "Arthur stares at his college fund balance: $450. It is not enough for four years of college, but it is proof that his dreams are not just fantasies. They are becoming real, one t-shirt at a time.",
    ],
    quote: "Your dreams deserve to be funded. Start building today, and the world will invest in your tomorrow.",
    quoteAuthor: "UBO Partnership message",
    links: [
      { label: "Print Shop", href: "/academy/merch", icon: ShoppingBag },
    ],
    stats: { wallet: 1800, pantherPower: 650, housePoints: 230, collegeFund: 450 },
  },
  {
    title: "The Howard Dream",
    subtitle: "Acceptance & Legacy",
    icon: GraduationCap,
    narrative: [
      "Arthur sits at his desk and looks at his Panther Power dashboard. Every single category is glowing: Education at 170, Character at 165, Leadership at 180, Entrepreneurship at 185, Community at 150. He has reached elite level. The boy who walked in with sweaty hands on day one has become a young leader.",
      "His Dream Design profile tells a story that no test score ever could. Academic excellence: top performer in Social Sciences, Academic Bowl finalist. Leadership awards: house captain for the Crimson Lions, mentor to three younger students. Community impact: $450 raised for college, campus builder contributor, marketplace entrepreneur. Entrepreneurship portfolio: study guide business with 23 sales, Print Shop designer, stock market investor.",
      "Arthur fills out his application to Howard University for the Social Science Engineering program. He writes about how a 6th grade academy taught him that success is not about where you start -- it is about the choices you make along the way. He writes about lemonade stands and rainstorms, about stocks that dropped and patience that paid off, about selling study guides and designing t-shirts for a dream.",
      "Weeks later, Arthur opens his mailbox and sees it: a large envelope with the Howard University seal. His hands tremble as he tears it open. \"Dear Arthur Wakanda, Congratulations! You have been accepted to Howard University, Class of 2032, Social Science Engineering program.\"",
      "Arthur does not just celebrate for himself. He goes back to the Academy Hub and leaves a message for every future Panther: \"I was exactly where you are right now. Nervous. Unsure. Wondering if any of this was real. It is real. Every quest you complete, every lesson you learn, every setback you overcome -- it all adds up. Your story is being written right now. Make it a good one.\"",
    ],
    quote: "Your story is being written right now. Make it a good one.",
    quoteAuthor: "Arthur Wakanda, Howard University Class of 2032",
    links: [
      { label: "Dream Design", href: "/academy/dreams", icon: Target },
      { label: "Panther Power", href: "/academy/power", icon: Zap },
      { label: "Academy Hub", href: "/academy", icon: Rocket },
    ],
    stats: {
      wallet: 2500,
      pantherPower: 850,
      housePoints: 310,
      collegeFund: 1200,
      adventuresCompleted: 4,
      marketplaceSales: 23,
      stocksPortfolio: 380,
    },
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
  [12, 10, 8, 5, 10],
  [20, 22, 18, 35, 25],
  [35, 30, 30, 60, 45],
  [65, 55, 75, 70, 85],
  [80, 75, 85, 140, 120],
  [110, 100, 120, 170, 150],
  [170, 165, 180, 185, 150],
];

function StatsFooter({ stats, chapterIndex }: { stats: ChapterStats; chapterIndex: number }) {
  const isFinale = chapterIndex === 7;

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
      <div className={`grid gap-4 ${isFinale ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
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
  const isFinale = index === 7;

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
          From his first day at TxEA to Howard University
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