import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Code2, Copy, Globe, Key, Shield, ArrowRight } from "lucide-react";
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

type ApiExample = {
  id: string;
  title: string;
  description: string;
  scope: string;
  command: string;
  success: string;
  errors: string;
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
    path: `${PARTNER_API_BASE_PATH}/export`,
    description: "Content export for RAG ingestion",
    scope: "content:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/platforms`,
    description: "Live platform list and health metadata",
    scope: "platforms:read",
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
    path: `${PARTNER_API_BASE_PATH}/community`,
    description: "Community service summary",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/community/brief`,
    description: "Compatibility alias for community brief",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/community-story`,
    description: "Aggregate community story pack for a geography",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/community-brief/subscribe`,
    description: "Subscribe to scheduled community briefs",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/subscriptions`,
    description: "List your community brief subscriptions",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "DELETE",
    path: `${PARTNER_API_BASE_PATH}/subscriptions/:id`,
    description: "Deactivate a community brief subscription",
    scope: "community:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/benefits`,
    description: "Benefits program catalog",
    scope: "benefits:read",
    category: "Partner API",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/impact`,
    description: "Community impact metrics",
    scope: "impact:read",
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
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/webhooks`,
    description: "List your registered webhooks",
    scope: "Any active partner or ecosystem key",
    category: "Partner operations",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/webhooks`,
    description: "Register a webhook; secret shown once",
    scope: "Any active partner or ecosystem key",
    category: "Partner operations",
  },
  {
    method: "DELETE",
    path: `${PARTNER_API_BASE_PATH}/webhooks/:id`,
    description: "Deactivate a webhook",
    scope: "Any active partner or ecosystem key",
    category: "Partner operations",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/outcomes/trade-completions`,
    description: "Aggregate trade completion counts",
    scope: "outcomes:read",
    category: "Partner operations",
  },
  {
    method: "GET",
    path: `${PARTNER_API_BASE_PATH}/certificates/verify/:certId`,
    description: "Verify a trade certificate by ID",
    scope: "certs:read",
    category: "Partner operations",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/push`,
    description: "Push data to ThriveUp",
    scope: "inbound:write",
    category: "Partner operations",
  },
  {
    method: "POST",
    path: `${PARTNER_API_BASE_PATH}/foster-youth/refer`,
    description: "Create a foster youth intake referral",
    scope: "inbound:write",
    category: "Partner operations",
  },
];

const API_EXAMPLES: ApiExample[] = [
  {
    id: "authentication",
    title: "1. Verify authentication",
    description: "Start with the health endpoint to confirm that your scoped key is active and see the scopes assigned to it.",
    scope: "Any active partner key (no specific scope)",
    command: `curl --fail-with-body "$BASE_URL/health" \\
  -H "x-partner-key: $PARTNER_KEY"`,
    success: "200 OK — returns status, partner name, and assigned scopes.",
    errors: "401 Unauthorized — the key is missing, invalid, or revoked.",
  },
  {
    id: "student-aggregate",
    title: "2. Read aggregate student metrics",
    description: "Request a suppression-floored cohort overview. The optional grade filter keeps the response aggregate-only.",
    scope: "student:read",
    command: `curl --fail-with-body "$BASE_URL/students/overview?grade=10" \\
  -H "x-partner-key: $PARTNER_KEY"`,
    success: "200 OK — returns aggregateOnly data; cells below the suppression floor are null.",
    errors: "401 Unauthorized — missing/invalid key. 403 Forbidden — key lacks student:read.",
  },
  {
    id: "yhsi-aggregate",
    title: "3. Read aggregate YHSI metrics",
    description: "Read participant and referral totals without requesting individual youth records.",
    scope: "yhsi:read",
    command: `curl --fail-with-body "$BASE_URL/yhsi/metrics" \\
  -H "x-partner-key: $PARTNER_KEY"`,
    success: "200 OK — returns aggregateOnly data with floor-5 suppression.",
    errors: "401 Unauthorized — missing/invalid key. 403 Forbidden — key lacks yhsi:read.",
  },
  {
    id: "chainweb-lifecycle",
    title: "4. Run a Chainweb scenario lifecycle",
    description: "Requires curl and jq. Create a partner-owned scenario, then parse the returned IDs to read, calculate, and narrate it.",
    scope: "chainweb:read",
    command: `command -v jq >/dev/null || { echo "jq is required for this lifecycle example."; exit 1; }

CREATE_RESPONSE=$(curl --fail-with-body "$BASE_URL/chainweb/scenarios" \\
  -X POST \\
  -H "x-partner-key: $PARTNER_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{
    "name": "Austin youth reengagement",
    "description": "Estimate the effect of a community-based education intervention.",
    "geographyType": "county",
    "geographyLabel": "Travis County, TX",
    "geographyFips": "48453",
    "entryDomain": "education",
    "interventionName": "Community-based mentoring",
    "interventionDescription": "Mentoring and reengagement support for high-school students.",
    "interventionCostPerPerson": "1500.00",
    "populationSize": 5000,
    "timeHorizonYears": 10
  }')
SCENARIO_ID=$(printf '%s' "$CREATE_RESPONSE" | jq -r '.id // empty')
test -n "$SCENARIO_ID" || { echo "Create response did not include an id."; exit 1; }

curl --fail-with-body "$BASE_URL/chainweb/scenarios/$SCENARIO_ID" \\
  -H "x-partner-key: $PARTNER_KEY"

CALCULATION_RESPONSE=$(curl --fail-with-body "$BASE_URL/chainweb/scenarios/$SCENARIO_ID/calculate" \\
  -X POST \\
  -H "x-partner-key: $PARTNER_KEY")
CALCULATION_ID=$(printf '%s' "$CALCULATION_RESPONSE" | jq -r '.id // empty')
test -n "$CALCULATION_ID" || { echo "Calculate response did not include an id."; exit 1; }

curl --fail-with-body "$BASE_URL/chainweb/calculations/$CALCULATION_ID/narratives" \\
  -X POST \\
  -H "x-partner-key: $PARTNER_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{"audience":"grant_writer"}'`,
    success: "200 OK — create, read, calculate, and narrative requests return JSON.",
    errors: "400 Bad Request — invalid body or ID. 401 Unauthorized — missing/invalid key. 403 Forbidden — scenario belongs to another key. 404 Not Found — unknown scenario or calculation.",
  },
  {
    id: "heartbeat",
    title: "5. Send a heartbeat",
    description: "Record a platform keepalive. The body is optional; these fields provide useful operational context.",
    scope: "Any active partner key (no specific scope)",
    command: `curl --fail-with-body "$BASE_URL/heartbeat" \\
  -X POST \\
  -H "x-partner-key: $PARTNER_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{"status":"ok","version":"2026.09"}'`,
    success: "200 OK — heartbeat received and persisted.",
    errors: "401 Unauthorized — missing/invalid key. 422 Unprocessable Content — accepted after correcting invalid optional fields.",
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PATCH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function APIDocsPage() {
  const [copiedExampleId, setCopiedExampleId] = useState<string | null>(null);
  const [childcoreDocsUrl, setChildcoreDocsUrl] = useState<string | null>(null);
  const [childcoreDocsLoading, setChildcoreDocsLoading] = useState(true);

  useEffect(() => {
    document.title = "API Documentation | ThriveUp Academy";
    fetch("/api/childcore/public-config")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((data: { docsUrl?: string | null }) => setChildcoreDocsUrl(data.docsUrl ?? null))
      .catch((error) => console.warn("[API Docs] ChildCORE destination unavailable:", error))
      .finally(() => setChildcoreDocsLoading(false));
  }, []);

  const categories = Array.from(new Set(API_ENDPOINTS.map(e => e.category)));
  const apiBaseUrl = typeof window === "undefined"
    ? "https://your-thriveup-host.example.com/api/partner/v1"
    : `${window.location.origin}${PARTNER_API_BASE_PATH}`;
  const copyExample = async (exampleId: string, command: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopiedExampleId(`${exampleId}-unavailable`);
      return;
    }
    try {
      await navigator.clipboard.writeText(command);
      setCopiedExampleId(exampleId);
      setTimeout(() => setCopiedExampleId(null), 1800);
    } catch (error) {
      console.error("[API Docs] clipboard copy failed:", error);
      setCopiedExampleId(`${exampleId}-unavailable`);
    }
  };

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
        <p className="text-lg font-semibold" data-testid="heading-api-docs">Scoped API quick start</p>
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
                <code className="bg-muted px-1 rounded">{apiBaseUrl}</code>
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
              {childcoreDocsLoading ? (
                <span className="block text-sm text-muted-foreground" data-testid="text-childcore-external-docs-checking">
                  Checking ChildCORE Partner API docs…
                </span>
              ) : childcoreDocsUrl ? (
                <a
                  href={childcoreDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                  data-testid="link-childcore-external-docs"
                >
                  ChildCORE Partner API docs
                </a>
              ) : (
                <span className="block text-sm text-muted-foreground" data-testid="text-childcore-external-docs-unavailable">
                  ChildCORE Partner API docs unavailable
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <nav aria-label="Documentation sections" className="rounded-md border bg-card p-4" data-testid="documentation-contents">
        <div className="text-sm font-semibold mb-2">On this page</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a href="#copy-ready-examples" className="text-primary hover:underline">Copy-ready examples</a>
          {categories.map((category) => {
            const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return (
              <a key={category} href={`#category-${categorySlug}`} className="text-primary hover:underline">
                {category}
              </a>
            );
          })}
        </div>
      </nav>

      <section id="copy-ready-examples" className="space-y-4 scroll-mt-4" data-testid="section-copy-ready-examples">
        <div>
          <h2 className="text-xl font-bold">Copy-ready curl examples</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Replace the host, key, and returned IDs locally. The key below is a
            fake placeholder; never paste a real credential into documentation,
            source control, or support requests.
          </p>
        </div>
        <Card className="bg-muted/50" data-testid="card-example-setup">
          <CardContent className="py-4">
            <div className="text-sm font-medium mb-2">Run this setup once in your shell</div>
            <pre aria-label="Shell setup variables" className="overflow-x-auto rounded-md bg-background p-3 text-xs leading-relaxed">
              <code>{`BASE_URL="${apiBaseUrl}"
PARTNER_KEY="tcaf_replace_with_your_scoped_key"`}</code>
            </pre>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {API_EXAMPLES.map((example) => (
            <Card key={example.id} data-testid={`card-api-example-${example.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle id={`example-title-${example.id}`} className="text-base">{example.title}</CardTitle>
                  <button
                    type="button"
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Copy ${example.title} command`}
                    aria-controls={`example-code-${example.id}`}
                    data-testid={`button-copy-api-example-${example.id}`}
                    onClick={() => void copyExample(example.id, example.command)}
                  >
                    {copiedExampleId === example.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedExampleId === example.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{example.description}</p>
                <div className="grid gap-1 pt-1 text-xs text-muted-foreground break-words">
                  <div><span className="font-semibold text-foreground">Required scope:</span> {example.scope}</div>
                  <div><span className="font-semibold text-foreground">Success:</span> {example.success}</div>
                  <div><span className="font-semibold text-foreground">Errors:</span> {example.errors}</div>
                </div>
              </CardHeader>
              <CardContent>
                <pre id={`example-code-${example.id}`} aria-labelledby={`example-title-${example.id}`} className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
                  <code>{example.command}</code>
                </pre>
                {copiedExampleId === `${example.id}-unavailable` && (
                  <p className="mt-2 text-xs text-muted-foreground" role="status">
                    Clipboard access is unavailable. Select the command above to copy it manually.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {categories.map(category => {
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
        <section id={`category-${categorySlug}`} aria-labelledby={`heading-category-${categorySlug}`} className="scroll-mt-4" key={category}>
          <h2
            id={`heading-category-${categorySlug}`}
            className="text-xl font-bold mb-3"
            data-testid={`heading-category-${categorySlug}`}
          >
            {category}
          </h2>
          <div className="space-y-2">
            {API_ENDPOINTS.filter(e => e.category === category).map((endpoint) => (
              <Card key={`${endpoint.method}-${endpoint.path}`} data-testid={`card-endpoint-${endpoint.method}-${endpoint.path.replace(/[/:]/g, '-')}`}>
                <CardContent className="py-4 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
                  <Badge className={`font-mono text-xs min-w-[50px] justify-center self-start md:self-auto ${METHOD_COLORS[endpoint.method]}`}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono flex-1 min-w-0 break-all">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground hidden md:block max-w-xs truncate">{endpoint.description}</span>
                  <Badge variant="outline" className="text-xs shrink-0 max-w-full whitespace-normal break-words text-left md:max-w-xs md:text-center">
                    {endpoint.scope}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        );
      })}

      <Card className="bg-muted/50" data-testid="card-getting-started">
        <CardContent className="py-6 text-center space-y-3">
          <h3 className="font-semibold text-lg">Ready to integrate?</h3>
          <p className="text-sm text-muted-foreground">
            Contact our team for API key provisioning and integration support.
          </p>
          <div className="text-sm text-muted-foreground">
            <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="text-primary hover:underline" data-testid="link-contact-integration-support">terryflood@thrivingcommunitiesforall.com</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
