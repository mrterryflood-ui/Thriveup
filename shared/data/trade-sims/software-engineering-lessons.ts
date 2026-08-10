/**
 * Software Engineering trade — 15-day curriculum content.
 *
 * Framing (from Dr. Flood, 2026-05-18):
 *   "Anybody can vibe code. But you have to know how the system works
 *    in order to get vibecoding to work properly."
 *
 * This trade is the engineering-mindset substrate behind every AI-assisted
 * build. Learners come in knowing how to prompt; they leave knowing why
 * the prompt worked, where it would have failed, and how to harden it for
 * production.
 *
 * Mirrors the Electrical / Plumbing / Welding / Automotive / HVAC lesson
 * schema exactly so the lesson player runs without modification. Engine
 * modes used:
 *   - "concept-only" → walkthrough + sandbox + AI-tutor inspection. No
 *                      physics solver. Software is a pattern-recognition
 *                      and decision discipline, not a continuous simulation.
 *
 * Curriculum aligned to the public SmartyMe "Engineering Fundamentals"
 * frame (System Architecture / Algorithms / Version Control / Testing /
 * Design Patterns / Scalability / Code Quality / Security / Capstone)
 * but rewritten to TCAF voice — credential-bearing, vendor-honest, no
 * invented partnerships.
 *
 * Credential pathway hooks reference only real, currently-recognized
 * industry credentials whose sponsoring bodies publish public exam
 * outlines:
 *   - GitHub Foundations
 *   - Microsoft Azure Fundamentals (AZ-900)
 *   - AWS Certified Cloud Practitioner (CLF-C02)
 *   - CompTIA IT Fundamentals+ (ITF+) and CompTIA A+
 *   - Linux Foundation Certified IT Associate (LFCA)
 *   - (ISC)² Certified in Cybersecurity (CC)
 * Real apprenticeship pathways:
 *   - Apprenti, Microsoft LEAP, Multiverse, Year Up.
 * Iron Rule: we cite sponsors and exam objectives, never fees or pass rates.
 */

import type { LessonEngineMode, TradeMeta } from "./types";

export type LessonConcept = {
  blurb: string;
  keyTerms: Array<{ term: string; definition: string }>;
  diagramKey?: string;
};

export type LessonGuidedStep = {
  instruction: string;
  hint: string;
  checkDescription: string;
};

export type LessonSoloChallenge = {
  prompt: string;
  successCriteria: string;
  scoringRubric: { correctness: number; time: number; componentCount: number };
};

export type LessonSandboxStarter = {
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  prompt: string;
};

export interface SoftwareEngineeringLessonContent {
  dayNumber: number;
  slug: string;
  title: string;
  shortDescription: string;
  engineMode: LessonEngineMode;
  concept: LessonConcept;
  guidedSteps: LessonGuidedStep[];
  soloChallenge: LessonSoloChallenge;
  sandboxStarter: LessonSandboxStarter;
  credentialPathway: string;
}

export const SOFTWARE_ENGINEERING_TRADE_META: TradeMeta = {
  slug: "software-engineering",
  name: "Software Engineering",
  tagline:
    "Anybody can vibe code — but you have to know how the system works to make vibecoding work.",
  description:
    "The engineering-mindset substrate behind every AI-assisted build. Architecture, algorithms, version control, testing, design patterns, scalability, code quality, and security — fifteen days that turn prompt-fluency into production-ready software.",
  iconKey: "code",
  displayOrder: 6,
};

export const SOFTWARE_ENGINEERING_LESSONS: SoftwareEngineeringLessonContent[] = [
  {
    dayNumber: 1,
    slug: "engineering-mindset",
    title: "The Engineering Mindset",
    shortDescription:
      "Why anybody can vibe code, but only engineers ship code that survives contact with users.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "An AI can write code in seconds. What it can't do — yet — is know whether that code belongs in your system. Engineering is the discipline of asking the right questions before, during, and after the prompt: What problem am I solving? What inputs will this see in the wild? What happens when it fails? Who else has to read this in six months? Vibe coding without that frame produces fragile demos. Vibe coding with that frame produces shipped products.",
      keyTerms: [
        { term: "Engineering mindset", definition: "The habit of reasoning about a system end-to-end — inputs, edge cases, failure modes, maintainers — before writing or accepting a single line of code." },
        { term: "Vibe coding", definition: "Letting an AI generate code from a feel-good prompt. Fast for prototypes, dangerous for production without engineering review." },
        { term: "Specification", definition: "A short written contract: what the code must do, what it must NOT do, what counts as 'done'." },
      ],
    },
    guidedSteps: [
      { instruction: "Open the sandbox notepad and write a one-paragraph spec for 'a function that returns the user's full name'.", hint: "Include: inputs, outputs, what happens when first or last name is missing.", checkDescription: "spec includes inputs, outputs, and at least one edge case" },
      { instruction: "Ask the AI tutor (Debrief tab) to critique your spec. Note three things it pushed back on.", hint: "Did you handle empty strings? Whitespace? International naming conventions?", checkDescription: "learner records three critiques" },
      { instruction: "Rewrite the spec so a stranger could implement it in any language and you'd accept the result.", hint: "If two implementations could disagree, the spec is underspecified.", checkDescription: "revised spec covers ambiguities from step 2" },
    ],
    soloChallenge: {
      prompt:
        "Write a 6-line spec for 'send a password reset email'. Cover at least: input, output, three failure modes, who is allowed to call it, and what counts as 'done'.",
      successCriteria:
        "Spec covers input, output, ≥3 failure modes, an authorization rule, and a measurable done condition. AI tutor grades for completeness.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Pick a feature from any app on your phone. Write the spec you wish its team had written before shipping it. Compare your spec to the actual behavior.",
    },
    credentialPathway:
      "The mindset of writing a spec before code is the first competency tested in GitHub Foundations and the 'troubleshooting methodology' domain of CompTIA ITF+. Master this and the rest of the trade compounds.",
  },
  {
    dayNumber: 2,
    slug: "system-architecture-n-tier",
    title: "System Architecture — N-Tier",
    shortDescription:
      "Presentation, business logic, data — why every serious app draws the same three boxes.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "n-tier",
      blurb:
        "Most production software organizes itself in tiers: a presentation tier the user sees, a business-logic tier that enforces the rules, and a data tier that persists state. Each tier has one job, and crossing tiers without permission is a code smell. The number of tiers is not the point — the point is that responsibilities don't leak. When an AI generates code that runs SQL queries from a button click handler, that's a tier violation; the fix is structural, not cosmetic.",
      keyTerms: [
        { term: "Presentation tier", definition: "The layer the user touches — UI components, request/response shapes, formatting." },
        { term: "Business logic tier", definition: "The layer where rules live — authorization, validation, computation, workflows." },
        { term: "Data tier", definition: "The layer that persists and queries state — usually a database plus a thin access layer." },
        { term: "Separation of concerns", definition: "Each tier handles one kind of decision. Mixing tiers makes code hard to test and impossible to scale." },
      ],
    },
    guidedSteps: [
      { instruction: "Sketch a 3-tier diagram on the sandbox canvas for a 'submit a benefits application' feature.", hint: "Top box = form UI, middle box = eligibility rules + storage call, bottom box = database table.", checkDescription: "diagram has 3 labeled tiers with one-way arrows down" },
      { instruction: "Mark which tier owns input validation. (Trick question — both presentation AND business.)", hint: "Presentation gives fast feedback; business is the security boundary.", checkDescription: "learner marks both tiers" },
      { instruction: "Find a tier violation in your sketch (e.g. raw SQL in the UI box) and refactor it.", hint: "Move the SQL into a function the business tier calls, exposed to the UI as a typed call.", checkDescription: "violation moved to the correct tier" },
    ],
    soloChallenge: {
      prompt:
        "Pick a feature from this ThriveUp platform (intake wizard, grant viewer, etc.) and draw its 3 tiers. Label one method or file that lives in each tier.",
      successCriteria:
        "Three tiers labeled with real file/route names from the codebase, no responsibility duplication.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Draw a 3-tier diagram for an ATM. Where is PIN validation? Where is the receipt printed? Where is the balance stored?",
    },
    credentialPathway:
      "N-tier architecture is the first topic in AWS Certified Cloud Practitioner Domain 2 and Microsoft AZ-900's 'core architectural components' section. Both publish free exam outlines.",
  },
  {
    dayNumber: 3,
    slug: "system-architecture-microservices",
    title: "System Architecture — Microservices vs Monolith",
    shortDescription:
      "When to keep it one binary, when to split it into a hundred — and the honest tradeoffs.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A monolith ships as one binary; a microservice architecture ships as many small services that talk over a network. Microservices give you independent deployment and isolated failure — at the cost of network latency, distributed-system bugs, and a much heavier operational burden. The honest rule: start as a well-modularized monolith. Split out a service only when a real seam shows up (different scaling needs, different team owners, different release cadence). 'Microservices because they're cool' is the most expensive cargo cult in the industry.",
      keyTerms: [
        { term: "Monolith", definition: "One deployable that contains the whole app. Simple to run, hard to scale a single hot path independently." },
        { term: "Microservice", definition: "A small, independently-deployable service with one bounded responsibility, called over a network." },
        { term: "Bounded context", definition: "The natural seam where one team's vocabulary stops and another's begins. The right place to split a service." },
        { term: "Distributed monolith", definition: "Microservices that can't be deployed independently — worst of both worlds. Avoid." },
      ],
    },
    guidedSteps: [
      { instruction: "List three reasons a team might want to split a microservice OUT of a monolith.", hint: "Different scaling needs, different team ownership, different security boundary, different language requirement.", checkDescription: "≥3 valid reasons listed" },
      { instruction: "List three reasons NOT to split.", hint: "Single-team app, low traffic, immature deployment pipeline, shared database tightly coupled.", checkDescription: "≥3 valid anti-reasons listed" },
      { instruction: "Decide: should TCAF's grant-discovery scanner run as part of the main app or as a separate service?", hint: "It has different scaling needs (runs on a schedule, hits external APIs) and different failure semantics (a 503 from grants.gov shouldn't take down the UI).", checkDescription: "learner reaches a justified verdict (either is defensible if argued)" },
    ],
    soloChallenge: {
      prompt:
        "A nonprofit has one Rails monolith handling forms, email, and reporting. Email is the hottest path. Write 3 sentences arguing for or against extracting the email service. Cite at least one risk on each side.",
      successCriteria:
        "Argument names at least one benefit and one risk on each side, lands on a specific recommendation.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Sketch the smallest microservice split you'd propose for Twitter circa 2008 (when it was one Rails monolith that kept falling over). Which one piece comes out first?",
    },
    credentialPathway:
      "Service-oriented architecture maps directly to AWS CCP Domain 2 (compute) and Microsoft AZ-900's 'IaaS vs PaaS vs SaaS' section. The honest tradeoff thinking is what separates a junior from a senior engineer.",
  },
  {
    dayNumber: 4,
    slug: "data-structures",
    title: "Data Structures",
    shortDescription:
      "Array, map, set, tree, queue — pick the wrong one and the bug is permanent.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Every problem in code is really a question about which data structure to use. Need to look something up by key in constant time? Map. Need to keep insertion order? Array or list. Need to check membership without duplicates? Set. Need to walk a hierarchy? Tree. Need first-in-first-out? Queue. Picking right makes code obvious; picking wrong forces you to write loops everywhere to compensate.",
      keyTerms: [
        { term: "Array / List", definition: "Ordered, index-addressable collection. O(1) by index, O(n) to search by value." },
        { term: "Map / Dictionary / Hash", definition: "Key-to-value lookup. O(1) average for get/set/delete." },
        { term: "Set", definition: "Unique-membership collection. O(1) average for has/add/delete." },
        { term: "Tree", definition: "Hierarchical structure (parent → children). Used for file systems, DOMs, org charts." },
        { term: "Queue / Stack", definition: "Queue = FIFO (first in first out). Stack = LIFO (last in first out)." },
      ],
    },
    guidedSteps: [
      { instruction: "For each scenario, pick the right structure: (a) 'list of recently-viewed pages, deduped', (b) 'count how many times each word appears in a paragraph', (c) 'process jobs in the order they came in'.", hint: "(a) Set or ordered-set, (b) Map of string→number, (c) Queue.", checkDescription: "all 3 correct" },
      { instruction: "Convert an array of 1000 IDs into a Set, then check membership 1000 times. Note the difference vs scanning the array.", hint: "Set is O(1) per check; array scan is O(n). For 1000×1000 that's 1000× faster.", checkDescription: "learner records both timings" },
      { instruction: "Pick the right structure for ThriveUp's grant-discovery deduplication (same grant from grants.gov and sam.gov).", hint: "Set keyed on a normalized opportunity ID.", checkDescription: "learner selects Set + reasons" },
    ],
    soloChallenge: {
      prompt:
        "You're building a leaderboard for the Trade Sims AI tutor. You need: fast insert when a learner finishes a lesson, fast lookup of a learner's current rank, and the top 10 on demand. Pick one or two data structures and justify.",
      successCriteria:
        "Answer combines a Map (userId → score) for O(1) lookup with a sorted structure (sorted set, heap, or sorted list) for top-10 retrieval; rationale stated.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Implement a simple URL shortener. What data structure maps short codes to long URLs? What handles collision detection?",
    },
    credentialPathway:
      "Data-structure literacy is the largest single domain in Apprenti's tech-apprenticeship aptitude test and Microsoft LEAP's technical screen. CompTIA A+ covers it at conceptual level.",
  },
  {
    dayNumber: 5,
    slug: "algorithms-big-o",
    title: "Algorithms & Big-O",
    shortDescription:
      "Why O(n²) is a love letter to your future-self bug report.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "big-o",
      blurb:
        "Big-O notation describes how long an algorithm takes — or how much memory it uses — as the input grows. O(1) is constant: same time no matter how big the input. O(log n) is fast (binary search). O(n) is linear (look at each item). O(n²) is a nested loop — two for-loops over the same data — and it's the most common reason an app that worked for 100 users falls over at 10,000. Knowing Big-O lets you read AI-generated code and immediately say 'that won't survive production'.",
      keyTerms: [
        { term: "Big-O", definition: "Worst-case growth rate of an algorithm's time or space as input size grows. Constants and lower-order terms drop out." },
        { term: "O(1) constant", definition: "Same time regardless of input. Hash-map lookup, array index access." },
        { term: "O(log n) logarithmic", definition: "Halves the search space each step. Binary search, balanced tree operations." },
        { term: "O(n) linear", definition: "Touches each element once. Filtering a list." },
        { term: "O(n²) quadratic", definition: "Nested loop over the same data. Brute-force matching. Avoid above ~1000 items." },
      ],
    },
    guidedSteps: [
      { instruction: "Classify: 'find one specific user in an unsorted list of 1M users'. What's the Big-O?", hint: "Scan from start until you find them — O(n).", checkDescription: "learner answers O(n)" },
      { instruction: "Same task, but the list is now a Map keyed by user ID. What's the Big-O?", hint: "Map lookup is constant time.", checkDescription: "learner answers O(1)" },
      { instruction: "AI generates: `for user in users: for other in users: if user.email == other.email: ...`. Identify the Big-O and the fix.", hint: "Nested loop = O(n²). Fix: build a Map of emails first, then one loop.", checkDescription: "learner identifies O(n²) and proposes O(n) Map-based fix" },
    ],
    soloChallenge: {
      prompt:
        "ThriveUp has 651 grants and 12,000 outreach contacts. You need to find every contact whose 'tags' field intersects with a grant's 'eligible_partner_types'. Naively that's 651 × 12,000 = 7.8M comparisons. Propose a structure that brings it to O(n + m). Sketch in pseudocode.",
      successCriteria:
        "Pseudocode builds a Map (or Set) keyed on tag, then iterates once. Total work O(grants + contacts).",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Profile any function you've written this month. What's its Big-O? Could it be lower?",
    },
    credentialPathway:
      "Algorithmic complexity is the largest single section of the Apprenti aptitude test and most tech apprenticeship screens (Microsoft LEAP, Multiverse). It's also the topic that most distinguishes vibe-coders from engineers.",
  },
  {
    dayNumber: 6,
    slug: "version-control-git-basics",
    title: "Version Control — Git Basics",
    shortDescription:
      "Commit, branch, merge — the time machine every team uses, badly.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Git is a time machine for code. Every commit is a snapshot you can return to. Every branch is a parallel timeline. Every merge brings two timelines together. The hard part isn't the commands — it's the discipline: commits are sentences (one idea each), commit messages are explanations (not 'fix stuff'), branches are intentions (a feature, not a junk drawer). An AI can generate the diff; only you can decide what story the history tells.",
      keyTerms: [
        { term: "Commit", definition: "A snapshot of your working directory with a message explaining why. The atomic unit of history." },
        { term: "Branch", definition: "A parallel line of commits. Used to develop a feature without disturbing the main timeline." },
        { term: "Merge", definition: "Combine two branches. Git uses three-way merge — your branch, their branch, and their common ancestor." },
        { term: "Remote", definition: "A version of your repo on someone else's machine (often GitHub). Push sends, pull receives." },
      ],
    },
    guidedSteps: [
      { instruction: "Initialize a repo, make 3 commits each with a one-line message explaining the change.", hint: "git init → write code → git add . → git commit -m 'add login form' → repeat.", checkDescription: "3 commits with non-empty descriptive messages" },
      { instruction: "Create a branch called `add-validation`, make a change, commit it.", hint: "git checkout -b add-validation → edit → git commit.", checkDescription: "branch exists with at least 1 commit not on main" },
      { instruction: "Switch back to main, merge your branch in, observe the new history.", hint: "git checkout main → git merge add-validation. `git log --oneline` shows the merge.", checkDescription: "main now contains the branch's commits" },
    ],
    soloChallenge: {
      prompt:
        "Write three commit messages — one BAD, one OK, one GREAT — for the same change: adding email validation to a signup form. Explain what makes the great one great.",
      successCriteria:
        "BAD is vague ('updates'), OK names the change, GREAT names the change AND why it matters AND any risk. Learner articulates the difference.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Look at your last 10 commits in any project. How many of them tell a stranger what changed and why?",
    },
    credentialPathway:
      "Git is the entire scope of GitHub Foundations (publicly available exam outline at education.github.com). Microsoft AZ-400 and AWS Certified Developer both assume Git fluency on day one.",
  },
  {
    dayNumber: 7,
    slug: "version-control-branching",
    title: "Version Control — Branching Strategies",
    shortDescription:
      "Trunk vs. GitFlow vs. PR-review — pick the one your team will actually follow.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "git-branch",
      blurb:
        "Branching strategy is a social contract, not a technical choice. Trunk-based development: everyone commits to main behind feature flags; fast and brutal, requires great tests. GitFlow: separate develop, release, hotfix branches; structured, heavy, good for products with formal release cadence. Pull-Request flow: feature branches reviewed before merge; the GitHub default and the right starting point for almost every team. Pick the one your team will follow under pressure — not the one that looks impressive in a deck.",
      keyTerms: [
        { term: "Trunk-based development", definition: "Everyone integrates to main daily; long-lived branches forbidden. Requires feature flags." },
        { term: "GitFlow", definition: "main + develop + feature/release/hotfix branches. Structured but heavyweight." },
        { term: "Pull Request (PR)", definition: "Proposed merge that gets reviewed (and optionally tested) before it lands. Default on GitHub." },
        { term: "Feature flag", definition: "Code path toggled at runtime so merged code can be inactive until ready." },
      ],
    },
    guidedSteps: [
      { instruction: "Open a PR against your own repo with a small change.", hint: "Branch → push → 'New pull request' on GitHub.", checkDescription: "PR exists with a title and description" },
      { instruction: "Add a 'What I changed / Why / How I tested' section to the PR description.", hint: "Every great PR description has those three things.", checkDescription: "description contains those three sections" },
      { instruction: "Review a teammate's PR (real or simulated). Leave one comment that asks a question and one that suggests an improvement.", hint: "Questions surface assumptions; suggestions improve code. Never just 'LGTM'.", checkDescription: "two distinct review comments" },
    ],
    soloChallenge: {
      prompt:
        "Pick a branching strategy for a 3-person nonprofit dev team shipping daily to a single production app. Justify in 3 sentences.",
      successCriteria:
        "Recommendation names the strategy, ties it to team size and release cadence, identifies one risk and how to mitigate it.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Draw your current team's branching strategy on the canvas. Is the diagram simpler than the README explaining it? If not, fix the strategy.",
    },
    credentialPathway:
      "Branching workflows are covered explicitly in GitHub Foundations and the DevOps section of Microsoft AZ-400. The conventional-commits standard (conventionalcommits.org) is a free upgrade to your message discipline.",
  },
  {
    dayNumber: 8,
    slug: "testing-unit",
    title: "Testing — Unit Tests",
    shortDescription:
      "Arrange, Act, Assert — the three lines that turn a feature into a contract.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A unit test pins a single function's behavior in place. It has three parts: Arrange (set up the inputs), Act (call the function), Assert (check the result). Good unit tests are fast, deterministic, and named after the behavior they describe (`returns_404_when_user_not_found`, not `test1`). They're not for catching every bug — they're for catching the bug you fixed last month from coming back. An AI can write the test for you; only you can decide what behavior is worth pinning.",
      keyTerms: [
        { term: "Unit test", definition: "Test for a single function/method in isolation. Fast (ms), deterministic, no network or DB." },
        { term: "Arrange-Act-Assert (AAA)", definition: "Three-section structure: set up → call → check. Makes tests readable." },
        { term: "Assertion", definition: "Statement that compares actual to expected. Fails the test if not equal." },
        { term: "Test coverage", definition: "Percent of code lines exercised by tests. 100% is not the goal — covering the right behaviors is." },
      ],
    },
    guidedSteps: [
      { instruction: "Write a function `fullName(first, last)` that returns 'First Last'. Now write 3 unit tests: happy path, empty last name, both empty.", hint: "Use Arrange-Act-Assert structure in each test.", checkDescription: "3 tests, AAA visible, all pass" },
      { instruction: "Add a failing case: what should `fullName('  Terry  ', 'Flood')` return? Add the test, watch it fail, fix the function, watch it pass.", hint: "Trim whitespace. Test → Red → Green.", checkDescription: "test exists, function is fixed" },
      { instruction: "Rename one test from `test1` to a behavior-describing name.", hint: "`returns_trimmed_full_name_when_input_has_whitespace`.", checkDescription: "test name describes the behavior" },
    ],
    soloChallenge: {
      prompt:
        "Write 5 unit tests for a function `isEligibleForGrant(applicantAge, applicantState, grantMinAge, eligibleStates)`. Cover: happy path, age too low, wrong state, missing argument, edge of eligibility boundary.",
      successCriteria:
        "5 tests with descriptive names and clear AAA structure; each test asserts one specific behavior.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Pick a function you've written recently. How would you know — in 30 seconds — if it stopped working? If you can't answer, write the test.",
    },
    credentialPathway:
      "Test-driven development is referenced in AWS Certified Developer, ISTQB Foundation Level (Certified Tester), and every tech apprenticeship onramp (Apprenti, Microsoft LEAP).",
  },
  {
    dayNumber: 9,
    slug: "testing-integration-debugging",
    title: "Testing — Integration & Debugging",
    shortDescription:
      "When unit tests aren't enough, and how to find the bug instead of guessing.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Integration tests check that pieces work together: your function actually writes to the database, your API actually returns the right shape. They're slower and flakier than unit tests but catch the bugs that hide between layers. Debugging is a parallel skill: form a hypothesis, design a test that distinguishes it from alternatives, run the test, narrow. The opposite of debugging is poking at code until something changes — never do that on a system anyone is depending on.",
      keyTerms: [
        { term: "Integration test", definition: "Tests multiple components together (function + DB, API + service). Slower; closer to real behavior." },
        { term: "Smoke test", definition: "Minimum 'does it boot' test. Run it before any deeper testing." },
        { term: "Hypothesis-driven debugging", definition: "Guess the cause, design a test that would falsify the guess, run it. Repeat until the bug is cornered." },
        { term: "Log + breakpoint", definition: "Two tools for inspecting live behavior. Logs scale; breakpoints are precise." },
      ],
    },
    guidedSteps: [
      { instruction: "Write an integration test that POSTs to a tiny endpoint and asserts the DB row exists afterward.", hint: "Spin up a test DB or use a transaction that rolls back at the end.", checkDescription: "test creates row and asserts it" },
      { instruction: "Introduce a deliberate bug: change the function to write to the wrong table. Watch the integration test catch it (unit tests likely wouldn't).", hint: "Unit tests usually mock the DB layer — they miss this class of bug.", checkDescription: "integration test fails on the bug" },
      { instruction: "Practice hypothesis-driven debugging: write down 3 candidate causes for a real bug you've seen, then a test that would distinguish each.", hint: "If you can't write the test, the hypothesis is too vague.", checkDescription: "3 hypotheses + 3 distinguishing tests" },
    ],
    soloChallenge: {
      prompt:
        "Reported bug: 'After I submit the form, sometimes the success email arrives, sometimes it doesn't.' Write 5 hypotheses and the test you'd run to confirm each.",
      successCriteria:
        "5 distinct hypotheses (network, queue, auth, race condition, throttling, etc.) each paired with a concrete test that would prove or rule it out.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Open a recent bug report in any project. Did the team identify a root cause or just paper over a symptom? Write the test that would have caught it.",
    },
    credentialPathway:
      "Integration testing is covered in ISTQB Foundation and AWS Certified Developer. Hypothesis-driven debugging is THE skill most tech apprenticeships interview for — every Apprenti/LEAP coach assesses this on day one.",
  },
  {
    dayNumber: 10,
    slug: "design-patterns-mvc",
    title: "Design Patterns — MVC",
    shortDescription:
      "Model, View, Controller — the most-used pattern in modern web stacks, including ours.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "mvc",
      blurb:
        "MVC organizes UI-driven systems into Model (the data + rules), View (what the user sees), and Controller (what handles user actions and decides what to update). Variations (MVP, MVVM, Flux/Redux) all share the same instinct: keep the thing the user sees separate from the thing that knows what's true. When an AI tells you 'add this to the component' but the change is really a rule about your data, that's the wrong layer — MVC tells you exactly where it actually belongs.",
      keyTerms: [
        { term: "Model", definition: "The data + business rules. Owns 'what is true' and 'what can change'." },
        { term: "View", definition: "Rendered output. No business logic — only display." },
        { term: "Controller", definition: "Handles input, orchestrates Model and View. The traffic cop." },
        { term: "MVVM / Redux / Flux", definition: "Variations of the same separation — what the user sees vs what's true." },
      ],
    },
    guidedSteps: [
      { instruction: "Map a feature in this app (e.g. the Trade Sims lesson player) to MVC: list one Model, one View, one Controller responsibility.", hint: "Model = lesson + progress data, View = the player UI, Controller = the route handler that loads + saves progress.", checkDescription: "one of each labeled, no overlap" },
      { instruction: "Find a place where the View is doing Model work (e.g. computing a grade in the JSX). Refactor.", hint: "Move the computation to the Model layer, expose it as a value the View just renders.", checkDescription: "computation moved out of View" },
      { instruction: "Find a place where the Controller is doing View work (e.g. building HTML strings in a route handler). Refactor.", hint: "Return data; let the View render it.", checkDescription: "HTML moved out of Controller" },
    ],
    soloChallenge: {
      prompt:
        "Sketch the MVC layers for a community-voice map-pin: where lives the lat/lng, the marker rendering, and the 'is this a crisis pin?' rule?",
      successCriteria:
        "Lat/lng + crisis rule in Model, marker rendering in View, controller handles incoming POST and dispatches. No layer holds another's responsibility.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Pick any screen in any app. Where does each pixel come from — Model, View, or Controller? Where would you change the wording vs. the rule?",
    },
    credentialPathway:
      "MVC and its variants are listed in AWS Certified Developer Domain 3 (development with AWS services) and Microsoft AZ-204. Every React/Angular/Vue interview assumes the underlying separation.",
  },
  {
    dayNumber: 11,
    slug: "design-patterns-singleton-factory",
    title: "Design Patterns — Singleton & Factory",
    shortDescription:
      "Two classic patterns — useful, overused, and often the wrong tool.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A Singleton ensures one and only one instance of a class — useful for a database connection pool, dangerous as a global mutable variable in disguise. A Factory hides construction behind a function that returns the right kind of object based on inputs — useful when picking implementations at runtime, overkill for a simple constructor. The point of patterns isn't to use them — it's to recognize when a problem matches one and reach for the named solution instead of reinventing it. Most production code uses zero formal patterns and that's often correct.",
      keyTerms: [
        { term: "Singleton", definition: "Pattern that guarantees a single instance of a class exists per process. Best for shared resources." },
        { term: "Factory", definition: "Function/method that returns objects, hiding which concrete class is used. Best for runtime polymorphism." },
        { term: "Dependency Injection", definition: "Instead of constructing dependencies inside, accept them as arguments. Often a better fit than Singleton." },
        { term: "Anti-pattern", definition: "Common solution that creates more problems than it solves. Singleton-as-global is the textbook example." },
      ],
    },
    guidedSteps: [
      { instruction: "Identify a Singleton in this codebase (hint: the database connection pool). Why is it a Singleton?", hint: "Constructing N pools for N requests would exhaust DB connections.", checkDescription: "learner identifies pool + reason" },
      { instruction: "Identify a Factory in this codebase (hint: the multi-AI provider that picks Gemini / Claude / GPT). Why a Factory?", hint: "Caller doesn't care which model; the factory picks based on availability/cost.", checkDescription: "learner identifies AI provider + reason" },
      { instruction: "Find a Singleton candidate that should NOT be a Singleton (e.g. user-specific state). Refactor to dependency injection.", hint: "User state is per-request, not per-process. Pass it in.", checkDescription: "refactor turns global into argument" },
    ],
    soloChallenge: {
      prompt:
        "Design a logger for ThriveUp that lets you choose between console / file / Sentry at runtime. Singleton, Factory, or both? Write 3 sentences of justification.",
      successCriteria:
        "Justification correctly distinguishes Singleton (one logger instance) from Factory (which destination implementation). Answer can pair them.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "List every global variable in a project you maintain. Which ones are really Singletons? Which are just lazy and need to become dependencies?",
    },
    credentialPathway:
      "Design patterns are a domain of AWS Certified Developer and (ISC)² CC's secure-design section. Reading Eric Freeman's free 'Head First Design Patterns' chapter samples is the cheapest deep prep available.",
  },
  {
    dayNumber: 12,
    slug: "scalability",
    title: "Scalability — Handling Load",
    shortDescription:
      "Cache, queue, replicate, partition — the four moves that take a system from 100 users to 100,000.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "scalability",
      blurb:
        "Scalability is the ability to handle more work without proportionally more pain. Four levers cover most situations: cache (don't recompute or refetch what hasn't changed), queue (let slow work happen asynchronously), replicate (run the same thing in parallel behind a load balancer), partition (split data so each server holds only a slice). The trap is reaching for them too early — premature scaling is the second-most-expensive cargo cult after microservices. Measure first, optimize the bottleneck, then move on.",
      keyTerms: [
        { term: "Cache", definition: "Store a computed/fetched result so the next call is fast. Trade memory for time." },
        { term: "Queue", definition: "Buffer of work to be processed later. Smooths bursts; decouples producer from consumer." },
        { term: "Horizontal scaling", definition: "Add more identical machines behind a load balancer. Usually cheaper than vertical." },
        { term: "Vertical scaling", definition: "Make one machine bigger. Simpler; has a ceiling." },
        { term: "Sharding / Partition", definition: "Split data across machines (by user_id, by region, etc.). Required at very large scale." },
      ],
    },
    guidedSteps: [
      { instruction: "Pick a hot endpoint in the ThriveUp app and identify what could be cached safely.", hint: "Cacheable: things that don't change per request (e.g. grant catalog). NOT cacheable: things that change per user (e.g. user's profile).", checkDescription: "cacheable + non-cacheable each identified" },
      { instruction: "Identify one slow operation that could move to a queue. Why is async safe here?", hint: "Sending email after submitting a form — user doesn't need to wait; failure can retry.", checkDescription: "operation named + async safety justified" },
      { instruction: "Decide: a tiny nonprofit app with 200 daily users — do you horizontally scale? Cache? Neither?", hint: "Neither. Premature scaling. Measure first; the bottleneck is probably something else.", checkDescription: "learner answers 'neither' with reasoning" },
    ],
    soloChallenge: {
      prompt:
        "TCAF's grant-discovery scanner currently writes 458 rows in 30 days. Imagine it must handle 458 rows per HOUR. What 3 architectural changes would you make, in priority order?",
      successCriteria:
        "Priority order names: (1) move the scanner to a queue/worker pool, (2) cache hot reads, (3) consider partitioning grants table by source. Or equivalent reasoned answers.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Pick any feature you've used today. Where do you think the cache layer is? What happens if it goes down?",
    },
    credentialPathway:
      "Scalability is the largest domain in AWS Certified Cloud Practitioner and Microsoft AZ-900. Both publish detailed exam blueprints for free.",
  },
  {
    dayNumber: 13,
    slug: "code-quality",
    title: "Code Quality — Maintainable & Efficient",
    shortDescription:
      "DRY, KISS, SOLID — the rules every code review really means.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Code is read ten times more often than it's written. Quality means a stranger (including future-you) can understand what it does and change it safely. DRY (don't repeat yourself) — but not at the cost of coupling. KISS (keep it simple) — fight the urge to be clever. SOLID — five principles (Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion) that all amount to 'each piece does one job, and changes don't cascade'. AI-generated code often looks fine but breaks one of these — review for them deliberately.",
      keyTerms: [
        { term: "DRY", definition: "Don't Repeat Yourself. Same logic in two places = one will drift." },
        { term: "KISS", definition: "Keep It Simple. The clever solution is the bug factory of next quarter." },
        { term: "SOLID", definition: "Five OO design principles that together produce code that changes don't break." },
        { term: "Code smell", definition: "Surface-level signal that something is off (long function, deep nesting, mysterious name). Not always a bug — always worth a second look." },
      ],
    },
    guidedSteps: [
      { instruction: "Find a function in any of your repos longer than 50 lines. Identify its 3 responsibilities. Sketch a refactor that splits them.", hint: "Long function = single responsibility violation almost every time.", checkDescription: "function identified + 3 responsibilities + split plan" },
      { instruction: "Find a piece of duplicated logic copy-pasted across two files. Decide: extract to a shared helper, or leave it?", hint: "Extract only if the two places will change together. Premature abstraction creates worse coupling than duplication.", checkDescription: "decision made with stated reasoning" },
      { instruction: "Rename one variable from `data` or `tmp` to a name that describes what it is.", hint: "Names are documentation. `currentUserApplications` beats `data` every time.", checkDescription: "variable renamed" },
    ],
    soloChallenge: {
      prompt:
        "Take any AI-generated function from any project and write 3 specific feedback comments you'd leave in code review. At least one must address a SOLID violation; at least one must address readability.",
      successCriteria:
        "Comments are specific (line + suggestion), one names a SOLID principle by name, one improves readability.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Read the longest file in any project you maintain. Could a stranger understand the top of the file in 30 seconds? If not, refactor or document until they can.",
    },
    credentialPathway:
      "Code quality is the most-cited domain across every senior software interview. CompTIA A+ covers it at conceptual level; AWS Certified Developer and Microsoft AZ-204 both assess refactoring instincts.",
  },
  {
    dayNumber: 14,
    slug: "security",
    title: "Security — Protect Data & Systems",
    shortDescription:
      "Input validation, secrets, OWASP Top 10 — the bare minimum to not be a headline.",
    engineMode: "concept-only",
    concept: {
      diagramKey: "security",
      blurb:
        "Security is a feature, not a layer. Three habits cover most production attacks: (1) validate every input — never trust the browser, never trust query params, never concatenate untrusted strings into SQL or commands. (2) Never put secrets in code — keys live in environment variables or secret managers, never committed. (3) Authorize every action server-side — the UI hiding a button is not authorization. The OWASP Top 10 is the publicly-published checklist; read it once a year. An AI will happily generate a SQL string with user input concatenated in. You have to be the one who notices.",
      keyTerms: [
        { term: "Input validation", definition: "Confirm every value matches an expected shape (type, length, charset) BEFORE using it." },
        { term: "SQL injection", definition: "Attacker controls a query because input is concatenated as a string. Always use parameterized queries." },
        { term: "Authorization", definition: "Confirming the authenticated user is allowed to do THIS action on THIS resource. Server-side only." },
        { term: "Secret", definition: "API key, password, token. Lives in env vars / secret manager. Never in source control. Never in logs." },
        { term: "OWASP Top 10", definition: "Publicly-published list of the 10 most common web app vulnerabilities. Updated every 3-4 years at owasp.org." },
      ],
    },
    guidedSteps: [
      { instruction: "Open any form in this app. Where is input validated client-side? Where is it validated server-side? Why are both needed?", hint: "Client = fast UX. Server = security. Client-side alone is not security.", checkDescription: "learner identifies both layers and the reason" },
      { instruction: "Find a `process.env.SOMETHING` call. Trace where the secret comes from. Confirm it is NOT in source control.", hint: "Run: `git log --all -S 'API_KEY=' --source`. If anything comes up, that's a leak.", checkDescription: "trace complete; no leak found OR leak surfaced" },
      { instruction: "Find a route that should require admin. Confirm it has a server-side `requireAdmin` middleware. Frontend-only hiding doesn't count.", hint: "Look in `server/*.ts` route definitions.", checkDescription: "route + middleware identified" },
    ],
    soloChallenge: {
      prompt:
        "Review this snippet (mentally or in the sandbox): `db.query('SELECT * FROM users WHERE email = ' + req.body.email)`. List 3 things wrong with it, in order of severity.",
      successCriteria:
        "1) SQL injection (highest), 2) returns all columns including hashes, 3) no authorization check. Or equivalent enumeration.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "Pick one route in this codebase. What happens if a logged-out attacker hits it directly with curl? If the answer isn't 'they get 401', that's a finding.",
    },
    credentialPathway:
      "Security mindset maps to (ISC)² Certified in Cybersecurity (CC) — free first attempt via the One Million Certified in Cybersecurity program. CompTIA Security+ is the next step. The OWASP Top 10 is the free, primary-source canon every engineer should bookmark.",
  },
  {
    dayNumber: 15,
    slug: "capstone-ship-a-system",
    title: "Capstone — Ship a Small System",
    shortDescription:
      "Take everything from Days 1-14 and ship a real, hosted, version-controlled, tested system.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Capstone day. You will design, build, test, secure, and deploy a tiny end-to-end system — frontend, backend, database. Not a tutorial copy; your idea. The point isn't to be impressive — it's to compress everything from Days 1-14 into one shipped artifact you can point a future employer or grant reviewer to. The AI is your pair programmer; the engineering mindset is yours. By the end of the day, you have: a public URL, a public Git repo with descriptive commits, a unit test that actually runs, a server-side authorization check, and a one-page README that a stranger could use to understand and extend it.",
      keyTerms: [
        { term: "Capstone artifact", definition: "A finished, public, documented project you can show. Worth more than a certificate." },
        { term: "README-driven development", definition: "Write the README first. If you can't describe it, you can't build it." },
        { term: "Definition of done", definition: "Specific, written, verifiable: deployed, tested, secured, documented. Not 'it works on my laptop'." },
      ],
    },
    guidedSteps: [
      { instruction: "Pick a problem you actually care about — small enough to ship today, useful enough to demo. Write a one-paragraph spec (Day 1 skill).", hint: "Constraint: must fit in one Git repo and one deploy.", checkDescription: "spec exists and is small" },
      { instruction: "Sketch the architecture in 3 tiers (Day 2). Name the data structures (Day 4). Identify the slowest path and how you'd scale it later (Day 12) — don't actually scale yet.", hint: "On paper. Sandbox canvas works.", checkDescription: "architecture sketch + DS choices + scale-later note" },
      { instruction: "Initialize the repo (Day 6). Commit on a branch (Day 7). Open a PR even though you're the only reviewer.", hint: "git init → branch → commit → PR.", checkDescription: "repo + branch + PR exist" },
      { instruction: "Write one unit test (Day 8) and one server-side authorization check (Day 14). Confirm both run.", hint: "Even one of each counts. Habit beats coverage on Day 15.", checkDescription: "test passes + authz check exists" },
      { instruction: "Deploy. Public URL works. Write the README (architecture + how to run + what to extend next).", hint: "README-driven development pays off here.", checkDescription: "URL is public + README is complete" },
    ],
    soloChallenge: {
      prompt:
        "Ship it. Share the URL, the repo, and the README. The AI tutor will assess against: spec clarity, tier separation, commit hygiene, test presence, authorization, deployment, README quality.",
      successCriteria:
        "All 7 dimensions present. Missing any one is a graded gap — fix and resubmit.",
      scoringRubric: { correctness: 0.7, time: 0.0, componentCount: 0.3 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt:
        "After you ship: list 3 things you'd refactor on Day 16 if you came back. That list IS the evidence you learned this trade.",
    },
    credentialPathway:
      "A shipped capstone is the single strongest application asset for Apprenti, Microsoft LEAP, Multiverse, Year Up, and GitHub Foundations portfolio assessment. Pair it with one credential from Days 6-14 and you have a credible junior-engineer onramp.",
  },
];
