import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Brain, Sparkles, Target, CheckCircle2, ArrowRight, Users,
  BarChart3, Shield, Zap, Building2, Globe, Layers, Rocket,
  BookOpen, Award, TrendingUp, Briefcase, GraduationCap,
  Heart, Scale, MessageCircle, DollarSign,
} from "lucide-react";

const servicePackages = [
  {
    name: "AI Strategy Assessment",
    tier: "Foundation",
    duration: "2–4 weeks",
    gradient: "from-blue-600 to-indigo-700",
    icon: Target,
    description: "Comprehensive assessment of your organization's AI readiness, identifying opportunities, gaps, and a prioritized roadmap for implementation.",
    deliverables: [
      "Current-state technology audit",
      "AI readiness scorecard",
      "Opportunity mapping across departments",
      "Vendor-neutral provider recommendations",
      "12-month implementation roadmap",
      "Executive presentation deck",
    ],
    idealFor: "Organizations exploring AI but unsure where to start",
  },
  {
    name: "AI Implementation Sprint",
    tier: "Growth",
    duration: "6–12 weeks",
    gradient: "from-emerald-600 to-teal-700",
    icon: Rocket,
    description: "Hands-on implementation of AI systems tailored to your organization — from multi-provider architecture to RAG knowledge bases to automated workflows.",
    deliverables: [
      "Multi-provider AI architecture (no vendor lock-in)",
      "Custom RAG knowledge base with your organizational data",
      "Automated fallback chains for zero-downtime AI",
      "Integration with existing systems",
      "Staff training and documentation",
      "30-day post-launch support",
    ],
    idealFor: "Organizations ready to move from strategy to execution",
  },
  {
    name: "AI Center of Excellence",
    tier: "Enterprise",
    duration: "3–6 months",
    gradient: "from-violet-600 to-purple-700",
    icon: Award,
    description: "Full AI Center of Excellence buildout — governance frameworks, quality gates, continuous improvement systems, and organizational transformation.",
    deliverables: [
      "Complete AI governance framework",
      "RPLICE quality gate implementation",
      "MAP-GAP continuous improvement system",
      "Multi-provider collaborative AI architecture",
      "Cross-platform data orchestration",
      "Staff upskilling program (40+ hours)",
      "Quarterly review and optimization",
      "Executive dashboard with live metrics",
    ],
    idealFor: "Organizations building AI as a core competency",
  },
  {
    name: "Community & Nonprofit AI Accelerator",
    tier: "Mission-Driven",
    duration: "4–8 weeks",
    gradient: "from-amber-600 to-orange-700",
    icon: Heart,
    description: "AI implementation designed specifically for nonprofits, community organizations, and government agencies — with built-in compliance reporting and outcome measurement.",
    deliverables: [
      "Tailored AI implementation plan",
      "Outcome measurement automation",
      "Compliance reporting dashboard",
      "Community-facing AI tools",
      "Bilingual support (EN/ES)",
      "Funder presentation materials",
    ],
    idealFor: "Nonprofits and community orgs serving under-resourced populations",
  },
];

const whyUs = [
  {
    icon: CheckCircle2,
    title: "We Ship, Not Sell",
    description: "While Microsoft publishes guidelines and Databricks sells tutorials, we've built and operate a 20-platform AI ecosystem. Our consulting comes from doing, not theorizing.",
  },
  {
    icon: Layers,
    title: "Vendor-Neutral Architecture",
    description: "We implement 4-provider AI architectures (Gemini, Claude, OpenAI, and more) with automatic failover. No vendor lock-in. If one provider goes down, your AI keeps running.",
  },
  {
    icon: Shield,
    title: "Governance Built In",
    description: "Our RPLICE quality gates and MAP-GAP continuous improvement frameworks ensure your AI is accurate, accountable, and always improving. Not just fast — trustworthy.",
  },
  {
    icon: BarChart3,
    title: "Evidence by Architecture",
    description: "Every AI system we build generates compliance evidence automatically. Outcome measurement, reporting dashboards, and audit trails built into the foundation.",
  },
  {
    icon: Users,
    title: "Community-Proven",
    description: "Our AI systems serve 170,000+ residents across three regional hubs. Real communities, real outcomes, real accountability. Not lab experiments.",
  },
  {
    icon: Brain,
    title: "Collaborative AI Philosophy",
    description: "We don't rely on a single AI model. Multiple AI providers bring different perspectives so nothing is missed. Dual-AI review. Ensemble consensus. Better decisions.",
  },
];

const caseStudyHighlights = [
  {
    metric: "20",
    label: "Platforms Governed",
    detail: "Live heartbeat monitoring, directive enforcement, fidelity grading",
  },
  {
    metric: "301",
    label: "API Endpoints",
    detail: "100% error-handled, production-deployed",
  },
  {
    metric: "75",
    label: "RAG Knowledge Chunks",
    detail: "Static + live intelligence powering Ecosystem AI",
  },
  {
    metric: "4",
    label: "AI Providers",
    detail: "Zero-downtime collaborative architecture",
  },
  {
    metric: "170K+",
    label: "Residents Served",
    detail: "Across 3 regional hubs in Central Texas",
  },
];

const industries = [
  { name: "Healthcare & Health Equity", icon: Heart, examples: "FHIR integration, clinical decision support, health screening AI, CHW tools" },
  { name: "Education & Workforce", icon: GraduationCap, examples: "Adaptive learning, curriculum AI, career pathway engines, credentialing" },
  { name: "Government & Public Sector", icon: Building2, examples: "Grant management, compliance automation, constituent services, case management" },
  { name: "Nonprofits & Foundations", icon: Globe, examples: "Impact measurement, program evaluation, donor reporting, coalition management" },
  { name: "Veteran Services", icon: Shield, examples: "Transition support, benefits navigation, peer mentoring, suicide prevention" },
  { name: "Small Business & MWBE", icon: Briefcase, examples: "Proposal generation, certification navigation, contract intelligence, SAM.gov integration" },
];

const processSteps = [
  { step: 1, title: "Discovery", description: "We audit your current state — technology, processes, people, goals. No assumptions.", icon: Target },
  { step: 2, title: "Architecture", description: "We design a multi-provider AI system tailored to your needs, budget, and timeline.", icon: Layers },
  { step: 3, title: "Implementation", description: "We build and deploy. Not slides — working systems with real data and real users.", icon: Rocket },
  { step: 4, title: "Governance", description: "We install quality gates, monitoring, and continuous improvement frameworks.", icon: Shield },
  { step: 5, title: "Training", description: "Your team learns to operate, maintain, and evolve the AI systems independently.", icon: BookOpen },
  { step: 6, title: "Optimization", description: "Ongoing support, quarterly reviews, and MAP-GAP improvement cycles.", icon: TrendingUp },
];

export default function AIConsultingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="page-ai-consulting">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white py-20 px-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Badge className="mb-4 bg-indigo-500/20 text-indigo-200 border-indigo-400/30 hover:bg-indigo-500/30" data-testid="badge-consulting-header">
            <Sparkles className="h-3 w-3 mr-1" />
            The Collaborative Advocate — AI Consulting Division
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-consulting-title">
            AI Consulting Services
          </h1>
          <p className="text-xl text-indigo-200 max-w-3xl mb-3">
            Organizations are investing heavily in AI. But they struggle with strategy, implementation, and transformation.
          </p>
          <p className="text-lg text-indigo-300 max-w-3xl mb-8">
            We don't sell blueprints — we've built and operate a 20-platform AI ecosystem. Our consulting comes from implementation, not theory.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-100" data-testid="button-consulting-contact">
                <MessageCircle className="h-4 w-4 mr-2" />
                Schedule a Consultation
              </Button>
            </Link>
            <Link href="/business-plan">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="button-consulting-business-plan">
                <BookOpen className="h-4 w-4 mr-2" />
                View Our Ecosystem
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <section data-testid="section-proof-points">
          <h2 className="text-2xl font-bold text-center mb-2">Our Track Record Speaks</h2>
          <p className="text-center text-muted-foreground mb-8">Not projections. Not proposals. Live production numbers from systems we built and operate.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {caseStudyHighlights.map((item, i) => (
              <Card key={i} className="p-4 text-center hover:shadow-lg transition-shadow" data-testid={`card-metric-${i}`}>
                <div className="text-3xl font-bold text-primary">{item.metric}</div>
                <div className="text-sm font-semibold mt-1">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-why-us">
          <h2 className="text-2xl font-bold text-center mb-2">Why Choose Us</h2>
          <p className="text-center text-muted-foreground mb-8">The difference between AI consultants who present slides and those who ship systems.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-why-us-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-services">
          <h2 className="text-2xl font-bold text-center mb-2">Service Packages</h2>
          <p className="text-center text-muted-foreground mb-8">From initial assessment to full AI Center of Excellence — we meet you where you are.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {servicePackages.map((pkg, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-service-${pkg.tier.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                <div className={`bg-gradient-to-r ${pkg.gradient} text-white p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-white/20 text-white border-white/30">{pkg.tier}</Badge>
                    <pkg.icon className="h-8 w-8 opacity-80" />
                  </div>
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <div className="mt-2">
                    <span className="text-sm opacity-80">{pkg.duration}</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                  <h4 className="font-semibold text-sm mb-2">Deliverables:</h4>
                  <ul className="space-y-1.5 mb-4">
                    {pkg.deliverables.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Ideal for:</span> {pkg.idealFor}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-process">
          <h2 className="text-2xl font-bold text-center mb-2">Our Process</h2>
          <p className="text-center text-muted-foreground mb-8">Six disciplined phases. No shortcuts. No handwaving.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-process-step-${step.step}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-industries">
          <h2 className="text-2xl font-bold text-center mb-2">Industries We Serve</h2>
          <p className="text-center text-muted-foreground mb-8">Deep domain expertise across the sectors that matter most.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((ind, i) => (
              <Card key={i} className="p-5 hover:shadow-lg transition-shadow" data-testid={`card-industry-${i}`}>
                <div className="flex items-center gap-3 mb-2">
                  <ind.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">{ind.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{ind.examples}</p>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-enterprise-comparison">
          <h2 className="text-2xl font-bold text-center mb-2">Blueprint Sellers vs. Implementation Leaders</h2>
          <p className="text-center text-muted-foreground mb-8">What the biggest tech companies sell as theory, we deliver as reality.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { company: "Microsoft Azure", sells: "AI Center of Excellence guidelines (e-book)", weDeliver: "A live AI CoE with 4 providers, collaborative intelligence, RAG, and governance" },
              { company: "Databricks", sells: "Compact Guide to RAG (tutorial)", weDeliver: "Production RAG with 75 knowledge chunks, live intelligence, and real-time ecosystem data" },
              { company: "dbt Labs", sells: "Why AI needs governed data (O'Reilly report)", weDeliver: "193 governed database tables, 20 platform fidelity grading, directive enforcement" },
              { company: "Red Hat", sells: "Operationalizing LLMs on Kubernetes (book)", weDeliver: "301 production API endpoints, zero-downtime AI, 4-provider failover, live users" },
            ].map((comp, i) => (
              <Card key={i} className="p-5 hover:shadow-lg transition-shadow" data-testid={`card-comparison-${i}`}>
                <h3 className="font-semibold mb-3">{comp.company}</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">They sell</Badge>
                    <p className="text-sm text-muted-foreground">{comp.sells}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="text-xs flex-shrink-0 mt-0.5 bg-green-600">We deliver</Badge>
                    <p className="text-sm">{comp.weDeliver}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-cta">
          <Card className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Move from AI Hype to AI Habit?</h2>
            <p className="text-lg text-indigo-200 mb-6 max-w-2xl mx-auto">
              Organizations that implement AI well don't just talk about it — they build systems that generate evidence by architecture, not narrative. Let's build yours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-100" data-testid="button-cta-contact">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Schedule a Consultation
                </Button>
              </Link>
              <Link href="/ecosystem-story">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="button-cta-ecosystem">
                  <Globe className="h-4 w-4 mr-2" />
                  See the Full Ecosystem Story
                </Button>
              </Link>
            </div>
            <p className="text-sm text-indigo-300 mt-6">
              Operated by The Collaborative Advocate — VOSB | Implementation Science | Community AI
            </p>
          </Card>
        </section>

        <div className="text-center text-sm text-muted-foreground pb-8" data-testid="text-consulting-footer">
          <p>The Collaborative Advocate is a Veteran-Owned Small Business (VOSB) and the umbrella organization for the ThriveUp ecosystem.</p>
          <p className="mt-1">AI consulting services are led by Dr. Terry Flood, DHA — veteran, educator, architect of the 20-platform Autonomous Community Operating System.</p>
        </div>
      </div>
    </div>
  );
}
