import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Building2, ExternalLink, Target, Shield, Award, Briefcase,
  CheckCircle2, ArrowRight, MapPin, Search, Users, Globe,
  FileText, BookOpen, Zap, DollarSign, Rocket, TrendingUp,
  GraduationCap, Scale, Star, ChevronDown, ChevronUp, HelpCircle,
  Landmark, Handshake,
} from "lucide-react";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia","Puerto Rico","Guam","U.S. Virgin Islands",
];

const apexServices = [
  {
    title: "Government Contracting Readiness",
    desc: "Assessment of your business's readiness to pursue federal, state, and local government contracts. APEX counselors evaluate capabilities, capacity, and compliance requirements.",
    icon: Target,
    tags: ["Free", "1-on-1 Counseling"],
  },
  {
    title: "SAM.gov & Contract Registration",
    desc: "Step-by-step guidance through SAM.gov registration, CAGE code assignment, UEI verification, and NAICS code selection — all required before you can bid on government contracts.",
    icon: FileText,
    tags: ["Free", "Registration Support"],
  },
  {
    title: "Bid & Proposal Assistance",
    desc: "Help understanding solicitations, developing competitive proposals, pricing strategies, and past performance documentation. APEX counselors review proposals before submission.",
    icon: BookOpen,
    tags: ["Free", "Proposal Review"],
  },
  {
    title: "Certification Navigation",
    desc: "Guidance on small business certifications — 8(a), HUBZone, WOSB, SDVOSB, VOSB — and how to leverage set-aside contracts reserved for certified businesses.",
    icon: Award,
    tags: ["Free", "Set-Asides"],
  },
  {
    title: "Contract Opportunity Matching",
    desc: "Proactive identification of contract opportunities matching your capabilities, NAICS codes, and certifications. Includes GSA Schedule and BPA guidance.",
    icon: Search,
    tags: ["Free", "Opportunity Alerts"],
  },
  {
    title: "Subcontracting & Teaming",
    desc: "Connection with prime contractors seeking small business subcontractors. Assistance with teaming arrangements, mentor-protégé programs, and joint ventures.",
    icon: Users,
    tags: ["Free", "Networking"],
  },
  {
    title: "Post-Award Contract Support",
    desc: "Help with contract administration, compliance requirements, invoicing, DCAA audit preparation, and performance reporting after you've won a contract.",
    icon: Briefcase,
    tags: ["Free", "Compliance"],
  },
  {
    title: "Training & Workshops",
    desc: "Free training sessions on government contracting topics including cybersecurity (CMMC), cost accounting, quality management, and supply chain requirements.",
    icon: GraduationCap,
    tags: ["Free", "Events"],
  },
];

const ecosystemBridges = [
  {
    from: "ThriveUp Academy",
    through: "APEX Accelerators",
    to: "Government Contracts",
    detail: "A ThriveUp graduate completes workforce training → gets certified through MCE → APEX counselor helps them bid on their first government contract",
    icon: Rocket,
  },
  {
    from: "MCE Certification Wizard",
    through: "APEX Accelerators",
    to: "Set-Aside Wins",
    detail: "MCE identifies eligible certifications (8(a), HUBZone, SDVOSB) → APEX counselor navigates the application → certified business accesses set-aside contracts",
    icon: Award,
  },
  {
    from: "MCE Contract Finder",
    through: "APEX Accelerators",
    to: "Winning Proposals",
    detail: "MCE's SAM.gov integration surfaces opportunities → business develops proposal with MCE's dual-AI review → APEX counselor provides final proposal review before submission",
    icon: FileText,
  },
  {
    from: "MCE Teaming Hub",
    through: "APEX Accelerators",
    to: "Joint Ventures",
    detail: "MCE connects complementary businesses → APEX counselor structures the teaming arrangement → team pursues larger contracts neither could win alone",
    icon: Handshake,
  },
];

const faqItems = [
  {
    q: "What are APEX Accelerators?",
    a: "APEX Accelerators (formerly Procurement Technical Assistance Centers / PTACs) are a nationwide network of centers funded by the Department of Defense to help businesses win government contracts. There are 90+ centers across all 50 states, DC, and U.S. territories providing free counseling and training.",
  },
  {
    q: "How much does it cost?",
    a: "APEX Accelerator services are free or very low cost. They are funded by the DoD and matching funds from state/local governments. There is no cost for 1-on-1 counseling, opportunity matching, or proposal review.",
  },
  {
    q: "Who is eligible?",
    a: "Any business interested in selling products or services to federal, state, or local government agencies. This includes small businesses, minority-owned businesses, veteran-owned businesses, and businesses of any size. You don't need any certifications to get started.",
  },
  {
    q: "How does APEX connect to ThriveUp and MCE?",
    a: "ThriveUp Academy trains individuals and develops their workforce skills. MCE helps them form and certify their businesses. APEX Accelerators then bridge them into government contracting — helping navigate registrations, find opportunities, develop proposals, and win contracts. It's the final stage of our Cradle-to-Contract Pipeline.",
  },
  {
    q: "What's the difference between APEX and SAM.gov?",
    a: "SAM.gov is the federal database where contracts are posted and businesses register. APEX Accelerators are the people who help you navigate SAM.gov, understand solicitations, and develop winning proposals. Think of SAM.gov as the marketplace and APEX as your expert guide.",
  },
  {
    q: "Can APEX help with state and local contracts too?",
    a: "Yes. While APEX is DoD-funded, counselors assist with all levels of government contracting — federal, state, county, city, and tribal. Many centers also help with commercial opportunities.",
  },
];

export default function ApexAcceleratorsPage() {
  const [selectedState, setSelectedState] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const apexFinderUrl = "https://www.apexaccelerators.us/#/find-an-apex";

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-14 px-4 sm:py-20 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 bg-white/15 text-white border-white/20 text-sm" data-testid="badge-apex-header">
                <Landmark className="mr-1 h-3 w-3" /> Department of Defense Program
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight" data-testid="text-apex-title">
                APEX Accelerators
              </h1>
              <p className="text-sm text-white/60 mb-2">Formerly Procurement Technical Assistance Centers (PTACs)</p>
              <p className="text-base sm:text-lg text-white/80 max-w-xl mb-6" data-testid="text-apex-subtitle">
                Free expert guidance to help your business win government contracts — the final bridge in the Cradle-to-Contract Pipeline.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a href="https://www.apexaccelerators.us/#/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-blue-700 font-semibold min-h-[44px]" data-testid="button-apex-visit">
                    Visit APEX Accelerators <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="https://www.apexaccelerators.us/#/find-an-apex" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/10 min-h-[44px]" data-testid="button-apex-find">
                    <MapPin className="mr-2 h-5 w-5" /> Find Your Local Center
                  </Button>
                </a>
              </div>
            </div>
            <div className="shrink-0 hidden lg:block">
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white w-72">
                <p className="text-sm font-semibold mb-3">Quick Facts</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-white/70">Network</span><span className="font-medium">90+ Centers</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Coverage</span><span className="font-medium">All 50 States + DC</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Cost</span><span className="font-medium text-green-400">Free</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Funded By</span><span className="font-medium">Dept. of Defense</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Formerly</span><span className="font-medium">PTACs</span></div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between"><span className="text-white/70">Clients Served</span><span className="font-medium">~64,000/yr</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Awards Won</span><span className="font-medium">$39B+ annually</span></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 sm:py-14 sm:px-6 bg-card" data-testid="section-apex-finder">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-apex-finder-heading">
              <MapPin className="inline h-5 w-5 mr-2 text-primary" />
              Find Your APEX Accelerator
            </h2>
            <p className="text-sm text-muted-foreground">Select your state to find your nearest APEX center — then connect with a counselor for free.</p>
          </div>
          <Card className="p-6 max-w-lg mx-auto">
            <div className="flex gap-3">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="flex-1" data-testid="select-apex-state">
                  <SelectValue placeholder="Select your state..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <a href={apexFinderUrl} target="_blank" rel="noopener noreferrer">
                <Button className="min-h-[44px]" disabled={!selectedState} data-testid="button-apex-search">
                  <Search className="mr-2 h-4 w-4" /> Find Center
                </Button>
              </a>
            </div>
            {selectedState && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm font-medium mb-1">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 text-primary" />
                  APEX Accelerators in {selectedState}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Click "Find Center" to open the official APEX locator. Search for "{selectedState}" to see your nearest centers, addresses, and counselor contact info.
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Tip:</span> All APEX services are free. Call your local center to schedule a 1-on-1 consultation.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-apex-services">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Star className="mr-1 h-3 w-3" /> All Services Free
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-apex-services-heading">
              What APEX Accelerators Do For You
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Expert counselors guide you through every step of government contracting — from registration to winning your first contract and beyond.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {apexServices.map((s) => (
              <Card key={s.title} className="p-5 flex flex-col" data-testid={`card-apex-service-${s.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="rounded-md bg-primary/10 p-2 w-fit mb-3">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-apex-pipeline">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Rocket className="mr-1 h-3 w-3" /> Ecosystem Integration
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-apex-pipeline-heading">
              How APEX Fits the Cradle-to-Contract Pipeline
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              APEX Accelerators are the critical bridge between business formation and government contract wins. Here's how each platform connects.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm mb-10">
            {[
              { label: "ThriveUp Academy", color: "default" as const },
              { label: "Train & Certify", color: "secondary" as const },
              { label: "MCE", color: "default" as const },
              { label: "Form Business", color: "secondary" as const },
              { label: "APEX Accelerator", color: "default" as const },
              { label: "Win Contracts", color: "secondary" as const },
              { label: "Scale & Grow", color: "outline" as const },
            ].map((step, i) => (
              <span key={step.label} className="flex items-center gap-2">
                <Badge variant={step.color} className="text-xs">{step.label}</Badge>
                {i < 6 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ecosystemBridges.map((b, i) => (
              <Card key={i} className="p-5" data-testid={`card-apex-bridge-${i}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Badge variant="outline" className="text-xs">{b.from}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge className="text-xs">{b.through}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">{b.to}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-apex-journey">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-apex-journey-heading">
              Your Government Contracting Journey
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              From first contact to winning contracts — here's the typical path with APEX Accelerator support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: 1, title: "Get Ready",
                tasks: ["Register on SAM.gov", "Get UEI number", "Select NAICS codes", "Complete capability statement"],
                platform: "MCE helps with SAM.gov registration and NAICS selection",
              },
              {
                step: 2, title: "Get Certified",
                tasks: ["Evaluate certification eligibility", "Apply for 8(a), HUBZone, SDVOSB, WOSB", "Document social disadvantage", "Build past performance"],
                platform: "MCE's Certification Wizard identifies eligible programs",
              },
              {
                step: 3, title: "Find Opportunities",
                tasks: ["Set up SAM.gov saved searches", "Review contract forecasts", "Attend industry days", "Connect with prime contractors"],
                platform: "MCE's Contract Finder surfaces live SAM.gov opportunities",
              },
              {
                step: 4, title: "Win Contracts",
                tasks: ["Develop competitive proposals", "Price to win", "Submit on time", "Debrief on losses"],
                platform: "MCE's Dual-AI Review strengthens proposals before submission",
              },
            ].map((phase) => (
              <Card key={phase.step} className="p-5" data-testid={`card-apex-journey-step-${phase.step}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-full bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
                    {phase.step}
                  </div>
                  <h3 className="font-semibold text-sm">{phase.title}</h3>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {phase.tasks.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-2" />
                <p className="text-xs text-primary/80 italic">{phase.platform}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-apex-faq">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-apex-faq-heading">
              <HelpCircle className="inline h-6 w-6 mr-2 text-primary" />
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <Card key={i} className="overflow-hidden" data-testid={`card-apex-faq-${i}`}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  data-testid={`button-apex-faq-toggle-${i}`}
                >
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4">
                    <Separator className="mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-apex-cta">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-blue-600 to-indigo-700 border-none text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-apex-cta-heading">
              Ready to Win Government Contracts?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-6 text-sm sm:text-base">
              Start with a free APEX Accelerator consultation. Pair it with ThriveUp's workforce training and MCE's business tools for the complete Cradle-to-Contract experience.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://www.apexaccelerators.us/#/find-an-apex" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-blue-700 font-semibold min-h-[44px]" data-testid="button-apex-cta-find">
                  <MapPin className="mr-2 h-5 w-5" /> Find Your APEX Center
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="https://www.apexaccelerators.us/#/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/10 min-h-[44px]" data-testid="button-apex-cta-site">
                  Visit apexaccelerators.us <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/business-plan">
                <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 min-h-[44px]" data-testid="button-apex-cta-plan">
                  View Full Business Plan
                </Button>
              </Link>
            </div>
          </Card>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/grants">
              <Card className="p-4 hover-elevate cursor-pointer text-center" data-testid="card-apex-related-grants">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">Grant Discovery</p>
                <p className="text-xs text-muted-foreground">Find federal funding</p>
              </Card>
            </Link>
            <Link href="/ecosystem-story">
              <Card className="p-4 hover-elevate cursor-pointer text-center" data-testid="card-apex-related-ecosystem">
                <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">Ecosystem Story</p>
                <p className="text-xs text-muted-foreground">See the full pipeline</p>
              </Card>
            </Link>
            <Link href="/business-plan">
              <Card className="p-4 hover-elevate cursor-pointer text-center" data-testid="card-apex-related-plan">
                <Briefcase className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">Business Plan</p>
                <p className="text-xs text-muted-foreground">Complete overview</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
