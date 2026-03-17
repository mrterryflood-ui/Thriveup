import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  GraduationCap, Shield, Award, Briefcase, BookOpen, Mail,
  Star, Globe, Heart, Users, FlaskConical, Building2, Medal,
  Target, Sparkles, Microscope, BarChart3,
} from "lucide-react";
import { MISSION_STATEMENT, VISION_STATEMENT, VALUES } from "@/lib/mvv-content";

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
  { title: "Army CR2I GS-12 at III Corps", note: "" },
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
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-about-title">About & Leadership</h1>
        <p className="text-muted-foreground">Meet the team behind ThriveUp Academy and the Collaborative Advocate ecosystem.</p>
      </div>

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
          <div className="flex flex-col items-center gap-3 shrink-0">
            <Avatar className="h-28 w-28">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">TF</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-lg" data-testid="text-leader-name">Dr. Terry Flood, DHA</p>
              <p className="text-sm text-muted-foreground">Implementation Scientist | Veteran | Platform Architect</p>
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

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">MS</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <p className="font-bold text-lg" data-testid="text-cofounder-name">Meredith Sisnett</p>
              <p className="text-sm text-muted-foreground">Co-Founder</p>
            </div>
            <p className="text-sm">
              Co-Founder of the Collaborative Advocate ecosystem, bringing expertise in organizational development,
              community engagement, and strategic partnerships to complement the technical and research-driven approach.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md p-2 bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold" data-testid="text-entity-foundation">Collaborative Advocate Foundation</p>
              <Badge variant="secondary">501(c)(3)</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Nonprofit entity focused on community development, youth empowerment,
            prevention programming, and evidence-based intervention delivery.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md p-2 bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold" data-testid="text-entity-llc">Collaborative Advocate LLC</p>
              <Badge variant="secondary">VOSB</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Veteran-Owned Small Business providing technology development, consulting,
            and implementation science services to federal, state, and local partners.
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Contact</p>
              <a href="mailto:mr.terryflood@gmail.com" className="text-sm text-primary hover:underline" data-testid="link-email">
                mr.terryflood@gmail.com
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
