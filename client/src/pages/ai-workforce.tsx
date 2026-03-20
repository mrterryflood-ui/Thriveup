import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain, Sparkles, Code2, BarChart3, Shield, Users, Rocket,
  CheckCircle2, Clock, BookOpen, Target, Award, Zap, Globe,
  Layers, ChevronRight, GraduationCap, ArrowRight, Star,
  Cpu, Database, Bot, LineChart, Briefcase, TrendingUp,
  Lock, Eye, MessageSquare, Wrench, FileText, Monitor,
  Lightbulb, Play, Settings, Share2, Workflow,
} from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

interface TrackModule {
  title: string;
  topics: string[];
  duration: string;
  project?: string;
}

interface Track {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Brain;
  color: string;
  gradient: string;
  difficulty: Difficulty;
  duration: string;
  description: string;
  whoIsItFor: string[];
  outcomes: string[];
  modules: TrackModule[];
  tools: string[];
  certification: string;
  careerPaths: string[];
}

const TRACKS: Track[] = [
  {
    id: "ai-foundations",
    title: "AI Foundations",
    subtitle: "Your First Step Into AI",
    icon: Sparkles,
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500 to-teal-600",
    difficulty: "beginner",
    duration: "4 weeks",
    description: "No coding required. Learn what AI actually is, how to use it effectively at work, and how to think critically about what it produces. This is where everyone starts.",
    whoIsItFor: [
      "Anyone new to AI — no tech background needed",
      "Workers looking to stay relevant in the AI era",
      "Managers who need to understand AI capabilities",
      "Career changers exploring tech opportunities",
    ],
    outcomes: [
      "Understand how AI works at a conceptual level",
      "Write effective prompts for any AI tool",
      "Evaluate AI output for accuracy and bias",
      "Use AI to 10x your daily productivity",
      "Make informed decisions about AI tools for your work",
    ],
    modules: [
      {
        title: "How AI Actually Works",
        topics: ["What AI is (and isn't)", "Machine learning in plain English", "Types of AI: chatbots, image generators, agents", "Why AI sometimes gets it wrong"],
        duration: "1 week",
        project: "AI Myth vs. Fact quiz — test what you learned",
      },
      {
        title: "Prompt Engineering for Work",
        topics: ["The anatomy of a great prompt", "Role prompting — make AI your expert", "Chain-of-thought: breaking complex tasks down", "Iterating and refining until it's right"],
        duration: "1 week",
        project: "Build your personal prompt library for your job",
      },
      {
        title: "AI Productivity Toolkit",
        topics: ["AI for writing: emails, reports, proposals", "AI for research: summarizing, analyzing, comparing", "AI for data: spreadsheets, dashboards, charts", "AI for creativity: presentations, images, brainstorming"],
        duration: "1 week",
        project: "Automate one real task from your actual work using AI",
      },
      {
        title: "AI Ethics & Critical Thinking",
        topics: ["Spotting hallucinations and misinformation", "Understanding bias in AI outputs", "Privacy and data security with AI tools", "When NOT to use AI — judgment calls"],
        duration: "1 week",
        project: "AI audit — evaluate an AI tool your workplace uses",
      },
    ],
    tools: ["ChatGPT / Claude", "Microsoft Copilot", "Google Gemini", "Perplexity"],
    certification: "ThriveUp AI Foundations Certificate",
    careerPaths: ["AI-Enhanced Professional", "Digital Literacy Instructor", "AI Productivity Coach"],
  },
  {
    id: "data-analytics",
    title: "Data & Analytics",
    subtitle: "Turn Data Into Decisions",
    icon: BarChart3,
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-indigo-600",
    difficulty: "beginner",
    duration: "6 weeks",
    description: "Learn to work with data confidently — from spreadsheets to dashboards. No coding yet. This track builds the data literacy every modern worker needs.",
    whoIsItFor: [
      "Non-technical workers who deal with data",
      "Small business owners making data-driven decisions",
      "Community organizations tracking outcomes",
      "Anyone preparing for a data analyst role",
    ],
    outcomes: [
      "Clean, organize, and analyze data in spreadsheets",
      "Write basic SQL queries to pull data from databases",
      "Build visual dashboards that tell a story",
      "Use AI tools to accelerate data analysis",
      "Present data findings to non-technical audiences",
    ],
    modules: [
      {
        title: "Data Literacy Essentials",
        topics: ["What is data and why it matters", "Types of data: structured, unstructured, qualitative, quantitative", "Reading charts, graphs, and tables critically", "Common data traps and misleading statistics"],
        duration: "1 week",
      },
      {
        title: "Spreadsheet Mastery",
        topics: ["Formulas and functions (VLOOKUP, IF, SUMIF)", "Pivot tables and data summarization", "Data cleaning techniques", "Charts and conditional formatting"],
        duration: "2 weeks",
        project: "Build a budget tracker or program outcomes dashboard",
      },
      {
        title: "SQL & Databases",
        topics: ["What databases are and how they work", "SELECT, WHERE, JOIN — the essential queries", "Aggregation: GROUP BY, COUNT, AVG, SUM", "Filtering and sorting real-world datasets"],
        duration: "2 weeks",
        project: "Query a community health dataset to find insights",
      },
      {
        title: "Data Visualization & Storytelling",
        topics: ["Choosing the right chart type", "Dashboard design principles", "Using AI to generate visualizations", "Presenting findings to stakeholders"],
        duration: "1 week",
        project: "Create a stakeholder-ready dashboard from real data",
      },
    ],
    tools: ["Google Sheets / Excel", "SQL (PostgreSQL)", "Google Looker Studio", "AI data assistants"],
    certification: "ThriveUp Data Analytics Certificate",
    careerPaths: ["Data Analyst", "Business Analyst", "Program Evaluator", "Operations Analyst"],
  },
  {
    id: "python-coding",
    title: "Python & Coding",
    subtitle: "Code Your Way Forward",
    icon: Code2,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 to-orange-600",
    difficulty: "beginner",
    duration: "8 weeks",
    description: "Learn Python — the most in-demand programming language. Start from zero, build real projects, and use AI as your coding assistant. By the end, you'll build tools, not just use them.",
    whoIsItFor: [
      "Complete beginners who want to learn to code",
      "Data workers ready to go beyond spreadsheets",
      "Career changers targeting tech roles",
      "Anyone wanting to automate repetitive work",
    ],
    outcomes: [
      "Write Python programs from scratch",
      "Work with data using Pandas and NumPy",
      "Build simple automation scripts",
      "Use APIs to connect services together",
      "Use AI coding assistants effectively (Replit, Cursor, Copilot)",
    ],
    modules: [
      {
        title: "Python Fundamentals",
        topics: ["Variables, data types, operators", "If/else logic and loops", "Functions — writing reusable code", "Lists, dictionaries, and working with collections"],
        duration: "2 weeks",
        project: "Build a command-line to-do list app",
      },
      {
        title: "Working with Data",
        topics: ["Reading files: CSV, JSON, Excel", "Pandas: filtering, grouping, summarizing", "NumPy: arrays and numerical computing", "Data cleaning and transformation"],
        duration: "2 weeks",
        project: "Analyze a real community dataset and generate a report",
      },
      {
        title: "APIs & Web Services",
        topics: ["What APIs are and why they matter", "Making HTTP requests with Python", "Parsing JSON responses", "Building simple web scrapers"],
        duration: "2 weeks",
        project: "Build a tool that pulls data from a public API",
      },
      {
        title: "Automation & AI-Assisted Coding",
        topics: ["Automating file operations and reports", "Scheduling tasks with Python", "Using AI coding assistants (Replit Agent, Cursor, GitHub Copilot)", "The 'Foundation First' principle — learn before you automate"],
        duration: "2 weeks",
        project: "Build an automation that saves your team 5+ hours per week",
      },
    ],
    tools: ["Python 3", "Replit", "Pandas / NumPy", "VS Code / Cursor", "GitHub"],
    certification: "ThriveUp Python Developer Certificate",
    careerPaths: ["Junior Developer", "Automation Engineer", "Data Engineer (entry)", "QA Automation"],
  },
  {
    id: "genai-llm",
    title: "Generative AI & LLMs",
    subtitle: "Build With the Future",
    icon: Bot,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500 to-purple-600",
    difficulty: "intermediate",
    duration: "8 weeks",
    description: "Go beyond using AI — understand how Large Language Models work, build AI-powered applications, create agents, and implement RAG systems. This is where makers live.",
    whoIsItFor: [
      "Developers wanting to build AI applications",
      "Technical professionals adding AI to their toolkit",
      "Entrepreneurs building AI-powered products",
      "IT professionals implementing AI solutions",
    ],
    outcomes: [
      "Understand how LLMs work under the hood",
      "Build applications using OpenAI, Anthropic, and open-source models",
      "Create AI agents that take actions autonomously",
      "Implement RAG (Retrieval-Augmented Generation) systems",
      "Deploy AI applications to production",
    ],
    modules: [
      {
        title: "How LLMs Work",
        topics: ["Transformers architecture (simplified)", "Tokenization, embeddings, and attention", "Training, fine-tuning, and inference", "Open-source vs. closed-source models"],
        duration: "1.5 weeks",
      },
      {
        title: "Building AI Applications",
        topics: ["OpenAI & Anthropic APIs", "Structured outputs and function calling", "Streaming responses and error handling", "Cost optimization and rate limiting"],
        duration: "2 weeks",
        project: "Build a custom AI assistant for a specific domain",
      },
      {
        title: "AI Agents & Agentic Frameworks",
        topics: ["What are AI agents and why they matter", "LangChain and LangGraph fundamentals", "CrewAI — multi-agent orchestration", "Tool use, planning, and memory"],
        duration: "2.5 weeks",
        project: "Build a multi-step AI agent that researches and reports",
      },
      {
        title: "RAG & Knowledge Systems",
        topics: ["Vector databases and embeddings", "Document chunking strategies", "Retrieval-Augmented Generation patterns", "Evaluation and quality metrics"],
        duration: "2 weeks",
        project: "Build a RAG system over your organization's documents",
      },
    ],
    tools: ["Python", "OpenAI API", "Anthropic API", "LangChain / LangGraph", "ChromaDB / Pinecone", "Hugging Face"],
    certification: "ThriveUp Generative AI Builder Certificate",
    careerPaths: ["AI Engineer", "ML Engineer", "AI Solutions Architect", "AI Product Manager"],
  },
  {
    id: "ai-business-leaders",
    title: "AI for Business Leaders",
    subtitle: "Lead the AI Transformation",
    icon: Briefcase,
    color: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500 to-pink-600",
    difficulty: "intermediate",
    duration: "4 weeks",
    description: "For executives, managers, and organizational leaders. Understand AI strategy without the technical jargon. Make confident decisions about AI adoption, risk, and ROI.",
    whoIsItFor: [
      "Executives and C-suite leaders",
      "Department managers and team leads",
      "Nonprofit directors and program managers",
      "Entrepreneurs evaluating AI for their business",
    ],
    outcomes: [
      "Develop an AI adoption strategy for your organization",
      "Evaluate AI vendors and solutions confidently",
      "Manage AI risks — bias, privacy, security",
      "Build business cases with realistic AI ROI projections",
      "Lead teams through AI-driven change",
    ],
    modules: [
      {
        title: "AI Strategy & Landscape",
        topics: ["The current AI landscape — what's real, what's hype", "Identifying high-impact AI opportunities", "Build vs. buy vs. partner decisions", "Competitive advantage through AI"],
        duration: "1 week",
      },
      {
        title: "AI Adoption & Change Management",
        topics: ["Organizational readiness assessment", "Managing workforce concerns about AI", "Training and upskilling strategies", "Phased rollout frameworks"],
        duration: "1 week",
        project: "Create your organization's AI adoption roadmap",
      },
      {
        title: "AI Risk & Governance",
        topics: ["Bias detection and mitigation", "Data privacy and compliance (HIPAA, FERPA)", "AI security considerations", "Building an AI ethics framework"],
        duration: "1 week",
      },
      {
        title: "AI ROI & Business Cases",
        topics: ["Measuring AI impact — metrics that matter", "Cost modeling for AI implementations", "Presenting AI business cases to stakeholders", "Sustainable AI — beyond the pilot"],
        duration: "1 week",
        project: "Build and present a real AI business case",
      },
    ],
    tools: ["AI assessment frameworks", "ROI calculators", "Vendor evaluation templates", "Risk matrices"],
    certification: "ThriveUp AI Leadership Certificate",
    careerPaths: ["Chief AI Officer", "Digital Transformation Lead", "AI Strategy Consultant", "Innovation Director"],
  },
  {
    id: "ai-consulting",
    title: "AI Consulting & Freelancing",
    subtitle: "Launch Your AI Practice",
    icon: Rocket,
    color: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-500 to-red-600",
    difficulty: "advanced",
    duration: "6 weeks",
    description: "Turn your AI skills into income. Learn to package AI expertise, find clients, deliver projects, and build a sustainable consulting practice or freelance business.",
    whoIsItFor: [
      "AI practitioners ready to go independent",
      "Consultants adding AI to their service offerings",
      "Freelancers looking to specialize in AI",
      "Entrepreneurs building AI service businesses",
    ],
    outcomes: [
      "Package your AI skills into sellable services",
      "Find and win AI consulting clients",
      "Scope, price, and deliver AI projects",
      "Build repeatable AI implementation frameworks",
      "Scale from solo consultant to small practice",
    ],
    modules: [
      {
        title: "Packaging Your AI Expertise",
        topics: ["Identifying your AI niche and ideal client", "Building a service menu (audits, implementations, training)", "Creating case studies and proof of work", "Pricing strategies — value-based vs. hourly"],
        duration: "1.5 weeks",
      },
      {
        title: "Finding & Winning Clients",
        topics: ["Outreach strategies that work", "LinkedIn and content marketing for AI consultants", "Proposal writing and discovery calls", "Building referral networks"],
        duration: "1.5 weeks",
        project: "Create your consulting website and first 3 proposals",
      },
      {
        title: "Delivering AI Projects",
        topics: ["AI project scoping and milestones", "Managing client expectations", "Rapid prototyping and proof-of-concept delivery", "Documentation and knowledge transfer"],
        duration: "1.5 weeks",
        project: "Complete a real AI implementation for a practice client",
      },
      {
        title: "Scaling Your Practice",
        topics: ["Productizing your services", "Building a team and subcontracting", "Retainer models and recurring revenue", "From freelancer to agency — growth frameworks"],
        duration: "1.5 weeks",
        project: "Create your 12-month business plan",
      },
    ],
    tools: ["Proposal templates", "SOW generators", "Project management tools", "Client CRM"],
    certification: "ThriveUp AI Consultant Certificate",
    careerPaths: ["AI Consultant", "AI Implementation Specialist", "AI Training Provider", "AI Agency Founder"],
  },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  beginner: { label: "Beginner", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  intermediate: { label: "Intermediate", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
  advanced: { label: "Advanced", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
  expert: { label: "Expert", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

const LEARNING_PATHS = [
  {
    name: "Career Starter",
    description: "New to tech? Start here. Go from zero to employable.",
    tracks: ["ai-foundations", "data-analytics", "python-coding"],
    duration: "18 weeks",
    icon: GraduationCap,
  },
  {
    name: "AI Builder",
    description: "Already code? Build AI applications and agents.",
    tracks: ["ai-foundations", "genai-llm"],
    duration: "12 weeks",
    icon: Cpu,
  },
  {
    name: "Business Leader",
    description: "Lead AI adoption in your organization.",
    tracks: ["ai-foundations", "ai-business-leaders"],
    duration: "8 weeks",
    icon: Briefcase,
  },
  {
    name: "AI Entrepreneur",
    description: "Build an AI consulting or freelance business.",
    tracks: ["ai-foundations", "genai-llm", "ai-consulting"],
    duration: "18 weeks",
    icon: Rocket,
  },
];

function TrackCard({ track, onSelect }: { track: Track; onSelect: () => void }) {
  const Icon = track.icon;
  const diff = DIFFICULTY_CONFIG[track.difficulty];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={onSelect} data-testid={`card-track-${track.id}`}>
      <div className={`h-2 bg-gradient-to-r ${track.gradient}`} />
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${track.gradient} shrink-0`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-lg">{track.title}</h3>
              <Badge className={`text-xs ${diff.bg} ${diff.color}`}>{diff.label}</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{track.subtitle}</p>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{track.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {track.duration}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {track.modules.length} modules</span>
              <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Certificate</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function TrackDetail({ track, onBack }: { track: Track; onBack: () => void }) {
  const Icon = track.icon;
  const diff = DIFFICULTY_CONFIG[track.difficulty];

  return (
    <div className="space-y-6" data-testid={`detail-track-${track.id}`}>
      <Button variant="ghost" onClick={onBack} className="mb-2" data-testid="button-back-tracks">
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> All Tracks
      </Button>

      <div className={`rounded-2xl bg-gradient-to-r ${track.gradient} p-8 text-white`}>
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <Badge className="bg-white/20 text-white border-white/30 mb-2">{diff.label}</Badge>
            <h2 className="text-3xl font-bold mb-1">{track.title}</h2>
            <p className="text-lg opacity-90 mb-4">{track.subtitle}</p>
            <div className="flex flex-wrap gap-4 text-sm opacity-80">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {track.duration}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {track.modules.length} modules</span>
              <span className="flex items-center gap-1"><Award className="h-4 w-4" /> {track.certification}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-lg text-muted-foreground">{track.description}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5" data-testid="card-who-for">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Who Is This For</h3>
          <ul className="space-y-2">
            {track.whoIsItFor.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5" data-testid="card-outcomes">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> What You'll Be Able To Do</h3>
          <ul className="space-y-2">
            {track.outcomes.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Curriculum</h3>
        <div className="space-y-4">
          {track.modules.map((mod, i) => (
            <Card key={i} className="overflow-hidden" data-testid={`card-module-${i}`}>
              <div className="flex items-stretch">
                <div className={`w-16 flex items-center justify-center bg-gradient-to-b ${track.gradient} text-white font-bold text-lg shrink-0`}>
                  {i + 1}
                </div>
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{mod.title}</h4>
                    <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" /> {mod.duration}</Badge>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-1.5 mb-3">
                    {mod.topics.map((topic, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                  {mod.project && (
                    <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 mt-2">
                      <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-primary">Hands-On Project</span>
                        <p className="text-sm">{mod.project}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="p-5" data-testid="card-tools">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Tools You'll Use</h3>
          <div className="flex flex-wrap gap-2">
            {track.tools.map((tool, i) => (
              <Badge key={i} variant="outline" className="text-sm">{tool}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-careers">
          <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Career Paths</h3>
          <div className="flex flex-wrap gap-2">
            {track.careerPaths.map((path, i) => (
              <Badge key={i} className="bg-primary/10 text-primary text-sm">{path}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className={`p-6 bg-gradient-to-r ${track.gradient} text-white`} data-testid="card-certification">
        <div className="flex items-center gap-4">
          <Award className="h-10 w-10 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">{track.certification}</h3>
            <p className="text-sm opacity-90">Complete all {track.modules.length} modules and hands-on projects to earn your certificate. Verified and shareable on LinkedIn.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AIWorkforcePage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tracks");

  const selectedTrackData = TRACKS.find(t => t.id === selectedTrack);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="page-ai-workforce">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white py-16 px-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Badge className="mb-4 bg-indigo-500/20 text-indigo-200 border-indigo-400/30" data-testid="badge-workforce-header">
            <GraduationCap className="h-3 w-3 mr-1" />
            Adult Professional Track &middot; Workforce Development
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-workforce-title">
            AI Workforce Academy
          </h1>
          <p className="text-xl text-indigo-200 max-w-3xl mb-2">
            Easy to start. Deep to master. Built for the real world.
          </p>
          <p className="text-lg text-indigo-300 max-w-3xl">
            6 professional tracks from AI basics to building agents and launching your AI practice.
            No fluff — every module connects to the next, every project uses real skills.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedTrack(null); }}>
          <TabsList data-testid="tabs-workforce">
            <TabsTrigger value="tracks" data-testid="tab-tracks">All Tracks</TabsTrigger>
            <TabsTrigger value="paths" data-testid="tab-paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="approach" data-testid="tab-approach">Our Approach</TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6 space-y-6">
            {selectedTrackData ? (
              <TrackDetail track={selectedTrackData} onBack={() => setSelectedTrack(null)} />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-stats">
                  {[
                    { label: "Professional Tracks", value: "6", icon: Layers },
                    { label: "Total Modules", value: `${TRACKS.reduce((s, t) => s + t.modules.length, 0)}`, icon: BookOpen },
                    { label: "Hands-On Projects", value: `${TRACKS.reduce((s, t) => s + t.modules.filter(m => m.project).length, 0)}+`, icon: Wrench },
                    { label: "Certificates", value: "6", icon: Award },
                  ].map((stat, i) => (
                    <Card key={i} className="p-4 text-center">
                      <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  {TRACKS.map((track) => (
                    <TrackCard key={track.id} track={track} onSelect={() => setSelectedTrack(track.id)} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="paths" className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Recommended Learning Paths</h2>
              <p className="text-muted-foreground mb-6">Not sure where to start? Pick the path that matches your goal. Each path combines tracks in the right order.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {LEARNING_PATHS.map((path, i) => {
                const pathTracks = path.tracks.map(id => TRACKS.find(t => t.id === id)!);
                return (
                  <Card key={i} className="overflow-hidden" data-testid={`card-path-${i}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <path.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{path.name}</CardTitle>
                          <CardDescription>{path.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Clock className="h-4 w-4" /> {path.duration} total
                      </div>
                      {pathTracks.map((track, j) => {
                        const Icon = track.icon;
                        return (
                          <div key={track.id} className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${track.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {j + 1}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{track.title}</span>
                              <span className="text-xs text-muted-foreground ml-2">({track.duration})</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setActiveTab("tracks"); setSelectedTrack(track.id); }} data-testid={`button-view-${track.id}`}>
                              View
                            </Button>
                          </div>
                        );
                      })}
                      {pathTracks.length > 1 && (
                        <div className="flex items-center gap-1 pt-2">
                          {pathTracks.map((track, j) => (
                            <div key={j} className="flex items-center">
                              <div className={`h-2 flex-1 rounded-full bg-gradient-to-r ${track.gradient}`} style={{ width: "60px" }} />
                              {j < pathTracks.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="approach" className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">How We Teach Differently</h2>
              <p className="text-muted-foreground mb-6">We're not another bootcamp. We built this for real people with real jobs who need real skills — fast.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Easy Entry, Deep Mastery",
                  description: "Every track starts accessible — no prerequisites, no jargon. But mastery tracks go deep into real engineering. You choose how far to go.",
                  icon: Layers,
                },
                {
                  title: "Everything Connects",
                  description: "Tracks aren't silos. Your Python skills feed into your GenAI work. Your data skills inform your business cases. Every skill amplifies the others.",
                  icon: Share2,
                },
                {
                  title: "Build Real Things",
                  description: "Every module has a hands-on project using real data, real tools, and real scenarios. Your portfolio grows as you learn.",
                  icon: Wrench,
                },
                {
                  title: "AI-Assisted Learning",
                  description: "We practice what we teach. AI tutors help you when you're stuck. But you build the foundation first — that's non-negotiable.",
                  icon: Bot,
                },
                {
                  title: "Workforce-Ready Outcomes",
                  description: "Every track maps to real job titles and real career paths. We don't teach theory for theory's sake.",
                  icon: Briefcase,
                },
                {
                  title: "Community-Centered",
                  description: "Learn alongside peers from Austin, Manor, and Pflugerville. Cohort-based when possible, self-paced when needed.",
                  icon: Users,
                },
              ].map((item, i) => (
                <Card key={i} className="p-5" data-testid={`card-approach-${i}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800" data-testid="card-foundation-first">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                The Foundation First Principle
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                We believe in learning the fundamentals before automating them. When you understand how code works, you can use AI coding tools 10x more effectively.
                When you understand how data works, AI analytics tools become superpowers instead of black boxes.
              </p>
              <p className="text-sm text-muted-foreground">
                This principle runs through every track: learn the concept, practice it manually, then accelerate with AI. That's how you build skills that last.
              </p>
            </Card>

            <Card className="p-6" data-testid="card-proficiency">
              <h3 className="font-bold text-lg mb-4">Proficiency Levels</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We meet you where you are. Every track starts with a self-assessment so you skip what you already know.
              </p>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { level: "No Experience", desc: "Never touched this topic. Complete beginner.", color: "bg-emerald-500" },
                  { level: "Beginner", desc: "Know the basics but need guided practice.", color: "bg-blue-500" },
                  { level: "Intermediate", desc: "Can do the work but want to go deeper.", color: "bg-amber-500" },
                  { level: "Advanced", desc: "Strong skills — ready for mastery projects.", color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`h-3 rounded-full ${item.color} mb-2`} />
                    <h4 className="font-semibold text-sm">{item.level}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-5 text-center" data-testid="stat-grant-alignment">
                <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">WIOA</div>
                <div className="text-xs text-muted-foreground">Grant Aligned</div>
              </Card>
              <Card className="p-5 text-center">
                <MapPinIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">3 Hubs</div>
                <div className="text-xs text-muted-foreground">Austin, Manor, Pflugerville</div>
              </Card>
              <Card className="p-5 text-center">
                <Monitor className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">Hybrid</div>
                <div className="text-xs text-muted-foreground">In-Person + Online</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
