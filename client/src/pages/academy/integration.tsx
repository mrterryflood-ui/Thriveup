import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Link2,
  ExternalLink,
  ArrowRightLeft,
  Shield,
  Copy,
  CheckCircle,
  Server,
  Database,
  GraduationCap,
} from "lucide-react";

const SUPPORT_PORTAL_URL = "https://thrivingcommunitiesforall.com/support";

const apiEndpoints = [
  { method: "GET", path: "/api/external/health", description: "Health check & endpoint listing" },
  { method: "GET", path: "/api/external/students/overview", description: "All students with progress & Panther Power" },
  { method: "GET", path: "/api/external/students/:userId/thrive", description: "Individual Thrive scores & early warnings" },
  { method: "GET", path: "/api/external/students/:userId/assessments", description: "Self-assessment history" },
  { method: "GET", path: "/api/external/attendance/summary", description: "Attendance patterns" },
  { method: "GET", path: "/api/external/early-warnings", description: "All active early warning flags" },
  { method: "GET", path: "/api/external/reflections/recent", description: "Recent journal entries & mood alerts" },
  { method: "POST", path: "/api/external/interventions/receive", description: "Receive intervention data from Support Portal" },
  { method: "GET", path: "/api/external/students/:userId/pathway", description: "Longitudinal career pathway (grades 6-12+)" },
  { method: "GET", path: "/api/external/pathways/overview", description: "All pathways with grade distribution & graduation tracking" },
];

const academyToPortal = [
  "Thrive scores",
  "Early warning flags",
  "Attendance",
  "Panther Power",
  "Self-assessments",
  "Journal mood alerts",
  "Career pathways (6-12+)",
  "Grade progression",
  "Graduation tracking",
];

const portalToAcademy = [
  "Interventions",
  "SEL scores",
  "Risk levels",
];

export default function AcademyIntegrationPage() {
  useEffect(() => { document.title = 'Integration Portal | ThriveUp Academy'; }, []);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const isAdmin = !!(user as any)?.isAdmin;
  const isConnected = !!SUPPORT_PORTAL_URL;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-[#800000] text-white py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Integration</h1>
            <p className="text-white/80 mt-1">Connect the Academy with the Student Support Portal — Grades 6-12+</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium" data-testid="text-admin-only">This page is for administrators only.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your administrator for access.</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleCopyHealthUrl = async () => {
    const url = `${window.location.origin}/api/external/health`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Copied!", description: "Health endpoint URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy URL to clipboard.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <PageHeader
          title="Support Portal"
          description="Connect the Academy with the Student Support Portal — Grades 6-12+"
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Support Portal" },
          ]}
        />
      </div>
      <div className="bg-[#800000] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Integration</h1>
          <p className="text-white/80 mt-1">Connect the Academy with the Student Support Portal — Grades 6-12+</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card className="p-6" data-testid="card-connection-status">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-connection-title">Connection Status</h3>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Badge variant="default" className="bg-green-600" data-testid="badge-status-connected">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-status-disconnected">
                  Not Connected
                </Badge>
              )}
              <span className="text-sm text-muted-foreground" data-testid="text-portal-url">
                {SUPPORT_PORTAL_URL || "No portal URL configured"}
              </span>
            </div>
            {isConnected && (
              <Button
                variant="outline"
                onClick={() => window.open(SUPPORT_PORTAL_URL, "_blank")}
                data-testid="button-open-portal-status"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Portal
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6" data-testid="card-api-endpoints">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-endpoints-title">API Endpoints</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-endpoints-description">
            Available external API endpoints that the Support Portal can call
          </p>
          <div className="space-y-2">
            {apiEndpoints.map((endpoint, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                data-testid={`row-endpoint-${i}`}
              >
                <Badge
                  variant={endpoint.method === "POST" ? "destructive" : "secondary"}
                  className="font-mono text-xs shrink-0"
                  data-testid={`badge-method-${i}`}
                >
                  {endpoint.method}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-mono break-all" data-testid={`text-endpoint-path-${i}`}>
                    {endpoint.path}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-endpoint-desc-${i}`}>
                    {endpoint.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" data-testid="card-data-sync">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-sync-title">Data Sync Overview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-[#800000]" />
                <h4 className="font-medium text-sm" data-testid="text-outgoing-title">Academy → Support Portal</h4>
              </div>
              <div className="space-y-2">
                {academyToPortal.map((item, i) => (
                  <div key={i} className="flex items-center gap-2" data-testid={`row-outgoing-${i}`}>
                    <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                    <span className="text-sm" data-testid={`text-outgoing-item-${i}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-[#800000]" />
                <h4 className="font-medium text-sm" data-testid="text-incoming-title">Support Portal → Academy</h4>
              </div>
              <div className="space-y-2">
                {portalToAcademy.map((item, i) => (
                  <div key={i} className="flex items-center gap-2" data-testid={`row-incoming-${i}`}>
                    <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                    <span className="text-sm" data-testid={`text-incoming-item-${i}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-longitudinal-tracking">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-longitudinal-title">Longitudinal Tracking (Grades 6-12+)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-longitudinal-description">
            Track students continuously from 6th grade through high school graduation. Career pathways, milestones, and education plans persist across grade levels for a complete developmental picture.
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="secondary" className="bg-[#800000]/10 text-[#800000]" data-testid="badge-middle-school">Middle School (6-8)</Badge>
            <Badge variant="secondary" className="bg-[#800000]/10 text-[#800000]" data-testid="badge-high-school">High School (9-12)</Badge>
          </div>
          <div className="space-y-2">
            {[
              { label: "Career pathway progress", testId: "text-tracked-career-pathway" },
              { label: "Education path type", testId: "text-tracked-education-path" },
              { label: "Milestone completion", testId: "text-tracked-milestone" },
              { label: "Grade-level transitions", testId: "text-tracked-grade-transitions" },
              { label: "Graduation readiness", testId: "text-tracked-graduation-readiness" },
            ].map((item) => (
              <div key={item.testId} className="flex items-center gap-2" data-testid={item.testId}>
                <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" data-testid="card-quick-actions">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-actions-title">Quick Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-[#800000]"
              onClick={() => window.open(SUPPORT_PORTAL_URL, "_blank")}
              data-testid="button-open-portal"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Support Portal
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyHealthUrl}
              data-testid="button-copy-health-url"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Health Endpoint URL"}
            </Button>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-integration-guide">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-guide-title">Integration Guide</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div data-testid="text-guide-step-1">
              <h4 className="font-medium mb-1">1. Configure the Support Portal</h4>
              <p className="text-muted-foreground">
                In the Support Portal settings, set the Academy API Base URL to your Academy's origin
                (e.g., <code className="bg-muted px-1 rounded">{window.location.origin}</code>).
              </p>
            </div>
            <div data-testid="text-guide-step-2">
              <h4 className="font-medium mb-1">2. Verify the Connection</h4>
              <p className="text-muted-foreground">
                Call the health endpoint at <code className="bg-muted px-1 rounded">/api/external/health</code> to
                confirm the Academy API is reachable and see all available endpoints.
              </p>
            </div>
            <div data-testid="text-guide-step-3">
              <h4 className="font-medium mb-1">3. Fetch Student Data</h4>
              <p className="text-muted-foreground">
                Use the student overview and individual endpoints to pull Thrive scores, early warnings,
                attendance, Panther Power data, self-assessments, and journal mood alerts into the Support Portal.
              </p>
            </div>
            <div data-testid="text-guide-step-4">
              <h4 className="font-medium mb-1">4. Send Interventions Back</h4>
              <p className="text-muted-foreground">
                Use the <code className="bg-muted px-1 rounded">POST /api/external/interventions/receive</code> endpoint
                to push intervention data, SEL scores, and risk levels from the Support Portal back to the Academy.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
