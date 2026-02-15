import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, Eye, Database, MapPin, Heart, Users,
  Globe, Clock, Scale, Mail,
} from "lucide-react";

const sections = [
  { id: "commitment", title: "Our Commitment to Student Privacy", icon: Lock },
  { id: "collection", title: "What Information We Collect", icon: Eye },
  { id: "usage", title: "How We Use Student Data", icon: Database },
  { id: "gis", title: "GIS & Context Data (IGN-Thrive System)", icon: MapPin },
  { id: "wellbeing", title: "Self-Assessment & Wellbeing Data", icon: Heart },
  { id: "access", title: "Who Can Access Student Data", icon: Users },
  { id: "security", title: "Data Security", icon: Shield },
  { id: "third-party", title: "Third-Party Services", icon: Globe },
  { id: "retention", title: "Data Retention & Deletion", icon: Clock },
  { id: "rights", title: "Your Rights", icon: Scale },
  { id: "contact", title: "Contact Information", icon: Mail },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" data-testid="page-privacy-policy">
      <div className="text-center space-y-3 mb-8">
        <div className="flex justify-center">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-privacy-title">
          Privacy & Data Protection Policy
        </h1>
        <p className="text-muted-foreground" data-testid="text-privacy-subtitle">
          Texas Empowerment Academy - Learning Academy Platform
        </p>
        <p className="text-sm text-muted-foreground" data-testid="text-privacy-updated">
          Last Updated: February 2026
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary" data-testid="badge-ferpa">FERPA Compliant</Badge>
          <Badge variant="secondary" data-testid="badge-coppa">COPPA Compliant</Badge>
        </div>
      </div>

      <Card data-testid="card-table-of-contents">
        <CardHeader>
          <CardTitle className="text-lg">Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-muted-foreground hover:underline"
                  data-testid={`link-toc-${s.id}`}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section id="commitment">
        <SectionCard num={1} icon={Lock} title="Our Commitment to Student Privacy">
          <p>
            The Texas Empowerment Academy Learning Academy is built with student privacy as a foundational principle. We comply with <Badge variant="outline">FERPA</Badge> (Family Educational Rights and Privacy Act), <Badge variant="outline">COPPA</Badge> (Children's Online Privacy Protection Act), and state privacy regulations.
          </p>
          <p className="mt-3">
            This platform serves students in grades 3-12 and we take our responsibility to protect young learners seriously.
          </p>
        </SectionCard>
      </section>

      <section id="collection">
        <SectionCard num={2} icon={Eye} title="What Information We Collect">
          <p className="mb-3">We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Student profile information (name, grade level, school)</li>
            <li>Academic progress and assessment scores</li>
            <li>Self-assessment check-in data (energy, focus, mood — when voluntarily submitted with consent)</li>
            <li>Career interest selections</li>
            <li>Avatar customization preferences</li>
            <li>Platform usage data (pages visited, features used)</li>
          </ul>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-not-collected">
              We do NOT collect: home addresses, social security numbers, financial information from students, biometric data, or private communications
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="usage">
        <SectionCard num={3} icon={Database} title="How We Use Student Data">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Personalize learning pathways and content recommendations</li>
            <li>Track academic progress and milestone achievements</li>
            <li>Power the IGN-Thrive wellness scoring system (only with opt-in consent)</li>
            <li>Generate aggregate analytics for administrators and teachers</li>
            <li>Identify students who may need additional support through the Early Warning System</li>
          </ul>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-never-sold">
              Student data is NEVER sold, shared with advertisers, or used for marketing purposes
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="gis">
        <SectionCard num={4} icon={MapPin} title="GIS & Context Data (IGN-Thrive System)">
          <p>
            The IGN-Thrive system uses publicly available community-level data (CDC PLACES health data, Social Vulnerability Index, FBI crime statistics) to understand the broader context of student environments.
          </p>
          <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/10">
            <p className="text-sm font-semibold" data-testid="text-no-addresses">
              IMPORTANT: We never store individual student addresses. Context data is aggregated at the census tract or ZIP code level using publicly available government datasets.
            </p>
          </div>
          <p className="mt-3">
            This data helps educators allocate resources equitably — it is never used to label, judge, or profile individual students.
          </p>
        </SectionCard>
      </section>

      <section id="wellbeing">
        <SectionCard num={5} icon={Heart} title="Self-Assessment & Wellbeing Data">
          <ul className="space-y-3 text-sm">
            <li>Student self-assessments (daily check-ins measuring energy, stress, focus, belonging, confidence, mood) are entirely voluntary.</li>
            <li>Students must provide explicit consent before submitting any wellbeing data.</li>
            <li>When a student indicates they need support, designated adults (parents, teachers, counselors) are notified promptly.</li>
            <li>Wellbeing data is stored securely and only accessible to authorized school personnel.</li>
          </ul>
        </SectionCard>
      </section>

      <section id="access">
        <SectionCard num={6} icon={Users} title="Who Can Access Student Data">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Students</p>
              <p className="text-muted-foreground">Their own data, progress, and assessments</p>
            </div>
            <div>
              <p className="font-semibold">Parents/Guardians</p>
              <p className="text-muted-foreground">Their child's data, progress, support alerts</p>
            </div>
            <div>
              <p className="font-semibold">Teachers</p>
              <p className="text-muted-foreground">Students in their classrooms, academic data, and flagged concerns</p>
            </div>
            <div>
              <p className="font-semibold">Administrators</p>
              <p className="text-muted-foreground">Aggregate analytics, early warning flags, intervention tracking</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm" data-testid="text-role-based">
              Role-based access controls ensure each user only sees data appropriate to their role.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="security">
        <SectionCard num={7} icon={Shield} title="Data Security">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>All data transmitted via HTTPS encryption</li>
            <li>Database hosted on secure, managed infrastructure (PostgreSQL with Neon)</li>
            <li>Session management with secure authentication (OIDC via Replit Auth)</li>
            <li>Regular security reviews and access audits</li>
          </ul>
          <p className="mt-3 text-sm font-medium">
            We follow industry best practices for data protection
          </p>
        </SectionCard>
      </section>

      <section id="third-party">
        <SectionCard num={8} icon={Globe} title="Third-Party Services">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">OpenAI (GPT-4o-mini)</p>
              <p className="text-muted-foreground">Powers the Spark AI learning companion — student conversations are not stored by OpenAI for training purposes</p>
            </div>
            <div>
              <p className="font-semibold">Minority Center of Excellence</p>
              <p className="text-muted-foreground">External directory links only — no student data is shared</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium">
            We carefully evaluate all third-party services for privacy compliance before integration
          </p>
        </SectionCard>
      </section>

      <section id="retention">
        <SectionCard num={9} icon={Clock} title="Data Retention & Deletion">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Academic records retained per FERPA guidelines and district policy</li>
            <li>Self-assessment data can be deleted upon parent request</li>
            <li>Avatar and preference data can be reset at any time</li>
          </ul>
          <p className="mt-3 text-sm font-medium" data-testid="text-data-deletion">
            Parents may request complete data export or deletion by contacting the school administration
          </p>
        </SectionCard>
      </section>

      <section id="rights">
        <SectionCard num={10} icon={Scale} title="Your Rights">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Right to access your child's data</li>
            <li>Right to request corrections to inaccurate information</li>
            <li>Right to opt out of voluntary data collection (self-assessments, wellbeing check-ins)</li>
            <li>Right to request data deletion (subject to legal retention requirements)</li>
            <li>Right to file a complaint with the school district</li>
          </ul>
        </SectionCard>
      </section>

      <section id="contact">
        <SectionCard num={11} icon={Mail} title="Contact Information">
          <p className="text-sm">For privacy questions or data requests, please contact:</p>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-semibold" data-testid="text-contact-office">Texas Empowerment Academy - Data Privacy Office</p>
            <p className="text-muted-foreground" data-testid="text-contact-email">Email: privacy@txea.edu</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This policy is reviewed and updated annually.
          </p>
        </SectionCard>
      </section>
    </div>
  );
}

function SectionCard({ num, icon: Icon, title, children }: { num: number; icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <Card data-testid={`card-section-${num}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <span>{num}. {title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}
