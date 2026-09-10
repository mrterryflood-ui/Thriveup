import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Globe, Key, Shield, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Link } from "wouter";

const PARTNER_API_BASE_PATH = "/api/partner/v1";

type ApiEndpoint = {
  method: string;
  path: string;
  description: string;
  scope: string;
  category: string;
};

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/docs`,
    description: "Machine-readable Partner API contract",
    scope: "Public",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/health`,
    description: "Verify an active partner key and view key metadata",
    scope: "Any active partner or ecosystem key",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/community-brief`,
    description: "Generate an aggregate community brief for a location",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/students/overview`,
    description: "Aggregate student overview metrics; counts are suppression-floored",
    scope: "student:read",
    category: "Student aggregates",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/attendance/summary`,
    description: "Aggregate attendance metrics; counts are suppression-floored",
    scope: "student:read",
    category: "Student aggregates",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/early-warnings`,
    description: "Aggregate early-warning counts; counts are suppression-floored",
    scope: "student:read",
    category: "Student aggregates",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/pathways/overview`,
    description: "Aggregate pathway distribution; counts are suppression-floored",
    scope: "student:read",
    category: "Student aggregates",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/chainweb/coefficients`,
    description: "Evidence coefficients used by Chainweb ROI scenarios",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/chainweb/templates`,
    description: "Quick-start Chainweb ROI scenario templates",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/chainweb/scenarios`,
    description: "Create a partner-owned Chainweb ROI scenario",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/chainweb/scenarios/:id`,
    description: "Read a partner-owned Chainweb ROI scenario",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/chainweb/scenarios/:id/calculate`,
    description: "Calculate a partner-owned Chainweb ROI scenario",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/chainweb/calculations/:id/narratives`,
    description: "Generate a narrative for a partner-owned ROI calculation",
    scope: "chainweb:read",
    category: "Chainweb ROI",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/yhsi/metrics`,
    description: "Aggregate YHSI participant and referral metrics; floor-5 suppressed",
    scope: "yhsi:read",
    category: "YHSI aggregates",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/yhsi/outcomes-summary`,
    description: "Aggregate YHSI outcome milestones; floor-5 suppressed",
    scope: "yhsi:read",
    category: "YHSI aggregates",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/heartbeat`,
    description: "Record a platform keepalive; body may be empty",
    scope: "Any active partner or ecosystem key",
    category: "Partner operations",
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PATCH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function APIDocsPage() {
  useEffect(() => {
    document.title = "API Documentation | ThriveUp Academy";
  }, []);

  const categories = Array.from(new Set(API_ENDPOINTS.map(e => e.category)));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <PageHeader
        title="API Documentation"
        description="Integration endpoints for partner organizations"
        breadcrumbs={[{ label: "API Documentation" }]}
      />
      <div className="space-y-3">
        <Badge variant="outline" data-testid="badge-api-docs">
          <Code2 className="h-3 w-3 mr-1" />
          Scoped Partner API
        </Badge>
        <h1 className="text-3xl font-bold" data-testid="heading-api-docs">API Documentation</h1>
        <p className="text-muted-foreground max-w-2xl">
          Integrate with ThriveUp Academy through the scoped REST API. Use the
          <code className="bg-muted px-1 rounded mx-1">{PARTNER_API_BASE_PATH}</code>
          base path and request only the scopes your integration needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card data-testid="card-auth-info">
          <CardContent className="pt-6 flex items-start gap-3">
            <Key className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Partner Auth</div>
              <div className="text-sm text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">x-partner-key: tcaf_...</code> or
                <code className="bg-muted px-1 rounded ml-1">Authorization: Bearer tcaf_...</code>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-base-url">
          <CardContent className="pt-6 flex items-start gap-3">
            <Globe className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Base URL</div>
              <div className="text-sm text-muted-foreground break-all">
                <code className="bg-muted px-1 rounded">{window.location.origin}{PARTNER_API_BASE_PATH}</code>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-format">
          <CardContent className="pt-6 flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Response Format</div>
              <div className="text-sm text-muted-foreground">All responses are JSON with proper HTTP status codes</div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-contract-links">
          <CardContent className="pt-6 flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Integration resources</div>
              <a
                href={`${PARTNER_API_BASE_PATH}/docs`}
                className="block text-sm text-primary hover:underline"
                data-testid="link-machine-readable-contract"
              >
                Machine-readable contract
              </a>
              <Link
                href="/childcore-integration"
                className="block text-sm text-primary hover:underline"
                data-testid="link-childcore-monitoring"
              >
                ChildCORE monitoring (admin)
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h2
            className="text-xl font-bold mb-3"
            data-testid={`heading-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            {category}
          </h2>
          <div className="space-y-2">
            {API_ENDPOINTS.filter(e => e.category === category).map((endpoint) => (
              <Card key={endpoint.path} data-testid={`card-endpoint-${endpoint.path.replace(/[/:]/g, '-')}`}>
                <CardContent className="py-4 flex items-center gap-4">
                  <Badge className={`font-mono text-xs min-w-[50px] justify-center ${METHOD_COLORS[endpoint.method]}`}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono flex-1 min-w-0 truncate">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground hidden md:block max-w-xs truncate">{endpoint.description}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {endpoint.scope}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card className="bg-muted/50" data-testid="card-getting-started">
        <CardContent className="py-6 text-center space-y-3">
          <h3 className="font-semibold text-lg">Ready to integrate?</h3>
          <p className="text-sm text-muted-foreground">
            Contact our team for API key provisioning and integration support.
          </p>
          <div className="text-sm text-muted-foreground">
            <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary hover:underline" data-testid="link-contact-president">president@thecollaborativeadvocate.org</a>
            {" · "}
            <a href="mailto:programs@thecollaborativeadvocate.org" className="text-primary hover:underline" data-testid="link-contact-programs">programs@thecollaborativeadvocate.org</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
