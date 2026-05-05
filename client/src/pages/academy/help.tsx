import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Rocket,
  Zap,
  TrendingUp,
  ShoppingBag,
  Compass,
  Gamepad2,
  Heart,
  Trophy,
  DollarSign,
  HelpCircle,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface FaqItem {
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: LucideIcon;
  faqs: FaqItem[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    faqs: [
      {
        question: "How do I get around Panther Village?",
        answer: "Use the sidebar on the left side of the screen! It has links to every part of the academy. You can click the menu icon at the top to open or close it. The sidebar is organized into sections like Learning, Activities, and My Stuff so you can find what you need quickly.",
      },
      {
        question: "What are all the different sections for?",
        answer: "Panther Village has lots of cool areas! The Hub is your home base. You can explore the Stock Market, Marketplace, Career Explorer, Game Room, and more. Each area teaches you real-world skills while you earn points and rewards. Start by visiting the Hub to see everything available to you.",
      },
      {
        question: "Do I need to set up anything before I start?",
        answer: "The first thing you should do is create your avatar! Go to the Avatar page from the sidebar and customize how you look in Panther Village. After that, you're ready to explore. Your teacher may also give you specific instructions on where to start.",
      },
    ],
  },
  {
    id: "panther-power",
    title: "Panther Power",
    icon: Zap,
    faqs: [
      {
        question: "What is Panther Power?",
        answer: "Panther Power is your overall score that shows how much you're growing in 5 key areas: Education (doing well in lessons and quizzes), Character (being a good person and making smart choices), Leadership (stepping up and helping others), Entrepreneurship (learning about business and money), and Community (contributing to your school and neighborhood).",
      },
      {
        question: "How do I earn Panther Power points?",
        answer: "You earn points by completing daily quests, finishing lessons, playing educational games, participating in competitions, and making good choices in scenario adventures. Different activities give points in different categories. Check your Power page to see your scores in each area!",
      },
      {
        question: "What happens when I level up?",
        answer: "As your Panther Power grows, your level increases and you earn new titles! You start as a Young Panther and can work your way up. Higher levels unlock bragging rights and show your teachers and classmates how hard you've been working.",
      },
    ],
  },
  {
    id: "stock-market",
    title: "Stock Market",
    icon: TrendingUp,
    faqs: [
      {
        question: "How does the virtual stock market work?",
        answer: "The stock market in Panther Village uses virtual currency (not real money!) to teach you how investing works. You can browse different companies, check their prices, and decide which ones to buy. Prices change over time, just like in the real stock market. The goal is to learn how to make smart investment decisions.",
      },
      {
        question: "How do I buy and sell stocks?",
        answer: "Go to the Stocks page from the sidebar. Browse the available companies and click on one you're interested in. Enter the number of shares you want to buy and confirm. To sell, go to your portfolio and choose which stocks to sell. Remember, buy low and sell high is the basic idea!",
      },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: ShoppingBag,
    faqs: [
      {
        question: "How do I list something for sale?",
        answer: "Go to the Marketplace page and click the button to create a new listing. Give your item a name, write a description, set a price in virtual currency, and choose a category. Other students in Panther Village can then browse and buy from you. It's like running your own mini business!",
      },
      {
        question: "How do I buy from other students?",
        answer: "Browse the Marketplace to see what's available. When you find something you like, click on it to see the details and price. If you have enough in your wallet, you can purchase it. The virtual currency will transfer from your wallet to the seller's wallet automatically.",
      },
      {
        question: "What is the wallet?",
        answer: "Your wallet holds your virtual currency in Panther Village. You start with some currency and can earn more through quests, competitions, and selling items. You can spend it in the Marketplace, on stocks, or on campus projects. Check your Wallet page to see your balance and transaction history.",
      },
    ],
  },
  {
    id: "career-explorer",
    title: "Career Explorer",
    icon: Compass,
    faqs: [
      {
        question: "How do I browse different careers?",
        answer: "Go to the Career Explorer page to see tons of different careers organized by category. You can learn about what people do in each job, what education you need, how much they typically earn, and what skills are important. It's a great way to start thinking about what you might want to do when you grow up!",
      },
      {
        question: "Can I save careers I'm interested in?",
        answer: "Yes! When you find a career that sounds cool, you can save it to your interests. This helps you build a pathway of careers you might want to explore more. Your saved careers show up on your Pathway page so you can track what you're interested in over time.",
      },
    ],
  },
  {
    id: "games-activities",
    title: "Games & Activities",
    icon: Gamepad2,
    faqs: [
      {
        question: "How does the Game Room work?",
        answer: "The Game Room has fun games you can play against other students or the computer. Head to the Games page from the sidebar to see what's available. Each game teaches you different skills like strategy, math, and critical thinking while you have fun!",
      },
      {
        question: "What are ELO ratings?",
        answer: "ELO is a rating system that shows your skill level in games. Everyone starts at 1200 points. When you win, your rating goes up. When you lose, it goes down. Playing against someone with a higher rating and winning gives you more points. It's the same system used in chess!",
      },
      {
        question: "Are there tournaments?",
        answer: "Yes! Check the Competitions page to see if any game tournaments are happening. Tournaments let you compete against other students for prizes and bragging rights. Your teacher may also set up special tournaments for your class.",
      },
    ],
  },
  {
    id: "thrive-dashboard",
    title: "Thrive Dashboard",
    icon: Heart,
    faqs: [
      {
        question: "What are self-assessments?",
        answer: "Self-assessments are short check-ins where you answer questions about how you're feeling and doing in different areas of your life. They help you understand your strengths and areas where you might want to grow. There are no wrong answers \u2014 it's all about being honest with yourself!",
      },
      {
        question: "How do Thrive scores work?",
        answer: "Your Thrive score comes from your self-assessments and shows how you're doing across different wellness areas. It's not a grade \u2014 it's a tool to help you reflect on your well-being. The dashboard shows your scores over time so you can see how you're growing.",
      },
      {
        question: "Is my Thrive information private?",
        answer: "Yes! Your Thrive data is personal to you. Your specific answers and scores are kept private. Your teachers may see general trends to make sure everyone in the class is doing okay, but your individual responses stay between you and the system.",
      },
    ],
  },
  {
    id: "competitions-houses",
    title: "Competitions & Houses",
    icon: Trophy,
    faqs: [
      {
        question: "How do house points work?",
        answer: "When you join Panther Village, you're assigned to a House. Everything you do \u2014 completing quests, winning games, earning merit points \u2014 adds points to your House's total. Houses compete against each other throughout the year. Work together with your housemates to earn the most points and win!",
      },
      {
        question: "How do I enter competitions?",
        answer: "Go to the Competitions page to see all available competitions. Some are open for anyone to join, while others might be set up by your teacher. Click on a competition to see the details, rules, and prizes, then sign up if you want to participate. Good luck!",
      },
    ],
  },
  {
    id: "financial-literacy",
    title: "Financial Literacy",
    icon: DollarSign,
    faqs: [
      {
        question: "What do the financial literacy modules teach?",
        answer: "There are 9 modules that teach you everything about money! You'll learn about budgeting, saving, investing, spotting scams, understanding interest rates, building a network, the difference between going viral and building something sustainable, residual income, and protecting your finances. Each module has real stories and examples to make it interesting.",
      },
      {
        question: "How do I earn points from financial literacy?",
        answer: "Each module is worth 50 to 100 points. As you read through the content, learn the key terms, and think about the discussion questions, you earn points. The modules also connect to your Panther Power score in the Entrepreneurship and Education categories.",
      },
    ],
  },
  {
    id: "need-more-help",
    title: "Need More Help?",
    icon: HelpCircle,
    faqs: [
      {
        question: "I'm stuck and don't know what to do. Who can help?",
        answer: "Your teacher is always the best person to ask! They know Panther Village inside and out and can help you with anything. Raise your hand in class or talk to them before or after school. You can also ask a classmate who might have already figured out what you're working on.",
      },
      {
        question: "Can Spark AI help me?",
        answer: "Yes! Spark is the AI companion built into Panther Village. You can chat with Spark anytime to get help with lessons, ask questions about how things work, or even get study tips. Find Spark in the sidebar under the AI Companion section. Spark is friendly, smart, and always ready to help!",
      },
    ],
  },
];

export default function AcademyHelpPage() {
  useEffect(() => { document.title = 'Student Help | ThriveUp Academy'; }, []);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = searchQuery.trim() === ""
    ? helpSections
    : helpSections
        .map((section) => {
          const query = searchQuery.toLowerCase();
          const matchingFaqs = section.faqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(query) ||
              faq.answer.toLowerCase().includes(query)
          );
          if (matchingFaqs.length === 0) return null;
          return { ...section, faqs: matchingFaqs };
        })
        .filter((s): s is HelpSection => s !== null);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <PageHeader
          title="Help Center"
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Help" },
          ]}
        />
      </div>
      <div className="bg-[#800000] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-help-title">
            <HelpCircle className="w-7 h-7" />
            Student Help & FAQ
          </h1>
          <p className="text-white/80 mt-1" data-testid="text-help-subtitle">
            Find answers to common questions about Panther Village and all its features.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search help topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-help-search" aria-label="Search help topics" />
        </div>
        {filteredSections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-help-no-results">
            No help topics found matching your search.
          </div>
        )}
        {filteredSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card className="p-4" key={section.id} data-testid={`card-help-section-${section.id}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-md bg-[#800000]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#800000]" />
                </div>
                <h2 className="font-semibold text-lg" data-testid={`text-section-title-${section.id}`}>{section.title}</h2>
              </div>
              <Accordion type="multiple">
                {section.faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                    <AccordionTrigger data-testid={`trigger-faq-${section.id}-${idx}`} className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent data-testid={`content-faq-${section.id}-${idx}`}>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
