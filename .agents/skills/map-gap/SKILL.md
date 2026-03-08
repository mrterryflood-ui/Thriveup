---
name: map-gap
description: MAP-GAP continuous improvement framework for systematic platform improvement. Use before any improvement cycle, bug sweep, quality audit, or when the user asks to fix, improve, harden, or audit the platform. Provides structured observation, gap prioritization, parallel execution, validation, and persistent lesson tracking.
---

# MAP-GAP: Reflective Adaptive Learning Architecture

MAP-GAP is the primary continuous improvement methodology for AI Mastery Academy. It structures every improvement cycle into five disciplined phases: MAP (observe), GAP (prioritize), EXECUTE (fix), VALIDATE (verify), and LEARN (persist). Every improvement cycle must follow this framework.

## Core Cycle

### Phase 1: MAP (Observe the Current State)
Launch parallel explorers to audit the full system. Never fix what you haven't mapped first.

**Automated Health Checks** (run these at cycle start):
```bash
# Server error handling coverage
node -e "const fs=require('fs');const c=fs.readFileSync('server/routes.ts','utf8').split('\n');let t=0,m=0;for(let i=0;i<c.length;i++){if(c[i].match(/app\.(get|post|patch|delete)\(\"/)){t++;let h=false;for(let j=i+1;j<Math.min(i+6,c.length);j++){if(c[j].includes('try {')){h=true;break}}if(!h)m++}}console.log('Routes: '+t+', Missing try/catch: '+m)"

# Auth coverage on user-specific routes
grep -n "getUserId\|getUserName" server/routes.ts | grep -v "requireAuth" | head -20

# PageHeader coverage
grep -rn "PageHeader" client/src/pages/ | wc -l

# ErrorRetry coverage
grep -rn "ErrorRetry" client/src/pages/ | wc -l

# React hooks violations (useEffect inside conditionals)
grep -n "if.*useEffect\|useEffect.*if\s*(" client/src/pages/*.tsx client/src/components/*.tsx 2>/dev/null

# Nested anchor tags
grep -rn "<Link.*><a " client/src/pages/ client/src/components/ 2>/dev/null

# data-testid coverage
grep -rn "data-testid" client/src/pages/ client/src/components/ | wc -l

# aria-label coverage
grep -rn "aria-label" client/src/pages/ client/src/components/ | wc -l
```

**Parallel Explorer Domains** (launch simultaneously):
1. Server routes: error handling, auth, storage method references
2. Database schema vs storage: missing CRUD implementations
3. Client routes: orphan pages, broken imports
4. Authentication flow: session management, auth gaps
5. AI systems: chat, creation studio, streaming
6. Dashboard: data accuracy, feature completeness
7. Admin: metrics, course creator, role protection

### Phase 2: GAP (Identify and Prioritize Gaps)

Classify every gap by severity and stakeholder impact:

| Severity | Definition | Action | Example |
|----------|-----------|--------|---------|
| **CRITICAL** | Data loss, security vulnerability, crash risk | Fix immediately in this cycle | Missing try/catch on routes, auth gaps on user data |
| **HIGH** | Incorrect data, broken features, misleading UI | Fix in this cycle | Hardcoded completedModules: 0, admin items visible to students |
| **MODERATE** | Missing polish, inconsistent patterns, UX friction | Fix if capacity allows | Missing PageHeader, no onboarding link |
| **LOW** | Enhancement opportunities, nice-to-haves | Document for next cycle | Additional loading skeletons, print optimizations |

**Stakeholder Impact Assessment** (required for each gap):
- **Students**: Does this affect their learning experience or progression tracking?
- **Teachers/Admins**: Does this affect classroom management or platform administration?
- **Funders/Partners**: Does this affect grant metrics, impact data, or professional credibility?
- **Technical**: Does this affect reliability, security, or maintainability?

### Phase 3: EXECUTE (Fix with Maximum Parallelism)

**Dependency Rules:**
- Tasks touching the same file: execute sequentially (prevent conflicts)
- Tasks on different files: execute in parallel via subagents
- Server-side tasks requiring careful coordination: handle directly
- Client-side independent tasks: delegate to subagents

**Cycle Sizing Guidelines:**
- Maximum 8 tasks per cycle
- Prefer 4-6 tasks for optimal validation
- One cycle should address a single category of gap OR a single system layer
- Never mix security fixes with UX polish in the same cycle

**Execution Patterns:**
- Mechanical/repetitive fixes (e.g., wrapping routes in try/catch): use node scripts
- Logic changes (e.g., calculating completedModules): manual edits with full context
- UI changes (PageHeader, sidebar): delegate to subagents with relevant files

### Phase 4: VALIDATE (Verify Every Outcome)

**Validation Checklist** (complete all that apply):
1. API endpoint testing: `curl` each affected endpoint for correct status codes
2. Auth verification: confirm protected routes return 401 without auth
3. Public route verification: confirm public routes still return 200
4. Browser console check: `refresh_all_logs` for new warnings/errors
5. Architect review: `architect({task, relevantFiles, includeGitDiff: true})`
6. E2E testing: `runTest()` with comprehensive test plan
7. Compound metrics: compare pre-cycle and post-cycle health check numbers

### Phase 5: LEARN (Persist Lessons)

After every cycle:
1. Update `replit.md` with new coverage numbers and architectural changes
2. Update `.agents/skills/map-gap/lessons-learned.md` with new lessons
3. Check if any lesson can become an automated health check (add to Phase 1 scripts)
4. Delete the session plan file (`.local/session_plan.md`)

## Compound Improvement Tracking

Track cumulative progress across all cycles in replit.md:

| Metric | Baseline | Current | Target |
|--------|----------|---------|--------|
| GET routes with try/catch | 70/124 (56%) | 124/124 (100%) | 100% |
| Pages with ErrorRetry | 9 | 50 | All navigable pages |
| Pages with PageHeader | 13 | 55 | All navigable pages |
| data-testid attributes | ~1,500 | 2,338+ | All interactive elements |
| aria-labels | ~40 | 95+ | All icon-only buttons |
| React hooks violations | 6 | 0 | 0 |
| User-specific routes with auth | ~80% | 100% | 100% |
| Silent catch blocks | Unknown | 0 | 0 |
| console.log in server | Unknown | 0 | 0 |

## Naming Convention

Cycles are named with letter-series: E-series, F-series, G-series, etc.
Tasks within a cycle use the pattern: G01, G02, G03...
This provides clear traceability across sessions.

## Anti-Patterns to Avoid

1. **Fixing without mapping**: Never jump into code changes without running health checks first
2. **Scattered scope**: Don't mix security, UX, and data integrity fixes in one cycle
3. **Manual repetition**: If a fix applies to 10+ locations, script it
4. **Skipping validation**: Every execution must have a corresponding validation step
5. **Losing lessons**: Every cycle must produce at least one persistent lesson
6. **Over-scoping**: More than 8 tasks per cycle risks incomplete validation
7. **Ignoring stakeholder impact**: Every gap must articulate who benefits from the fix

## Project-Specific Rules (AI Mastery Academy)

- NEVER use "NBA", "NBA Foundation", or NBA-specific code identifiers anywhere
- Grant alignment language: "workforce development", "school-to-career pipelines", "under-resourced youth", "job readiness"
- Platform identity: "AI Mastery Academy" (primary), "School Support Hub" (secondary)
- Contact info always shows both: sisnett.meredith@gmail.com AND mr.terryflood@gmail.com
- No emoji in UI code
- All interactive elements need data-testid AND aria-label
- All useEffect(document.title) must be unconditional (before any early returns)
- Arthur Wakanda = student protagonist (Howard University Class of 2032)
