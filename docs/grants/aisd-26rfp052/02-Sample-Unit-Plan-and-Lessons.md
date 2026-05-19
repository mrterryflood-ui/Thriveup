# Sample Unit Plan + Complementary Lessons
## ThriveUp Academy — Software Engineering Enrichment (Grades 6–12)
### Submitted in support of AISD 26RFP052 Proposal Response Form Question 10

---

## About this sample

This unit is drawn from our production 15-lesson Software Engineering track — one of six trade tracks (electrical, plumbing, HVAC, welding, automotive, software engineering) in the ThriveUp Academy Trade-Skills curriculum. The full track contains 15 sequenced lessons with formative practice banks, an AI tutor in Socratic mode for guided hints, and a 6-certification ladder unlocked at 80% lesson completion.

For this RFP we are sharing **Unit 1 of the Software Engineering track (3 lessons of 15)** as a representative example of our unit-planning rigor.

**Core teaching stance:** *"Anybody can vibe code. You have to know how the system works to make vibecoding work."*

This is the deliberate pedagogical position of the entire track — AI-assisted code generation is a real tool, but durable competence is in systems thinking. Every lesson reinforces this stance.

---

## UNIT 1 OVERVIEW

| Field | Value |
|---|---|
| **Unit Title** | "How the Computer Hears You" — Foundations of Computational Thinking |
| **Grade Band** | 6–12 (differentiated within-band) |
| **Duration** | 3 × 1-hour lessons (1 unit week) · expandable to 6 × 1-hour with optional extension |
| **Setting** | Afterschool, weekend, intersession, or summer enrichment block |
| **Group Size** | Up to 15 (1:15 ratio); 1:10 if hands-on lab |
| **Materials Provided by ThriveUp** | Laptops with offline-capable lessons (provided as needed if campus lacks 1:1), printed reference packs, formative-assessment cards, instructor guide |
| **Materials Required from AISD** | Programming space with seating, internet (preferred but not required), one power outlet per 4 students |

### TEKS Alignment Crosswalk (Unit 1)

| TEKS Standard | Alignment to this unit |
|---|---|
| §126.32 (Fundamentals of Computer Science) | Knowledge & Skills (c)(2)(B–C): demonstrate ethical use; (c)(4)(A): solve problems individually and collaboratively using a systematic approach |
| §126.33 (Computer Science I) | (c)(1)(C): identify the major components of a computer system; (c)(2)(A): use a systematic problem-solving process |
| §126.7 (Technology Applications, Grade 6) | (c)(1)(A): create original products using a variety of resources; (c)(4): critical thinking, problem solving, decision making |
| ELAR §110 (grade-band) | Speaking & listening: explain reasoning, build on others' ideas during structured discourse |

### Critical Success Factor Targets (per RFP Attachment B)

- Improved school-day attendance (mechanism: positive afterschool engagement)
- Improved academic achievement in Math and Science process strands (mechanism: systematic problem-solving practice)
- Increased post-secondary aspiration (mechanism: visible exposure to a real career pathway)
- Improved behavior (mechanism: structured, collaborative, success-experience-rich activities)

### Unit Essential Question

*"When you type something into an AI chatbot or a search engine, what actually happens between your fingers and the answer that comes back?"*

### Unit Objectives

By the end of this 3-lesson unit, learners will be able to:

1. Describe in their own words the four foundational layers of a computing system (hardware → operating system → application → user interface).
2. Identify at least three distinct "steps" between a user typing a request and a computer producing output.
3. Apply the *Decompose → Pattern-Match → Abstract → Algorithm* problem-solving sequence to a real, learner-chosen everyday task (making a sandwich, getting to school, scheduling homework).
4. Articulate why "vibe coding" without systems understanding produces brittle results, citing one concrete example from class discussion.

### Unit Assessment

- Formative: Exit-ticket prompts at each lesson (open-ended).
- Summative: A learner-chosen "Algorithm of a Daily Task" produced individually or in pairs, presented in 90 seconds during Lesson 3.
- No grade is reported to the campus; results inform our program improvement only and a personalized "next steps" recommendation for each learner who wants one.

---

## LESSON 1 — "Inside the Box"

**Duration:** 60 minutes
**Target Concept:** Layered system architecture (hardware → OS → application → UI)
**TEKS:** §126.33(c)(1)(C); §126.32(c)(4)(A)

### Materials
- Instructor laptop projecting on a screen or whiteboard
- One "system diagram" handout per learner (provided)
- Three colored markers per table group
- Optional: a disassembled laptop motherboard or a labeled photograph

### Lesson Flow

**Opening — 8 minutes**
- Hook (3 min): Instructor asks two questions, in this order: *"Raise your hand if you've ever talked to an AI chatbot. Now keep your hand up if you know what happens between your typing and its answer."* (Most hands drop — this is the entry point.)
- Framing (5 min): *"Today we're going to figure out what's actually in the box. Not so you can build one tomorrow — so you know what you're actually using when you click a button."*

**Direct Instruction — 12 minutes**
- Instructor walks through the four-layer model using a simple analogy (a building: foundation → plumbing/wiring → rooms → furniture). Each layer is named, defined in one sentence, and shown on the projection.
- Layers:
  1. **Hardware** — the physical thing (CPU, memory, storage, screen, keyboard).
  2. **Operating system** — the traffic controller that lets everything else use the hardware (Windows, macOS, Linux, Android, iOS).
  3. **Application** — what you actually opened (the browser, the AI app, the game).
  4. **User interface** — the part of the application you see and touch.

**Guided Practice — 15 minutes**
- Learners pair up; each pair gets the system-diagram handout.
- Pairs label one common scenario at all four layers: *"What is the hardware, the OS, the application, and the user interface when you ask ChatGPT a question on a school Chromebook?"* (Answer: Chromebook hardware → ChromeOS → web browser → chat input box.)
- Pairs trade scenarios with a neighboring pair and check each other's labels.

**Discussion — 12 minutes (whole-group)**
- Instructor surfaces 3–4 pair responses. Plants and harvests this question: *"Could you 'vibe code' a Chromebook into existence? Why not?"*
- Conclusion built collaboratively: software lives on top of hardware. You can vibe at the top layer; the bottom layers have to be real.

**Closing — 8 minutes**
- Independent exit-ticket: *"Name one thing you use every day and label its four layers."*
- Preview Lesson 2.

**Extension (if running long-form)**
- Watch a 4-minute "what's inside your phone" video; learners label additional layers.

### Differentiation
- **Grade 6–7:** Use only the building analogy throughout; the system diagram is pre-labeled with two of four layers, learner fills the other two.
- **Grade 11–12:** Add the network layer ("the wire to the outside world") and ask learners to label where the AI's actual answer-generation happens (it's not on the Chromebook — it's on a server elsewhere).
- **ELL learners:** Translated layer labels available in 89 languages; pair work intentionally pairs an ELL learner with a strong English speaker who shares a home-language tile.

---

## LESSON 2 — "The Right Question"

**Duration:** 60 minutes
**Target Concept:** Computational decomposition — breaking a problem into solvable parts
**TEKS:** §126.32(c)(4)(A); §126.33(c)(2)(A)

### Materials
- Decomposition workmat (one per learner, provided)
- Sticky notes (3 colors)
- Instructor's "Bad Algorithm" example sheet (provided)

### Lesson Flow

**Opening — 7 minutes**
- Recap Lesson 1 in 60 seconds, soliciting one volunteer.
- Hook: Instructor reads an intentionally bad algorithm aloud: *"To make breakfast: 1. Wake up. 2. Make breakfast."* Wait for laughter. *"Why doesn't this work?"*

**Direct Instruction — 10 minutes**
- Introduce decomposition: *"Big tasks have small steps inside them. The computer can't do the big task — it can only do the small steps."*
- Four-part sequence introduced as a single phrase the class repeats: ***Decompose → Pattern-Match → Abstract → Algorithm.***
- Anchor metaphor: a recipe is a decomposed task. The recipe author already did the systems thinking.

**Modeled Practice — 10 minutes**
- Instructor live-decomposes "getting to school in the morning" on the board with the class adding the steps. Aim for at least 12 steps before consolidation.
- The class then *abstracts* — collapses similar steps ("eat, brush teeth, leave") into a stage that could be re-used for "getting to grandma's house."

**Guided Practice — 18 minutes**
- Learners pick a daily task they actually do.
- Workmat structure (sticky note colors):
  - Pink: all the small steps (decompose).
  - Yellow: groupings of similar steps (pattern-match / abstract).
  - Green: the final ordered list (algorithm).
- Pairs share with another pair; each pair must identify one step in the other pair's algorithm that's actually two steps mashed together.

**Discussion — 10 minutes**
- Whole-group: 2–3 learners present their workmats.
- Instructor surfaces: *"Where did 'vibe' break down? Where did you need to slow down and break it apart?"*
- Connect to AI usage: *"When you ask an AI for an answer and the answer is bad, almost always it's because the question wasn't decomposed enough."*

**Closing — 5 minutes**
- Exit-ticket: *"What's one step in your task that you originally thought was one step but turned out to be three?"*
- Preview Lesson 3 — learners will turn their decomposition into a 90-second presentation.

### Differentiation
- **Grade 6–7:** Provide a pre-decomposed scaffold (3 steps already done, learner fills the rest).
- **Grade 11–12:** Add a "constraint" — the learner must explicitly write down what could go wrong at each step, mirroring how engineers handle edge cases.
- **Neurodiverse-aware option:** Visual decomposition with icons/drawings instead of words for any learner who prefers.

---

## LESSON 3 — "Why Systems Beat Vibes"

**Duration:** 60 minutes
**Target Concept:** Algorithm presentation; systems thinking as the differentiator between durable and brittle solutions
**TEKS:** §126.32(c)(4)(A); ELAR speaking-and-listening standards (grade-banded)

### Materials
- Learners bring their Lesson 2 workmats.
- 90-second timer visible to the room.
- One "Vibe Coding Demo" prepared by the instructor (a live AI prompt that produces a plausible but slightly wrong answer to a real task — e.g., a brittle pasta-cooking instruction set).

### Lesson Flow

**Opening — 5 minutes**
- The instructor begins with the "Vibe Coding Demo" — types a sloppy prompt into an AI chatbot in front of the class and asks the AI for a recipe with no decomposition. The AI produces a plausible answer that contains a real error (e.g., "boil pasta for 30 minutes" — too long).
- Question to the class: *"What did the AI do wrong? Did the AI know it was wrong?"*

**Direct Instruction — 8 minutes**
- The instructor names the core point: AI generates plausible-looking outputs from patterns. Without the human supplying the systems thinking (the decomposition, the constraints, the edge cases), the AI's output is brittle.
- The full phrase is named: ***"Anybody can vibe code. You have to know how the system works to make vibecoding work."***
- Distinction: this is not anti-AI. This is what makes you the engineer rather than the chatbot's stenographer.

**Presentations — 30 minutes**
- Each learner (or pair) presents their algorithm-of-a-daily-task in 90 seconds.
- Audience prompt: *"What's one step you'd refine if you had to teach an AI to do it?"*
- The instructor logs each refinement on the board.

**Group Reflection — 10 minutes**
- Whole-group reflection: *"What did you learn this week that you didn't know on Monday?"*
- The instructor reflects back the systems-thinking thread — every learner today did the work of an engineer.

**Closing — 7 minutes**
- Summative Exit Reflection (3 prompts):
  1. *Describe the four layers of a computing system.*
  2. *Describe Decompose → Pattern-Match → Abstract → Algorithm.*
  3. *Why is systems thinking important when you use AI?*
- Pathway preview: For learners who want more, the next 12 lessons take them deeper — including registered-apprenticeship and entry-level Software Engineering certifications. Optional sign-up for the full track.

### Differentiation
- **Grade 6–7:** Presentations can be 60 seconds; learners may present in their home language with translation provided.
- **Grade 11–12:** Presenters required to identify one real-world consequence if their algorithm were applied at scale (e.g., "if my route-to-school algorithm were used by a school bus company, the consequence of forgetting Step 4 would be...").

---

## ASSESSMENT RUBRIC — Unit 1 Summative

The 90-second algorithm presentation in Lesson 3 is the summative assessment. Rubric (4-point scale per dimension, internal only, not reported as a grade to AISD):

| Dimension | 4 = Strong | 3 = Developing | 2 = Emerging | 1 = Not yet |
|---|---|---|---|---|
| Decomposition | All major steps identified; no compound steps | Most major steps identified | Many steps are still compound | Task not meaningfully broken down |
| Sequence | Steps in a workable order | Mostly workable order; one obvious gap | Order has multiple errors | Sequence not communicated |
| Abstraction | Identifies reusable groupings | Some grouping attempted | Grouping not yet attempted | N/A |
| Systems explanation | Articulates *why* the order matters | Names the rule but partial reasoning | Order asserted without reasoning | Cannot articulate yet |

Internal use only; learner gets a coach-style narrative back, not a numeric score.

---

## FAMILY ENGAGEMENT CONNECTION (per National PTA Standard #3)

A 1-page take-home is provided in 89 languages at the end of Lesson 3 inviting families to attend a free Family Tech Night where their learner shares their algorithm-of-a-daily-task with them — and the family member is invited to add their own task. This satisfies *National PTA Standard #3: Active parent participation in student learning.*

---

## INSTRUCTOR PREPARATION

- 90-minute pre-unit instructor briefing (recorded; available on-demand for substitutes).
- Walk-through of the Lesson 3 "Vibe Coding Demo" — instructor practices the prompt and the AI's likely answer twice before delivering live.
- Materials kit assembled and shipped 5 business days before the first lesson.
- TEKS crosswalk shared with campus Roadmap point-of-contact for alignment confirmation.

---

*This sample is one unit (3 of 15 lessons) within the Software Engineering track. The complete 15-lesson sequence covers: Foundations of Computational Thinking · The Internet · How Code Works · Version Control Basics · Debugging as a Skill · Working in Teams · APIs and Why They Matter · Data and How to Think About It · Building a First App · Testing Your Work · Deployment and the World Beyond · Ethics in Software · Career Pathways · Apprenticeship Routes · Certification Prep.*

*Prepared for AISD 26RFP052 Proposal Response · The Collaborative Advocate Foundation / ThriveUp Academy · 2026-05-18*
