import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Shield, Lock, Eye, Database, MapPin, Heart, Users,
  Globe, Clock, Scale, Mail, Baby, FileCheck, AlertTriangle,
  UserCheck, BookOpen, ArrowLeft,
} from "lucide-react";

const sections = [
  { id: "commitment", title: "Our Commitment to Student Privacy", icon: Lock },
  { id: "coppa", title: "COPPA Compliance & Youth Under 13", icon: Baby },
  { id: "parental-consent", title: "Parental & Guardian Consent", icon: UserCheck },
  { id: "collection", title: "What Information We Collect", icon: Eye },
  { id: "usage", title: "How We Use Student Data", icon: Database },
  { id: "gis", title: "GIS & Context Data (IGN-Thrive System)", icon: MapPin },
  { id: "wellbeing", title: "Self-Assessment & Wellbeing Data", icon: Heart },
  { id: "access", title: "Who Can Access Student Data", icon: Users },
  { id: "third-party", title: "Third-Party Services & Data Sharing", icon: Globe },
  { id: "security", title: "Data Security", icon: Shield },
  { id: "retention", title: "Data Retention & Deletion", icon: Clock },
  { id: "age-appropriate", title: "Age-Appropriate Design", icon: BookOpen },
  { id: "breach", title: "Data Breach Notification", icon: AlertTriangle },
  { id: "compliance", title: "Regulatory Compliance", icon: FileCheck },
  { id: "rights", title: "Your Rights", icon: Scale },
  { id: "contact", title: "Contact Information", icon: Mail },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy & Data Protection Policy | AI Mastery Academy";
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" data-testid="page-privacy-policy">
      <PageHeader
        title="Privacy Policy"
        description="Privacy & Data Protection Policy for AI Mastery Academy"
        breadcrumbs={[{label:"Privacy Policy"}]}
      />

      <div className="text-center space-y-3 mb-8">
        <div className="flex justify-center">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-privacy-title">
          Privacy & Data Protection Policy
        </h1>
        <p className="text-muted-foreground" data-testid="text-privacy-subtitle">
          AI Mastery Academy & School Support Hub
        </p>
        <p className="text-sm text-muted-foreground" data-testid="text-privacy-updated">
          Last Updated: February 2026
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary" data-testid="badge-ferpa">FERPA Compliant</Badge>
          <Badge variant="secondary" data-testid="badge-coppa">COPPA Compliant</Badge>
          <Badge variant="secondary" data-testid="badge-cipa">CIPA Compliant</Badge>
          <Badge variant="secondary" data-testid="badge-sopipa">SOPIPA Aligned</Badge>
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
          <div>
            The AI Mastery Academy & School Support Hub is built with student privacy as a foundational principle. We comply with <Badge variant="outline">FERPA</Badge> (Family Educational Rights and Privacy Act), <Badge variant="outline">COPPA</Badge> (Children's Online Privacy Protection Act), <Badge variant="outline">CIPA</Badge> (Children's Internet Protection Act), and applicable state privacy regulations.
          </div>
          <p className="mt-3">
            This platform serves youth ages 14-24 and we take our responsibility to protect learners seriously. All users under the age of 18 are considered minors and receive enhanced privacy protections as outlined in this policy.
          </p>
          <p className="mt-3">
            We adhere to the principle of data minimization: we collect only the information necessary to provide our educational services, and we never collect more data than is reasonably required.
          </p>
        </SectionCard>
      </section>

      <section id="coppa">
        <SectionCard num={2} icon={Baby} title="COPPA Compliance & Youth Under 13">
          <p className="mb-3">
            While our platform is primarily designed for youth ages 14-24, we recognize that some users may be under 13 years of age. In full compliance with the Children's Online Privacy Protection Act (COPPA), we implement the following safeguards:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Verifiable parental consent is required before collecting any personal information from children under 13</li>
            <li>Parents/guardians can review, modify, or delete their child's personal information at any time</li>
            <li>Parents/guardians can revoke consent and request deletion of their child's data</li>
            <li>We do not condition a child's participation on disclosing more information than is reasonably necessary</li>
            <li>We do not collect geolocation data from users under 13</li>
            <li>AI companion interactions for users under 13 are subject to additional content filtering and moderation</li>
            <li>No behavioral advertising or profiling is conducted on any minor's data</li>
          </ul>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-coppa-notice">
              Users under 13 cannot create accounts without verified parental or guardian consent. Schools enrolling students under 13 must obtain parental consent through their established consent processes.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="parental-consent">
        <SectionCard num={3} icon={UserCheck} title="Parental & Guardian Consent">
          <p className="mb-3">
            For all users under 18, we implement a tiered consent framework:
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">Users Under 13</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Verifiable parental consent required before account creation</li>
                <li>Consent obtained through school district enrollment processes or direct parental authorization</li>
                <li>Parents receive a detailed notice of data collection practices before consent</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Users Ages 13-17</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Parental notification is provided upon account creation</li>
                <li>Parental consent required for optional data collection (wellbeing check-ins, AI companion usage)</li>
                <li>Parents/guardians have full access to their child's data through the Parent Dashboard</li>
                <li>Students in this age group may provide limited assent for basic platform usage</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Users Ages 18-24</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Users provide their own consent upon account registration</li>
                <li>Users may designate a trusted adult or mentor for data access</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm" data-testid="text-consent-withdrawal">
              Consent can be withdrawn at any time by contacting the school administration or our Data Privacy Office. Withdrawal of consent will result in the deletion of voluntarily provided data while preserving legally required educational records.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="collection">
        <SectionCard num={4} icon={Eye} title="What Information We Collect">
          <p className="mb-3">We collect the following types of information:</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Account Information</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Student profile information (name, grade level, school)</li>
                <li>Authentication credentials (managed through secure OIDC provider)</li>
                <li>Role designation (student, teacher, parent, administrator)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Educational Data</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Academic progress and assessment scores</li>
                <li>Course enrollment and completion records</li>
                <li>Career interest selections and pathway progress</li>
                <li>Quiz and activity responses</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Voluntary Data (Opt-In Only)</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Self-assessment check-in data (energy, focus, mood)</li>
                <li>AI companion conversation logs</li>
                <li>Journal entries</li>
                <li>Avatar customization preferences</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Technical Data</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                <li>Platform usage data (pages visited, features used)</li>
                <li>Device type and browser information (for accessibility optimization)</li>
                <li>Session duration and timestamps</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-not-collected">
              We do NOT collect: home addresses, social security numbers, financial information from students, biometric data, private communications, photos or videos of students, or any data from personal devices beyond browser session data
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="usage">
        <SectionCard num={5} icon={Database} title="How We Use Student Data">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Personalize learning pathways and content recommendations</li>
            <li>Track academic progress and milestone achievements</li>
            <li>Power the IGN-Thrive wellness scoring system (only with opt-in consent)</li>
            <li>Generate aggregate analytics for administrators and teachers</li>
            <li>Identify students who may need additional support through the Early Warning System</li>
            <li>Issue digital badges, certificates, and recognition for achievements</li>
            <li>Facilitate mentorship connections through the Mentor Finder</li>
          </ul>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-never-sold">
              Student data is NEVER sold, shared with advertisers, used for marketing purposes, used for behavioral profiling, or used to build commercial products
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="gis">
        <SectionCard num={6} icon={MapPin} title="GIS & Context Data (IGN-Thrive System)">
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
        <SectionCard num={7} icon={Heart} title="Self-Assessment & Wellbeing Data">
          <ul className="space-y-3 text-sm">
            <li>Student self-assessments (daily check-ins measuring energy, stress, focus, belonging, confidence, mood) are entirely voluntary.</li>
            <li>Students must provide explicit consent before submitting any wellbeing data.</li>
            <li>For users under 18, parental consent is also required before wellbeing data collection begins.</li>
            <li>When a student indicates they need support, designated adults (parents, teachers, counselors) are notified promptly.</li>
            <li>Wellbeing data is stored securely and only accessible to authorized school personnel.</li>
            <li>Wellbeing data is never used for disciplinary purposes or included in academic transcripts.</li>
          </ul>
        </SectionCard>
      </section>

      <section id="access">
        <SectionCard num={8} icon={Users} title="Who Can Access Student Data">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Students</p>
              <p className="text-muted-foreground">Their own data, progress, and assessments</p>
            </div>
            <div>
              <p className="font-semibold">Parents/Guardians</p>
              <p className="text-muted-foreground">Their child's data, progress, support alerts, and AI companion interaction summaries</p>
            </div>
            <div>
              <p className="font-semibold">Teachers</p>
              <p className="text-muted-foreground">Students in their classrooms, academic data, and flagged concerns</p>
            </div>
            <div>
              <p className="font-semibold">School Counselors</p>
              <p className="text-muted-foreground">Wellbeing check-in data and early warning flags for students they serve</p>
            </div>
            <div>
              <p className="font-semibold">Administrators</p>
              <p className="text-muted-foreground">Aggregate analytics, early warning flags, intervention tracking (no individual wellbeing data without cause)</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm" data-testid="text-role-based">
              Role-based access controls ensure each user only sees data appropriate to their role. All data access is logged and auditable.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="third-party">
        <SectionCard num={9} icon={Globe} title="Third-Party Services & Data Sharing">
          <p className="mb-3">
            We limit third-party data sharing to what is strictly necessary for platform functionality. All third-party providers are contractually bound to protect student data.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">OpenAI (GPT-4o-mini)</p>
              <p className="text-muted-foreground">Powers the Spark AI learning companion. Student conversations are processed in real-time and are not stored by OpenAI for training purposes. We use the OpenAI API with data processing agreements that prohibit use of student data for model training.</p>
            </div>
            <div>
              <p className="font-semibold">Replit (Authentication)</p>
              <p className="text-muted-foreground">Provides secure OIDC-based authentication. Only minimal profile data (display name, profile image URL) is shared for login purposes.</p>
            </div>
            <div>
              <p className="font-semibold">Neon (Database Hosting)</p>
              <p className="text-muted-foreground">Provides managed PostgreSQL database hosting with encryption at rest. Data is stored within the United States.</p>
            </div>
            <div>
              <p className="font-semibold">Minority Center of Excellence</p>
              <p className="text-muted-foreground">External directory links only — no student data is shared</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-semibold" data-testid="text-no-third-party-selling">
              We never sell student data to third parties. We never share student data for advertising, marketing, or commercial purposes. Third-party providers are prohibited from using student data for any purpose other than providing the contracted service.
            </p>
          </div>
          <p className="mt-4 text-sm">
            We carefully evaluate all third-party services for privacy compliance before integration. Any new third-party integration undergoes a privacy impact assessment, and parents/guardians are notified of material changes.
          </p>
        </SectionCard>
      </section>

      <section id="security">
        <SectionCard num={10} icon={Shield} title="Data Security">
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>All data transmitted via HTTPS/TLS encryption</li>
            <li>Database encryption at rest on managed infrastructure (PostgreSQL with Neon)</li>
            <li>Session management with secure authentication (OIDC via Replit Auth)</li>
            <li>Role-based access controls with principle of least privilege</li>
            <li>Regular security reviews and access audits</li>
            <li>Input validation and sanitization on all user-submitted data</li>
            <li>Rate limiting on sensitive endpoints to prevent abuse</li>
            <li>Automated session expiration and secure token management</li>
          </ul>
          <p className="mt-3 text-sm font-medium">
            We follow industry best practices for data protection, including OWASP guidelines for web application security.
          </p>
        </SectionCard>
      </section>

      <section id="retention">
        <SectionCard num={11} icon={Clock} title="Data Retention & Deletion">
          <p className="mb-3">We follow a structured data retention policy to ensure data is kept only as long as necessary:</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Academic Records</p>
              <p className="text-muted-foreground">Retained per FERPA guidelines and district policy (typically for the duration of enrollment plus the legally required retention period). Transferred to the school district upon student departure.</p>
            </div>
            <div>
              <p className="font-semibold">Self-Assessment & Wellbeing Data</p>
              <p className="text-muted-foreground">Retained for the current academic year only. Automatically purged at the end of each school year unless a parent/guardian requests earlier deletion. Not included in permanent student records.</p>
            </div>
            <div>
              <p className="font-semibold">AI Companion Conversations</p>
              <p className="text-muted-foreground">Retained for 90 days for quality assurance, then automatically deleted. Parents may request immediate deletion at any time.</p>
            </div>
            <div>
              <p className="font-semibold">Journal Entries</p>
              <p className="text-muted-foreground">Retained until the student or parent/guardian requests deletion. Automatically purged upon account closure.</p>
            </div>
            <div>
              <p className="font-semibold">Avatar & Preferences</p>
              <p className="text-muted-foreground">Can be reset or deleted by the student at any time. Automatically purged upon account closure.</p>
            </div>
            <div>
              <p className="font-semibold">Technical/Usage Logs</p>
              <p className="text-muted-foreground">Retained for 30 days for troubleshooting, then automatically deleted. Logs are anonymized after 7 days.</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm font-medium" data-testid="text-data-deletion">
              Parents, guardians, or eligible students (18+) may request a complete data export (in machine-readable format) or full deletion by contacting the school administration or our Data Privacy Office. Deletion requests are processed within 30 business days.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="age-appropriate">
        <SectionCard num={12} icon={BookOpen} title="Age-Appropriate Design">
          <p className="mb-3">
            We design our platform with age-appropriate experiences in mind:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Content is curated and moderated for the target age group (14-24)</li>
            <li>AI companion responses are filtered for age-appropriate language and topics</li>
            <li>Gamification elements (marketplace, wallet, stocks simulator) use virtual currency only — no real money transactions</li>
            <li>Social features are limited to school-supervised environments</li>
            <li>Community interactions are moderated and do not include direct messaging between students</li>
            <li>Privacy settings default to the most protective options for younger users</li>
            <li>Complex privacy concepts are explained in accessible, youth-friendly language within the platform</li>
          </ul>
        </SectionCard>
      </section>

      <section id="breach">
        <SectionCard num={13} icon={AlertTriangle} title="Data Breach Notification">
          <p className="mb-3">
            In the unlikely event of a data breach affecting student information:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>We will notify affected parents/guardians and school administrators within 72 hours of discovering the breach</li>
            <li>Notification will include: the nature of the breach, types of data affected, steps taken to contain and remediate, and recommended protective actions</li>
            <li>We will cooperate fully with school district incident response procedures</li>
            <li>We will report the breach to relevant regulatory authorities as required by law</li>
            <li>A post-incident review will be conducted and findings shared with the school administration</li>
          </ul>
        </SectionCard>
      </section>

      <section id="compliance">
        <SectionCard num={14} icon={FileCheck} title="Regulatory Compliance">
          <p className="mb-3">
            This platform is designed to comply with the following federal and state regulations:
          </p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">FERPA (Family Educational Rights and Privacy Act)</p>
              <p className="text-muted-foreground">Protects the privacy of student education records. We act as a school official with legitimate educational interest.</p>
            </div>
            <div>
              <p className="font-semibold">COPPA (Children's Online Privacy Protection Act)</p>
              <p className="text-muted-foreground">Protects children under 13 from unauthorized data collection. We require verifiable parental consent for users under 13.</p>
            </div>
            <div>
              <p className="font-semibold">CIPA (Children's Internet Protection Act)</p>
              <p className="text-muted-foreground">Ensures safe internet access in schools. Our platform includes content filtering and age-appropriate safeguards.</p>
            </div>
            <div>
              <p className="font-semibold">SOPIPA (Student Online Personal Information Protection Act)</p>
              <p className="text-muted-foreground">Prohibits using student data for non-educational purposes. We align with these principles across all operations.</p>
            </div>
            <div>
              <p className="font-semibold">Texas Student Privacy Laws</p>
              <p className="text-muted-foreground">Compliant with Texas Education Code requirements for student data privacy and security.</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section id="rights">
        <SectionCard num={15} icon={Scale} title="Your Rights">
          <p className="mb-3">Parents, guardians, and eligible students (18+) have the following rights:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Right to access your child's data and receive a copy in a portable format</li>
            <li>Right to request corrections to inaccurate information</li>
            <li>Right to opt out of voluntary data collection (self-assessments, wellbeing check-ins, AI companion usage)</li>
            <li>Right to request data deletion (subject to legal retention requirements)</li>
            <li>Right to revoke consent for optional data processing at any time</li>
            <li>Right to be notified of material changes to this privacy policy</li>
            <li>Right to file a complaint with the school district or relevant regulatory body</li>
            <li>Right to restrict processing of your child's data to essential educational functions only</li>
          </ul>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm" data-testid="text-rights-exercise">
              To exercise any of these rights, contact your school administration or our Data Privacy Office. We will respond to all requests within 30 business days.
            </p>
          </div>
        </SectionCard>
      </section>

      <section id="contact">
        <SectionCard num={16} icon={Mail} title="Contact Information">
          <p className="text-sm">For privacy questions, data requests, or concerns, please contact:</p>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-semibold" data-testid="text-contact-office">AI Mastery Academy - Data Privacy Office</p>
            <p className="text-muted-foreground" data-testid="text-contact-email">Email: privacy@txea.edu</p>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <p className="font-semibold" data-testid="text-contact-dpo">Data Protection Officer</p>
            <p className="text-muted-foreground" data-testid="text-contact-dpo-email">Email: dpo@txea.edu</p>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              This policy is reviewed and updated at least annually, or whenever material changes occur. Parents and guardians will be notified of significant updates via email and platform notification. Continued use of the platform after notification constitutes acceptance of the updated policy.
            </p>
          </div>
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
