import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Shield, ArrowRight, CheckCircle2, BarChart3, FileText,
  Users, Lock, Globe, Briefcase, Heart, Target, Building2
} from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Target,
    title: "Individualized Reentry Plans",
    desc: "Phase-based plans (Pre-Release through Independence) with automated milestone tracking tied to evidence-based outcomes.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Progress Monitoring",
    desc: "Thrive analytics track six domains of wellbeing with configurable alert thresholds and early warning systems.",
  },
  {
    icon: FileText,
    title: "Court-Ready Reporting",
    desc: "Timestamped, exportable progress reports with milestone completion evidence suitable for court and probation review.",
  },
  {
    icon: Lock,
    title: "Secure API Integration",
    desc: "RESTful API endpoints for bidirectional data exchange. Receive referrals, send progress updates, track supervision compliance.",
  },
  {
    icon: Users,
    title: "Community Partner Network",
    desc: "Coordinated referral workflows with verified community partners. MOU tracking, service completion rates, and impact measurement.",
  },
  {
    icon: Shield,
    title: "DOJ-Aligned Outcome Tracking",
    desc: "Recidivism monitoring at 6/12/36 months, employment retention, education enrollment, housing stability, and behavioral health outcomes.",
  },
];

const INTEGRATION_ENDPOINTS = [
  { method: "POST", path: "/api/external/justice/referrals", desc: "Submit youth referral with demographics, release date, and supervision requirements" },
  { method: "GET", path: "/api/external/justice/referrals/:id/progress", desc: "Retrieve real-time progress including milestones, compliance, and plan status" },
  { method: "GET", path: "/api/external/justice/referrals/:id/report", desc: "Generate court-ready progress report with timestamped evidence" },
  { method: "GET", path: "/api/external/justice/health", desc: "Check API health status and available endpoints" },
];

const CAPABILITIES = [
  "Five-level AI mastery curriculum for digital literacy",
  "50+ school-to-career pipelines with structured progression",
  "Professional mentorship matching and coaching",
  "10 AI-powered creation tools for portfolio building",
  "Financial literacy education and entrepreneurship training",
  "Community resource finder covering all 50 states",
  "Bilingual support (English/Spanish)",
  "Wraparound support with multi-agency coordination",
];

export default function JusticePartnersPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-4">
          <Shield className="mr-1 h-3 w-3" /> For Juvenile Justice Partners
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-justice-title">
          Community-Based Reentry Ecosystem
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          ThriveUp Academy provides a comprehensive, evidence-based platform for youth reentry, workforce development, and whole-child support -- designed to integrate with juvenile justice agency workflows.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VALUE_PROPS.map(prop => (
          <Card key={prop.title} className="p-5" data-testid={`card-value-${prop.title.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                <prop.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{prop.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{prop.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6" data-testid="card-integration-api">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="font-semibold text-xl">Justice System Integration API</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Secure, API-key authenticated endpoints for juvenile justice agencies to submit referrals and receive real-time progress updates.
        </p>
        <div className="space-y-3">
          {INTEGRATION_ENDPOINTS.map(ep => (
            <div key={ep.path} className="flex items-start gap-3 p-3 rounded-lg border">
              <Badge variant={ep.method === "POST" ? "default" : "secondary"} className="shrink-0 mt-0.5">{ep.method}</Badge>
              <div>
                <code className="text-sm font-mono text-primary">{ep.path}</code>
                <p className="text-sm text-muted-foreground mt-0.5">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-platform-capabilities">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="font-semibold text-xl">Platform Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAPABILITIES.map(cap => (
            <div key={cap} className="flex items-start gap-2 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-sm">{cap}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none" data-testid="card-grant-alignment">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Grant-Aligned for OJJDP Second Chance Act</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6">
            Our platform is purpose-built to support OJJDP FY25 Second Chance Act Youth Reentry Program requirements, including structured reentry plans, evidence-based programming, community partnerships, and federal reporting compliance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/reentry">
              <Button size="lg" className="bg-white text-violet-700 min-h-[44px]" data-testid="button-view-reentry" aria-label="View reentry dashboard">
                <Shield className="mr-2 h-5 w-5" /> View Reentry Dashboard
              </Button>
            </Link>
            <Link href="/outcomes">
              <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/15 min-h-[44px]" data-testid="button-view-outcomes" aria-label="View outcome reporting">
                <BarChart3 className="mr-2 h-5 w-5" /> Outcome Reporting
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="text-center py-4">
        <p className="text-muted-foreground">
          For integration inquiries, contact:{" "}
          <span className="font-medium text-foreground">sisnett.meredith@gmail.com</span>
          {" "}&{" "}
          <span className="font-medium text-foreground">mr.terryflood@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
