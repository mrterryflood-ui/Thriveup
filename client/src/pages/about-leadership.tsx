import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  GraduationCap, Shield, Award, Briefcase, BookOpen, Mail,
  Star, Globe, Heart, Users, FlaskConical, Building2, Medal,
  Target, Sparkles, Microscope, BarChart3, ArrowRight, Search, TrendingUp,
  Church, FileCheck, Info,
} from "lucide-react";
import { MISSION_STATEMENT, VISION_STATEMENT, VALUES } from "@/lib/mvv-content";
import terryPhoto from "@assets/Terry2_1773768611245.jpg";
import terryMilitaryPhoto from "@assets/pic1_1773768611248.jpg";
import { useEffect } from "react";

const education = [
  { degree: "DHA", field: "Doctor of Health Administration", school: "" },
  { degree: "DBA", field: "Doctor of Business Administration", school: "" },
  { degree: "MS", field: "Implementation Science", school: "Dartmouth (July 2026)" },
  { degree: "MBA", field: "Leadership", school: "" },
  { degree: "MS", field: "Human Resource Management", school: "" },
  { degree: "MS", field: "Industrial-Organizational Psychology", school: "" },
  { degree: "MS", field: "Criminal Justice (Public Policy)", school: "" },
  { degree: "BS", field: "Healthcare Management", school: "" },
  { degree: "Graduate Certificate", field: "Business & Data Analytics", school: "Texas Tech" },
];

const military = {
  branch: "U.S. Army (Retired)",
  rank: "CW2",
  mos: "131A",
  yearsOfService: "20 years",
  awards: [
    "Bronze Star Medal (x2)",
    "Meritorious Service Medal",
    "Multiple deployments (Afghanistan)",
  ],
};

const federalService = [
  { title: "VA VCL Social Science Program Specialist", note: "Current" },
  { title: "Army CR2I at III Corps", note: "" },
  { title: "VA Legal Admin Specialist", note: "" },
  { title: "VA VSR", note: "" },
];

const certifications = [
  "DoD SPARX Level 2",
  "COR Level I",
  "FEMA/NIMS/ICS",
  "Lean Six Sigma Green Belt",
  "DAU GRT-0020/0030/0040",
  "CON-0210",
  "ACQ-0800",
];

const researchFocus = [
  "Healthcare Workforce Development",
  "SDOH & Holistic Healthcare",
  "Public Health Interventions & Violence Prevention",
  "Competency-Based Education",
];

const methodologies = [
  { name: "MAP-GAP", desc: "Measure-Analyze-Plan / Gap Analysis Protocol" },
  { name: "SALP", desc: "Strategic Adaptive Leadership Protocol" },
  { name: "Three Realities Diagnostic", desc: "Multi-dimensional reality assessment framework" },
  { name: "MG-PATR", desc: "Multi-Generational Performance Assessment & Trend Reporting" },
];

export default function AboutLeadershipPage() {
  useEffect(() => {
    document.title = "About & Our Structure | The Collaborative Advocate Foundation";
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-about-title">About & Our Structure</h1>
        <p className="text-muted-foreground">Who we are, how we are organized, and the honest status of every legal and operational detail a funder needs to know.</p>
      </div>

      {/* ORG STRUCTURE — leads the page so every reviewer sees it first */}
      <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" data-testid="section-org-structure">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-org-structure-heading">Our Organizational Structure</h2>
            <p className="text-xs text-muted-foreground">Two organizations working as one. Disclosed in plain English so funders can verify every detail.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-background" data-testid="card-org-alc">
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-md bg-amber-100 dark:bg-amber-950 p-2 shrink-0">
                <Church className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold">Abundant Life Church (ALC)</p>
                <Badge variant="secondary" className="text-xs mt-1">Community-Delivery Partner</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p>Community-delivery and faith-community partner for joint programming. Provides community presence, programmatic reach, and trusted relationships within the populations TCAF serves. Not a fiscal sponsor — TCAF holds its own IRS 501(c)(3) determination and applies for awards directly.</p>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Responsibilities</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>Community-rooted program delivery on joint initiatives</li>
                  <li>Faith-community engagement and outreach</li>
                  <li>Co-design of culturally responsive programming</li>
                  <li>Host site for in-person services where appropriate</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-background" data-testid="card-org-tcaf">
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-md bg-violet-100 dark:bg-violet-950 p-2 shrink-0">
                <FlaskConical className="h-5 w-5 text-violet-700 dark:text-violet-400" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold">The Collaborative Advocate Foundation (TCAF)</p>
                <Badge variant="outline" className="text-xs mt-1 border-emerald-400 text-emerald-700 dark:text-emerald-400">501(c)(3) — IRS-Determined (Letter 947, eff. 01/14/2026)</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p>Technology partner, methodology developer, and healthcare administrative support. Operates the 24-platform Autonomous Community Operating System and the methodology catalog (RPLICE, MAP-GAP, SALP, MG-PATR) used in service delivery.</p>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Responsibilities</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>Builds and operates the technology platforms</li>
                  <li>Provides healthcare administration support</li>
                  <li>Maintains the methodology and evidence library</li>
                  <li>Operates as sub-recipient under ALC during pendency</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 mt-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800" data-testid="card-501c3-disclosure">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">501(c)(3) Status — Honest Disclosure</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">TCAF</span> is an IRS-determined 501(c)(3) under section 170(b)(1)(A)(vi) (Letter 947, effective January 14, 2026; EIN 41-3618003) and is SAM.gov Active (UEI KDDVD1FGLW35; CAGE 209N1), eligible to apply for and receive federal, state, and local awards directly.{" "}
                <span className="font-medium text-foreground">Abundant Life Church</span> remains a community-delivery and faith-community partner for joint programming where appropriate, but is not a required fiduciary for TCAF awards.
              </p>
              <p className="text-xs text-muted-foreground italic">We disclose this structure transparently because federal reviewers and foundation program officers reward applicants who name their status honestly. We will update this page within 30 days of any change in TCAF's IRS determination.</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-3 bg-muted/40" data-testid="card-leadership-summary">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">Named Leadership</p>
              <ul className="text-muted-foreground space-y-0.5">
                <li><span className="font-medium text-foreground">President, TCAF</span> — Implementation Scientist, U.S. Army Retired (CW2, 20 years), DHA · DBA · MS Implementation Science (Dartmouth, 2026). Operational lead for technology, methodology, and healthcare administration. Bio below.</li>
                <li><span className="font-medium text-foreground">Pastoral Leadership, ALC</span> — Holds the fiduciary and 501(c)(3) responsibilities. Contact via <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary hover:underline" data-testid="link-pastoral">president@thecollaborativeadvocate.org</a>.</li>
                <li><span className="font-medium text-foreground">Strategic Advisor</span> — Meredith Sisnett. Provides guidance on organizational development, community engagement, and partnership strategy.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-3 bg-muted/40" data-testid="card-geographic-scope">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">Geographic Scope — Honest</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">National platform, Texas-piloted.</span> The Collaborative Advocate Foundation is built as national community infrastructure — the operating system for how communities support, engage, and serve their people across all 50 states and 5 U.S. territories.{" "}
                <span className="font-medium text-foreground">Live pilot:</span> Travis County, Texas (Austin, Pflugerville, Manor) with active outreach across Central Texas. Travis is the implementation template; everything we build for Texas is engineered to deploy in any U.S. county via the open Hub Adoption Kit.{" "}
                <span className="font-medium text-foreground">National replicability:</span> The 24-platform ecosystem, RPLICE protocol, MAP-GAP CQI engine, and benefits screener are jurisdiction-agnostic by design — a community in Ohio, Mississippi, or Puerto Rico can stand up the same operating system without rewriting code.
              </p>
            </div>
          </div>
        </Card>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold" data-testid="text-about-mission-label">Our Mission</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-about-mission">
            {MISSION_STATEMENT}
          </p>
        </Card>
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold" data-testid="text-about-vision-label">Our Vision</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-about-vision">
            {VISION_STATEMENT}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold mb-4" data-testid="text-about-values-label">Our Values</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VALUES.map((v) => {
            const iconMap: Record<string, typeof Heart> = { Heart, Microscope, Users, Globe, Shield, BarChart3, BookOpen };
            const Icon = iconMap[v.iconName] || Heart;
            return (
              <div key={v.title} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50" data-testid={`about-value-${v.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{v.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Separator />

      <h2 className="text-xl font-bold" data-testid="text-leadership-heading">Leadership</h2>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-4 shrink-0 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-lg shadow-md">
                <img
                  src={terryMilitaryPhoto}
                  alt="President of TCAF in U.S. Army dress uniform"
                  className="w-32 h-40 object-cover object-top"
                  data-testid="img-leader-military"
                />
              </div>
              <div className="overflow-hidden rounded-lg shadow-md">
                <img
                  src={terryPhoto}
                  alt="President of TCAF"
                  className="w-32 h-40 object-cover object-top"
                  data-testid="img-leader-casual"
                />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" data-testid="text-leader-name">Dr. Terry Flood, DHA</p>
              <p className="text-sm font-semibold text-primary">President, TCAF</p>
              <p className="text-xs text-muted-foreground">Implementation Scientist · U.S. Army Retired · Platform Architect</p>
            </div>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-leader">
                <Mail className="mr-2 h-4 w-4" /> Contact
              </Button>
            </Link>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          <div className="flex-1 space-y-6">
            <Section icon={GraduationCap} title="Education">
              <div className="grid gap-2">
                {education.map((e) => (
                  <div key={e.field} className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" data-testid={`badge-degree-${e.degree.toLowerCase().replace(/\s/g, '-')}`}>{e.degree}</Badge>
                    <span className="text-sm">{e.field}</span>
                    {e.school && <span className="text-xs text-muted-foreground">({e.school})</span>}
                  </div>
                ))}
              </div>
            </Section>

            <Separator />

            <Section icon={Shield} title="Military Service">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge data-testid="badge-branch">{military.branch}</Badge>
                  <Badge variant="outline" data-testid="badge-rank">{military.rank}</Badge>
                  <Badge variant="outline" data-testid="badge-mos">MOS: {military.mos}</Badge>
                  <Badge variant="secondary" data-testid="badge-service-years">{military.yearsOfService}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {military.awards.map((a) => (
                    <div key={a} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Medal className="h-3.5 w-3.5 shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Separator />

            <Section icon={Briefcase} title="Federal Service">
              <div className="grid gap-2">
                {federalService.map((f) => (
                  <div key={f.title} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">{f.title}</span>
                    {f.note && <Badge variant="secondary" className="text-xs">{f.note}</Badge>}
                  </div>
                ))}
              </div>
            </Section>

            <Separator />

            <Section icon={Award} title="Certifications">
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <Badge key={c} variant="outline" data-testid={`badge-cert-${c.toLowerCase().replace(/[\s\/]/g, '-')}`}>{c}</Badge>
                ))}
              </div>
            </Section>

            <Separator />

            <Section icon={FlaskConical} title="Research Focus">
              <div className="grid sm:grid-cols-2 gap-2">
                {researchFocus.map((r) => (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Separator />

            <Section icon={BookOpen} title="Proprietary Methodologies">
              <div className="grid sm:grid-cols-2 gap-3">
                {methodologies.map((m) => (
                  <Card key={m.name} className="p-3">
                    <p className="font-semibold text-sm" data-testid={`text-method-${m.name.toLowerCase().replace(/\s/g, '-')}`}>{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </Card>

      <Separator />

      <h2 className="text-xl font-bold" data-testid="text-ecosystem-heading">The Ecosystem</h2>
      <p className="text-muted-foreground text-sm -mt-4">Three platforms forming an integrated cradle-to-contract pipeline.</p>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md p-2 bg-gradient-to-br from-violet-600 to-indigo-700">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" data-testid="text-entity-thriveup">ThriveUp Academy</p>
              <Badge variant="secondary" className="text-xs">501(c)(3)</Badge>
            </div>
          </div>
          <p className="text-xs font-medium text-primary mb-1">Education & Workforce</p>
          <p className="text-sm text-muted-foreground">
            Develops the people — AI education, workforce training, career pipelines, prevention programming, and community enablement tools for under-resourced communities. Grant-funded nonprofit. This is where the work gets done.
          </p>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">thrivingcommunitiesforall.com</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md p-2 bg-gradient-to-br from-emerald-600 to-teal-700">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" data-testid="text-entity-mce">Minority Center of Excellence</p>
              <Badge variant="secondary" className="text-xs">SaaS</Badge>
            </div>
          </div>
          <p className="text-xs font-medium text-primary mb-1">Business Ecosystem</p>
          <p className="text-sm text-muted-foreground">
            Develops the businesses — formation, certification, government contracting, AI tools, B2B networking, and business intelligence. 656,794 curated records. Subscription-funded for-profit SaaS.
          </p>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">For-Profit SaaS &middot; Subscription-Funded</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md p-2 bg-gradient-to-br from-amber-600 to-orange-700">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" data-testid="text-entity-ca">The Collaborative Advocate</p>
              <Badge variant="secondary" className="text-xs">Umbrella</Badge>
            </div>
          </div>
          <p className="text-xs font-medium text-primary mb-1">Advocacy & Coordination</p>
          <p className="text-sm text-muted-foreground">
            The web presence connecting it all — advocacy, coordination, community voice, and organizational information. Provides the structure and narrative while ThriveUp and MCE do the work.
          </p>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">VOSB &middot; Organization</p>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-2 bg-primary/10 shrink-0 mt-0.5">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">The Cradle-to-Contract Pipeline</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ThriveUp trains the person. MCE empowers the business they build. A veteran in ThriveUp's AI training pipeline graduates into MCE's business formation toolkit. A returning citizen in workforce development flows into certification and contracting. No competitor has this integrated ecosystem — from education through career readiness through business formation through government contracting.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-2 bg-primary/10 shrink-0 mt-0.5">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">Advisor</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Meredith Sisnett</span> — Strategic advisor to the Collaborative Advocate ecosystem, providing guidance on organizational development, community engagement, and partnership strategy.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Contact</p>
              <a href="mailto:president@thecollaborativeadvocate.org" className="text-sm text-primary hover:underline" data-testid="link-email">
                president@thecollaborativeadvocate.org
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Platform</p>
              <p className="text-sm text-muted-foreground">14-Platform Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Learn More</p>
              <Link href="/contact">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-contact-page">Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="section-explore-links">
        <h2 className="font-semibold text-lg mb-1">Explore the Platform</h2>
        <p className="text-sm text-muted-foreground mb-4">See the ecosystem the President and the team have built.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: "Ecosystem Story", desc: "See how 24 platforms work together on a real grant scenario", href: "/ecosystem-story", icon: BookOpen },
            { title: "SDOH Explorer", desc: "Live community data analysis for any U.S. region", href: "/sdoh-explorer", icon: Search },
            { title: "Case Studies", desc: "Real implementation evidence and outcome metrics", href: "/case-studies", icon: BarChart3 },
            { title: "Stakeholder Deck", desc: "Presentation materials for funders and partners", href: "/presentations", icon: Target },
            { title: "Research Hub", desc: "Implementation science and MAP-GAP methodology", href: "/research-hub", icon: Microscope },
            { title: "Outcome Reporting", desc: "Track program outcomes across all domains", href: "/outcomes", icon: TrendingUp },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid={`link-about-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="rounded-md p-2 bg-primary/10 shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof GraduationCap; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4.5 w-4.5 text-primary" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}
