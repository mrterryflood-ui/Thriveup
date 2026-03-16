import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Globe, Key, Shield, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/external/students/overview",
    description: "Aggregate student overview data",
    auth: "API Key",
    category: "Students",
  },
  {
    method: "GET",
    path: "/api/public/impact",
    description: "Public platform impact metrics and grant alignment data",
    auth: "None",
    category: "Impact",
  },
  {
    method: "GET",
    path: "/api/careers",
    description: "List all career fields with salary ranges and requirements",
    auth: "None",
    category: "Careers",
  },
  {
    method: "GET",
    path: "/api/career-milestones",
    description: "Career progression milestones by grade level",
    auth: "None",
    category: "Careers",
  },
  {
    method: "GET",
    path: "/api/mentors",
    description: "List available mentor profiles",
    auth: "None",
    category: "Mentors",
  },
  {
    method: "GET",
    path: "/api/alumni",
    description: "List alumni profiles and success stories",
    auth: "None",
    category: "Alumni",
  },
  {
    method: "GET",
    path: "/api/subjects",
    description: "List all curriculum subjects",
    auth: "None",
    category: "Curriculum",
  },
  {
    method: "GET",
    path: "/api/levels",
    description: "List AI Mastery curriculum levels",
    auth: "None",
    category: "Curriculum",
  },
  {
    method: "GET",
    path: "/api/levels/:levelId/modules",
    description: "List modules within a curriculum level",
    auth: "None",
    category: "Curriculum",
  },
  {
    method: "GET",
    path: "/api/admin/grant-metrics/export",
    description: "Export grant metrics as CSV",
    auth: "Admin",
    category: "Reporting",
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
    document.title = "API Documentation | AI Mastery Academy";
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
          Integration Documentation
        </Badge>
        <h1 className="text-3xl font-bold" data-testid="heading-api-docs">API Documentation</h1>
        <p className="text-muted-foreground max-w-2xl">
          Integrate with AI Mastery Academy using our REST API. Public endpoints require no authentication.
          Protected endpoints require an API key or admin session.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="card-auth-info">
          <CardContent className="pt-6 flex items-start gap-3">
            <Key className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">API Key Auth</div>
              <div className="text-sm text-muted-foreground">
                Pass your API key via the <code className="bg-muted px-1 rounded">X-API-Key</code> header
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
                <code className="bg-muted px-1 rounded">{window.location.origin}</code>
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
      </div>

      {categories.map(category => (
        <div key={category}>
          <h2 className="text-xl font-bold mb-3" data-testid={`heading-category-${category.toLowerCase()}`}>{category}</h2>
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
                    {endpoint.auth}
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
            sisnett.meredith@gmail.com | mr.terryflood@gmail.com
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
