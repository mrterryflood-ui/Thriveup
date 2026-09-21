/**
 * Verifies that every static client route has an entry point in primary navigation.
 *
 * Sources are intentionally limited to the sidebar, the More Tools hub, and the
 * landing page. Run with: npx tsx scripts/verify-nav-coverage.ts
 */
import { readFileSync } from "node:fs";

const APP = "client/src/App.tsx";
const NAV_SOURCES = [
  "client/src/components/app-sidebar.tsx",
  "client/src/pages/hub-more.tsx",
  "client/src/pages/landing.tsx",
];

const appSource = readFileSync(APP, "utf8");
const navSources = NAV_SOURCES.map((path) => ({
  path,
  source: readFileSync(path, "utf8"),
}));

const routes = new Set(
  [...appSource.matchAll(/<Route\b[^>]*\bpath=(?:"([^"]+)"|'([^']+)')/g)]
    .map((match) => match[1] ?? match[2])
    .filter((path) => !path.includes(":")),
);

function normalize(path: string): string {
  return path.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
}

const navigationPaths = new Set<string>();
for (const { source } of navSources) {
  // Covers JSX href literals and the href/url fields that feed Link components.
  const patterns = [
    /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/g,
    /\bhref\s*:\s*(?:"([^"]+)"|'([^']+)')/g,
    /\burl\s*:\s*(?:"([^"]+)"|'([^']+)')/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1] ?? match[2];
      if (value.startsWith("/") && !value.startsWith("/api/")) {
        navigationPaths.add(normalize(value));
      }
    }
  }
}

// Intentional standalone shells: these are opened through presentation/embed
// contexts rather than normal site navigation.
const STANDALONE_ROUTES = new Set([
  "/presentation",
  "/childinc-deck",
  "/ecosystem/embed",
  "/ecosystem/lifebridge",
]);

// Redirect-only aliases preserve old bookmarks. Their canonical destinations,
// not every legacy spelling, are expected in navigation.
const REDIRECT_ROUTES = new Set([
  "/ecosystem-hub-legacy",
  "/chainweb-builder",
  "/reentry-dashboard",
  "/corridor",
  "/network/members",
  "/wab2-enrollment-hub",
  "/benefits-command-center",
  "/outcome-reporting",
  "/ecosystem-hub",
  "/mentorship",
  "/open-innovation",
  "/parent-dashboard",
  "/rplice",
  "/sedgwick",
  "/workforce",
  "/advisory",
  "/mapgap",
  "/dfc-command-center",
  "/herhealth",
  "/sankofa",
]);

// Internal administration and staff workspaces are discoverable only after
// authentication and are deliberately excluded from public navigation coverage.
const INTERNAL_ROUTE_PREFIXES = ["/admin/"];
const INTERNAL_ROUTES = new Set([
  "/regional-briefing",
  "/grants",
  "/workforce-dashboard",
  "/wioa-outcomes",
  "/grant-command-center",
  "/rfp-fidelity",
  "/grant-narrative",
  "/grant-narrative-legacy",
  "/my-grants",
  "/won-proposals",
  "/teaming-network",
  "/conglomerate",
  "/staffing-plan",
  "/apex-accelerators",
  "/grant-packages",
  "/grants/applications",
  "/grant-prior-awards",
  "/stdavids-prep",
  "/esign",
  "/austin-community-bridge/deliverable",
  "/austin-community-bridge/readiness",
  "/ops-center",
  "/childcore-integration",
  "/healthcare-grants",
  "/loi-writer",
  "/orchestra",
  "/funder-dashboard",
  "/foster-youth/cohort-analytics",
  "/yhsi-ops",
  "/yhsi-system",
]);

// Contextual destinations are entered from a parent hub, setup flow, or signed-in
// account action. Putting these deep steps in global navigation would bypass the
// context or prerequisite that makes the page useful. Every entry has an explicit
// reason so this list cannot become an unexplained dumping ground.
const CONTEXTUAL_ROUTES = new Map<string, string>([
  ["/academy/admin-video-script", "academy content-authoring step reached from academy administration"],
  ["/academy/course-creator", "academy content-authoring step reached from academy administration"],
  ["/academy/hub", "legacy academy sub-hub reached from the academy village"],
  ["/academy/mentor-finder", "guided mentor-matching step reached from academy pathways"],
  ["/academy/mentors", "academy mentor detail surface reached from academy pathways"],
  ["/academy/phased-rollout", "academy implementation detail reached from academy administration"],
  ["/chainweb", "builder workspace launched from the SDOH impact-chain experience"],
  ["/concepts/airplane-wing", "concept detail reached from the Concepts index"],
  ["/concepts/lithium-battery", "concept detail reached from the Concepts index"],
  ["/concepts/oil-pumpjack", "concept detail reached from the Concepts index"],
  ["/concepts/pacemaker", "concept detail reached from the Concepts index"],
  ["/concepts/public-key-encryption", "concept detail reached from the Concepts index"],
  ["/concepts/suspension-bridge", "concept detail reached from the Concepts index"],
  ["/concepts/transformer", "concept detail reached from the Concepts index"],
  ["/concepts/wind-turbine", "concept detail reached from the Concepts index"],
  ["/corridor/docs", "supporting document view reached from Corridor Intelligence"],
  ["/corridor/docs/live", "live supporting document view reached from Corridor Intelligence"],
  ["/corridor/evidence", "evidence detail reached from Corridor Intelligence"],
  ["/curriculum-documents/new", "document creation action reached from Curriculum Documents"],
  ["/dashboard", "personalized signed-in destination reached after authentication"],
  ["/data", "data sub-hub reached from public data and assessment experiences"],
  ["/donor-receipt-demo", "demonstration flow launched from the Donors page"],
  ["/ecosystem-intel", "analysis workspace launched from the Ecosystem experience"],
  ["/employer/register", "employer signup flow reached from workforce employer connections"],
  ["/hbcu-opportunities", "opportunity detail reached from workforce and rural pathways"],
  ["/hub/more", "navigation aggregation page; a self-link is neither useful nor required"],
  ["/intake-wizard", "alternate intake entry retained for links inside service workflows"],
  ["/join", "short alias used by partner calls to action"],
  ["/module-1-2-tools", "course support page reached from its curriculum modules"],
  ["/nsf-techaccess-hub", "program-specific workspace reached from grant and workforce flows"],
  ["/onboarding/org", "signed-in organization setup flow"],
  ["/parents/dashboard", "signed-in parent destination reached from the Parents page"],
  ["/research", "alternate methodology entry used by research content"],
  ["/safe-passage/benefits-bridge", "guided step reached from the Safe Passage toolkit"],
  ["/safe-passage/employment-pathway", "guided step reached from the Safe Passage toolkit"],
  ["/safe-passage/housing-assessment", "guided step reached from the Safe Passage toolkit"],
  ["/safe-passage/housing-finder", "guided step reached from the Safe Passage toolkit"],
  ["/safe-passage/impact-dashboard", "program reporting step reached from the Safe Passage toolkit"],
  ["/safe-passage/legal-navigator", "guided step reached from the Safe Passage toolkit"],
  ["/safe-passage/partner-portal", "partner-only step reached from the Safe Passage toolkit"],
  ["/safe-passage/safety-planning", "guided step reached from the Safe Passage toolkit"],
  ["/transparency-dashboard", "alternate transparency entry used by impact content"],
  ["/voice/new", "project creation action reached from Community Voice"],
]);

function isExcluded(route: string): boolean {
  return STANDALONE_ROUTES.has(route)
    || REDIRECT_ROUTES.has(route)
    || INTERNAL_ROUTES.has(route)
    || CONTEXTUAL_ROUTES.has(route)
    || INTERNAL_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));
}

const uncovered = [...routes]
  .map(normalize)
  .filter((route) => !isExcluded(route) && !navigationPaths.has(route))
  .sort();

if (uncovered.length > 0) {
  console.error(`verify-nav-coverage: FAIL - ${uncovered.length} literal route(s) have no navigation link:`);
  for (const route of uncovered) console.error(`  ${route}`);
  process.exit(1);
}

console.log(
  `verify-nav-coverage: PASS - ${routes.size} literal routes checked; `
  + `${navigationPaths.size} navigation paths found; no uncovered routes.`,
);