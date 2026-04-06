import { lessons, quizQuestions, badges } from "@shared/schema";

export async function seedWorkforceLessons(db: any): Promise<void> {
  const { eq } = await import("drizzle-orm");

  // ============================================================
  // WORKFORCE READINESS GRADES 9-12 — TEKS §127.15 Aligned
  // Culturally Responsive, Student-Centered, Phone-First
  // 5 Modules × 4 Lessons = 20 Lessons + 50 Quiz Questions + 11 Badges
  // ============================================================

  await db.insert(lessons).values([
    // ===== MODULE 1: PROFESSIONAL PRESENCE =====
    {
      id: "wr_m1_lesson_1",
      moduleId: "wr_professional_presence",
      lessonNumber: 1,
      title: "Welcome & Your Professional Identity",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## Welcome to the Workforce Readiness Academy

You're here because you're ready for something real. Not a worksheet. Not a lecture. A program that actually prepares you for the world that's waiting.

**First things first — download ThriveUp on your phone right now.**

On your phone's browser, go to this site and tap "Add to Home Screen" (or "Install App"). This gives you 24/7 access to:
- Your resume builder (we'll start today)
- AI mock interview practice (anytime, anywhere)
- Your career portfolio
- Your badges and progress
- Direct connection to mentors and neighborhood champions

**Do it now. We'll wait. This is your first career move.**

---

### Your Professional Identity Already Exists

Here's what nobody tells you: **you already have professional skills.** Right now. Today.

- Do you show up on time to things that matter to you? That's **punctuality**.
- Have you ever helped a younger sibling with homework? That's **tutoring and mentorship**.
- Do you translate for family members? That's **bilingual communication skills**.
- Have you ever organized a group chat, planned a hangout, or coordinated rides? That's **project coordination**.
- Do you babysit, mow lawns, help at church, or work with family? That's **work experience**.

The world tries to tell you that you don't have experience. That's not true. You have experience — you just haven't been taught how to name it yet. That changes today.

### What Does "Professional" Actually Mean?

Let's be real — "professional" doesn't mean "act white" or "pretend to be someone you're not." Professional means:

- **Showing respect** — for yourself, your coworkers, and your workplace
- **Being reliable** — doing what you said you'd do
- **Communicating clearly** — so people understand your ideas
- **Representing yourself well** — so opportunities come TO you

You can be professional AND be yourself. Code-switching is a skill you probably already have. This program teaches you when and how to use it strategically — for YOUR benefit.

### First Impressions: The 7-Second Rule

Research shows people form a first impression in about 7 seconds. That's not fair, but it's real. Here's what those 7 seconds include:

- **How you look** — clean, put-together, appropriate for the setting
- **How you carry yourself** — eye contact, posture, confidence (even if you're faking it)
- **What you say first** — a clear greeting, your name, a firm handshake

**Real Talk:** What if you can't afford interview clothes?
- Goodwill and thrift stores have professional clothes for $5-10
- Some nonprofits give free interview outfits (ask your school counselor)
- Clean, pressed, and fitting well matters more than brand names
- ThriveUp connects you to local resources through our Community Resource Directory

### Your Turn: Professional Identity Inventory

Open your ThriveUp profile and complete the **Professional Identity Inventory**:
1. List 5 things you do regularly that are actually professional skills
2. For each one, write the "professional name" (babysitting = childcare experience)
3. Rate your confidence in each skill from 1-5

This becomes the foundation of your resume. You're not starting from zero — you're starting from YOU.

### Neighborhood Champion Connection

Your community has people who've walked this path before you. Throughout this program, neighborhood champions — local professionals, business owners, faith leaders, and mentors from YOUR area — will check in with real talk about what the working world is actually like. Not textbook stuff. Real stuff.

### Weekly Live Check-In

Every week, we gather for a live virtual check-in. This is your space to:
- Ask questions you don't want to ask in class
- Hear from a neighborhood champion guest
- Share wins and challenges with your cohort
- Get motivation from people who get it

**First check-in is this week. Don't miss it.**`,
      activityData: JSON.stringify({
        type: "checklist",
        title: "Day 1 Setup Checklist",
        items: [
          { id: "pwa", text: "Download ThriveUp PWA to your phone", points: 20 },
          { id: "profile", text: "Complete your career profile", points: 15 },
          { id: "inventory", text: "List 5 professional skills you already have", points: 15 },
          { id: "name", text: "Write the 'professional name' for each skill", points: 10 },
          { id: "confidence", text: "Rate your confidence 1-5 for each", points: 10 },
        ]
      }),
    },
    {
      id: "wr_m1_lesson_2",
      moduleId: "wr_professional_presence",
      lessonNumber: 2,
      title: "How to Email Your Boss Without Stress",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## Professional Communication — It's Simpler Than You Think

### Jaylen's Story

Jaylen just got hired at H-E-B. His manager, Ms. Rodriguez, sends him a text: "Can you come in Saturday instead of Sunday this week?" Jaylen can't — he has a family thing. How does he respond?

**Option A:** "nah cant do sat" — Unprofessional, no alternative offered
**Option B:** *doesn't respond and just shows up Sunday* — Leaves manager guessing, breaks trust
**Option C:** "Hi Ms. Rodriguez, thank you for asking. I'm not available Saturday but I can work my regular Sunday shift. I can also pick up an extra shift next week if that helps. — Jaylen" — Clear, respectful, shows initiative

Option C isn't fake. It's not "acting." It's clear, respectful, and shows initiative. And it took 30 seconds to type.

### The Email Formula

Every professional email follows the same simple pattern:

**1. Greeting:** "Hi [Name]," or "Good morning [Name],"
**2. Purpose:** One sentence — why are you writing?
**3. Details:** 2-3 sentences max — what do they need to know?
**4. Action:** What happens next? What do you need from them?
**5. Closing:** "Thank you," or "Best," then your name

That's it. Five parts. You can write any professional email with this formula.

### Phone Communication

When you answer a work phone:
- "Good [morning/afternoon], this is [Your Name]. How can I help you?"
- Speak clearly — don't mumble
- Write down names and numbers (don't trust your memory)
- If you don't know the answer: "Let me find out and get back to you" (never guess)

### In-Person Communication

- **Eye contact** — not staring, just connecting. If eye contact is hard for you, look at the bridge of their nose. Nobody can tell the difference.
- **Active listening** — nod, say "I understand," repeat back what they said
- **Ask questions** — it shows you care and helps you get it right the first time
- **"I don't know, but I'll find out"** — the most professional sentence you'll ever learn

### Real Talk: Code-Switching

You probably already switch how you talk depending on who you're with. That's not being fake — that's being smart. You talk differently with your friends than with your grandmother, right? Professional communication is just another setting on the dial. You're not losing who you are. You're adding a tool to your toolkit.

### Your Turn: Write Three Emails

Use the AI Email Coach to write and get feedback on:
1. An email to a manager saying you'll be late tomorrow (with a reason)
2. An email to a coworker asking them to cover your shift
3. A thank-you email after a job interview

The AI will give you real feedback — grammar, tone, professionalism. Practice until it feels natural.

### Video Motivation

Watch this week's motivation video from a neighborhood champion who shares their communication story — the mistakes they made early on and what they wish someone had told them.`,
      activityData: JSON.stringify({
        type: "email_practice",
        title: "Professional Email Workshop",
        scenarios: [
          { id: "late", prompt: "Write an email to your manager explaining you'll be 15 minutes late tomorrow because of a doctor's appointment." },
          { id: "cover", prompt: "Write an email to a coworker asking if they can cover your Saturday shift. Offer to take one of theirs in return." },
          { id: "thanks", prompt: "Write a thank-you email to send after a job interview at Target." },
        ]
      }),
    },
    {
      id: "wr_m1_lesson_3",
      moduleId: "wr_professional_presence",
      lessonNumber: 3,
      title: "AI Mock Interview Lab",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## Your Private Interview Practice Space

Here's the truth about interviews: **they're a skill, not a talent.** Nobody is born good at interviews. You get good by practicing. And most people don't practice because they're scared to mess up in front of someone.

That's why we built the AI Mock Interview Lab. It's private. It's patient. It doesn't judge you. And you can practice as many times as you want until you feel ready.

### Jaylen's Interview Story

Jaylen almost didn't apply to H-E-B because he was terrified of the interview. "What if they ask me something I don't know? What if I freeze up? What if they can tell I'm nervous?"

His older cousin told him: "Everybody's nervous. The people who get hired are the ones who practiced being nervous until it felt normal."

So Jaylen practiced. With the AI. At 11 PM in his room. Twenty times. By the time he sat across from the real interviewer, the questions felt familiar. Not because he memorized answers — because he'd practiced thinking on his feet.

### The Top 10 Interview Questions (And How to Answer Them)

1. **"Tell me about yourself."** — Not your life story. 30 seconds: who you are, what you're good at, why you're here.
2. **"Why do you want to work here?"** — Show you researched the company. Even one specific thing you noticed.
3. **"What are your strengths?"** — Pick one real strength. Give a specific example.
4. **"What's your biggest weakness?"** — Pick something real but not disqualifying. Show you're working on it.
5. **"Tell me about a time you solved a problem."** — Use the STAR method: Situation, Task, Action, Result.
6. **"How do you handle conflict?"** — "I listen first, then try to find a solution that works for everyone."
7. **"Where do you see yourself in 5 years?"** — Show ambition but be realistic. "Growing with this company" works.
8. **"Why should we hire you?"** — Connect your skills to what THEY need.
9. **"Do you have any questions for us?"** — ALWAYS say yes. "What does a typical day look like?" or "What do you enjoy about working here?"
10. **"When can you start?"** — Be honest about your availability.

### Real Talk: Interview Anxiety

- **What if I freeze?** — Say "That's a great question. Let me think about that for a moment." Pausing is professional.
- **What if I don't have experience?** — Talk about school, volunteering, family responsibilities. Your Professional Identity Inventory has real experience.
- **What if I can't afford nice clothes?** — See the resources in Lesson 1. Clean and pressed matters more than brand names.
- **What if they ask about my background?** — You're never required to disclose anything about your family's legal status, criminal history (in most states for minors), or personal life. If it feels illegal, it probably is.

### Your Turn: AI Mock Interview

Launch the AI Mock Interview Lab and complete:
1. A **Starter Interview** — basic questions, gentle feedback (5 minutes)
2. A **Standard Interview** — the full 10 questions with scoring (15 minutes)
3. A **Tough Interview** — curveball questions and pressure scenarios (10 minutes)

After each round, the AI gives you feedback on:
- Content (did you answer the question?)
- Confidence (how did your response sound?)
- Specificity (did you give examples?)
- Areas to practice more

**You can do this at home, on your phone, at midnight. Nobody's watching. Just practice.**`,
      activityData: JSON.stringify({
        type: "mock_interview",
        title: "AI Mock Interview Lab",
        levels: [
          { id: "starter", name: "Starter Interview", questions: 5, difficulty: "easy" },
          { id: "standard", name: "Standard Interview", questions: 10, difficulty: "medium" },
          { id: "tough", name: "Tough Interview", questions: 7, difficulty: "hard" },
        ]
      }),
    },
    {
      id: "wr_m1_lesson_4",
      moduleId: "wr_professional_presence",
      lessonNumber: 4,
      title: "Resume Builder Part 1 — Start From YOU",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## Your Resume Starts Today — And It Starts With What You Already Have

### The Resume Myth

A lot of students think: "I can't write a resume because I don't have any experience." That's a lie the world tells you. Let's fix it right now.

Look at your Professional Identity Inventory from Lesson 1. Those skills? Those experiences? They go on your resume. Here's how:

| What You Call It | What Your Resume Calls It |
|---|---|
| Babysitting | Childcare Provider — Supervised children ages 2-8, managed schedules, prepared meals |
| Helping at church | Volunteer, [Church Name] — Coordinated events, greeted visitors, managed setup/cleanup |
| Translating for family | Bilingual Communication — Provided English-Spanish interpretation for family business and medical appointments |
| Mowing lawns | Independent Lawn Care — Managed client schedules, operated equipment safely, handled payments |
| Helping with family business | Assistant, [Business Name] — Customer service, inventory management, cash handling |
| School club officer | [Title], [Club Name] — Led meetings, organized events, managed team of [X] members |
| Sports team | [Position], [Team] — Demonstrated teamwork, discipline, time management, and performance under pressure |

### Your Resume Sections (Part 1)

Today we build the top of your resume:

**1. Header**
- Your name (make it big and bold)
- Phone number (one that you actually answer)
- Email address (professional — not xXgamer420Xx@gmail.com. If you need to, create a new one: firstname.lastname@gmail.com)
- City, State (you do NOT need your full address)
- LinkedIn (optional but impressive — we'll set this up later)

**2. Objective Statement**
One sentence about who you are and what you're looking for. Examples:
- "Motivated CTE student seeking a part-time position to develop customer service and teamwork skills while contributing to a positive team environment."
- "Hardworking high school junior with experience in food service seeking opportunities in healthcare to explore career interests."

**3. Education**
- Your school name, expected graduation year
- GPA (only if it's 3.0 or above — if not, leave it off)
- Relevant courses (CTE courses, AP classes, anything career-related)
- Honors or awards (if any)

### Real Talk: What If I Have Gaps?

- **No work experience?** Lead with education and skills. Your volunteer work and extracurriculars count.
- **Bad grades?** Don't include GPA. Focus on skills and experience.
- **No references?** Teachers, coaches, church leaders, family friends all count. Ask them FIRST before listing them.
- **No computer to print?** Your school library, public library, or workforce center can print for free. The ThriveUp platform stores your resume digitally so it's always accessible from your phone.

### Your Turn: Build Your Resume Header

Using the ThriveUp Resume Builder:
1. Create your professional email address (if you don't have one)
2. Fill in your header information
3. Write your objective statement (AI will give feedback)
4. Add your education section
5. Save it — this is a living document. We'll add to it every module.

### Ecosystem Connection

Your resume connects to other ThriveUp tools:
- **Career Pathways** — explore industries to tailor your objective
- **Financial Literacy Hub** — understand the earning potential of different career paths
- **Community Resource Directory** — find free professional development resources near you
- **AI Creation Studio** — design a professional portfolio website later in the program`,
      activityData: JSON.stringify({
        type: "resume_builder",
        title: "Resume Builder — Part 1",
        sections: ["header", "objective", "education"],
        milestone: "resume_started"
      }),
    },

    // ===== MODULE 2: WORKPLACE RIGHTS & RESPONSIBILITIES =====
    {
      id: "wr_m2_lesson_1",
      moduleId: "wr_workplace_rights",
      lessonNumber: 1,
      title: "Know Your Rights Before You Clock In",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## Your Rights Are Not Optional

### Aaliyah's Story

Aaliyah is 17 and works at a clothing store in the mall. On her third week, her manager tells her to stay 20 minutes after her shift to fold clothes — off the clock. "It's just 20 minutes," he says. "Everyone does it."

Is that legal? **No.** If you're working, you must be paid. Period. That's federal law.

But here's the problem: Aaliyah doesn't know that. And her manager is counting on it.

**This module exists so that nobody can count on you not knowing your rights.**

### The Big Three Laws You Need to Know

**1. Title VII of the Civil Rights Act (1964)**
- Protects you from discrimination based on race, color, religion, sex, or national origin
- Applies to employers with 15+ employees
- Real example: A manager can't refuse to promote you because of your race or give you worse shifts because of your religion

**2. Americans with Disabilities Act (ADA)**
- Protects people with disabilities from discrimination
- Requires employers to provide "reasonable accommodations"
- Real example: If you have ADHD and need written instructions instead of verbal ones, your employer must try to accommodate that

**3. Age Discrimination in Employment Act (ADEA)**
- Protects workers 40 and older (less relevant to you now, but know it exists)
- You can't be passed over for hiring or promotion just because of age

### What Discrimination Actually Looks Like

It's not always obvious. It's not always someone saying something racist. Sometimes it's:
- Always giving the worst shifts to employees of one race
- Making jokes about someone's accent, hair, or cultural practices
- Asking interview questions about family plans, religion, or national origin
- Paying women less than men for the same work
- Refusing to accommodate a disability when it wouldn't be hard to do so

### Your Rights as a Young Worker

Texas law and federal law give you specific protections:
- **You MUST be paid** for all hours worked (including training)
- **Minimum wage** applies to you ($7.25 federal, but most Austin employers pay $12-15+)
- **Overtime** (1.5x pay) after 40 hours/week
- **Safe working conditions** (more in Module 3)
- **No retaliation** — your employer cannot fire you for reporting a violation
- **Break requirements** — Texas doesn't require breaks for adults, but if your employer gives you a break of 20+ minutes, they must pay you. Breaks under 20 minutes must be paid.

### Real Talk: "But I Need This Job"

We know. Reporting a violation feels risky when you need the paycheck. Here's what to know:
- **Document everything.** Dates, times, what was said, who was there. Write it in your phone notes.
- **You don't have to confront anyone.** You can report anonymously to the EEOC or the Texas Workforce Commission.
- **Retaliation is illegal.** If they fire you for reporting, that's a SECOND violation — and they know it.
- **Free legal help exists.** Texas RioGrande Legal Aid and Lone Star Legal Aid offer free consultations.

### Your Turn: "Is This Discrimination?" Scenarios

Read 8 workplace scenarios and decide: Is this discrimination, harassment, both, or neither? The AI will explain the law behind each one.

### Weekly Check-In Topic

This week's live check-in features a neighborhood champion who works in HR. They'll share real stories about workplace rights violations they've seen — and how young workers can protect themselves.`,
      activityData: JSON.stringify({
        type: "scenario_sort",
        title: "Is This Discrimination?",
        scenarios: [
          { id: "s1", text: "Your manager schedules all Black employees for closing shifts and all white employees for morning shifts.", answer: "discrimination", law: "Title VII" },
          { id: "s2", text: "Your coworker keeps calling you 'amiga' even though you've asked them to stop.", answer: "could_be_harassment", law: "Title VII — hostile work environment" },
          { id: "s3", text: "You're told you can't wear your hijab at work because it 'doesn't match the uniform.'", answer: "discrimination", law: "Title VII — religious discrimination" },
          { id: "s4", text: "Your manager asks you to stay late and doesn't pay you for the extra time.", answer: "wage_violation", law: "Fair Labor Standards Act" },
          { id: "s5", text: "A coworker makes fun of your stutter.", answer: "harassment", law: "ADA — disability harassment" },
          { id: "s6", text: "You don't get the promotion, but neither did anyone else — the company eliminated the position.", answer: "not_discrimination", law: "Business decision, not discrimination" },
          { id: "s7", text: "During your interview, the manager asks 'Do you plan on having kids soon?'", answer: "discrimination", law: "Title VII — sex discrimination" },
          { id: "s8", text: "Your employer requires everyone to speak English while helping customers, but allows other languages on breaks.", answer: "likely_legal", law: "Business necessity exception — generally allowed if applied equally" },
        ]
      }),
    },
    {
      id: "wr_m2_lesson_2",
      moduleId: "wr_workplace_rights",
      lessonNumber: 2,
      title: "Harassment Is Not Part of the Job",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## Nobody Should Dread Going to Work

### The Difference Between Uncomfortable and Illegal

Not everything that makes you uncomfortable at work is harassment. But some of it is. Here's how to tell:

**Harassment is:**
- Unwanted behavior based on your race, sex, religion, disability, or national origin
- Severe enough OR frequent enough to create a "hostile work environment"
- Behavior that a reasonable person would find intimidating, hostile, or offensive

**Examples of harassment:**
- Repeated sexual comments, jokes, or gestures
- Showing inappropriate images at work
- Touching you without permission
- Racial slurs or "jokes" — even if they say "I'm just playing"
- Mocking someone's disability, accent, or religion
- Threatening your job if you don't go along with it

**Not harassment (even though it's unpleasant):**
- A tough boss who holds everyone to high standards equally
- Being asked to redo work that wasn't done right
- A coworker who's just unfriendly to everyone
- Constructive criticism about your performance

### What to Do If It Happens to You

**Step 1: Say something (if you feel safe)**
"Please don't say that" or "That makes me uncomfortable" — clear and direct.

**Step 2: Document it**
Write down: What happened, when, where, who was there, exact words used. Save texts or screenshots.

**Step 3: Report it**
Tell your supervisor (unless they're the problem). If they are, go to HR, a district manager, or the company's ethics hotline.

**Step 4: File externally if needed**
EEOC (federal): eeoc.gov | Texas Workforce Commission Civil Rights Division

### Bystander Intervention: What If You See It Happening to Someone Else?

You don't have to be a hero. But you can be an ally. The 5 D's:
- **Distract** — interrupt the situation. "Hey, can you help me with something?"
- **Delegate** — get someone with more authority. "I think you should talk to the manager about what's happening."
- **Document** — record or write down what you see (for the person being harassed, not social media)
- **Delay** — check in with the person afterward. "Are you okay? I saw what happened."
- **Direct** — speak up if it's safe. "That's not okay."

### Your Turn: Bystander Practice

Role-play 5 scenarios with the AI companion. Practice using each of the 5 D's. The AI plays the harasser, the victim, or a coworker — and you practice responding.

### Ecosystem Connection

If you or someone you know is dealing with harassment or an unsafe situation:
- **SafeReport** — ThriveUp's confidential incident reporting tool
- **Community Resource Directory** — local legal aid and advocacy organizations
- **LifeBridge** — benefits navigation including victim services`,
      activityData: JSON.stringify({
        type: "role_play",
        title: "Bystander Intervention Practice",
        scenarios: [
          { id: "b1", situation: "A coworker keeps making comments about another coworker's weight.", technique: "direct" },
          { id: "b2", situation: "Your manager is yelling at a new employee in front of customers.", technique: "delegate" },
          { id: "b3", situation: "Someone is showing inappropriate images on their phone to uncomfortable coworkers.", technique: "distract" },
          { id: "b4", situation: "You overheard a racial slur directed at a coworker but the moment passed.", technique: "delay" },
          { id: "b5", situation: "A customer is aggressively harassing a cashier.", technique: "delegate" },
        ]
      }),
    },
    {
      id: "wr_m2_lesson_3",
      moduleId: "wr_workplace_rights",
      lessonNumber: 3,
      title: "Your Digital Rights at Work",
      durationMinutes: 35,
      activityType: "exploration",
      content: `## Your Phone, Your Social Media, Your Privacy — At Work

### What Your Employer Can and Can't Do

**They CAN:**
- Monitor your work email and work computer
- Have policies about phone use during work hours
- Check your public social media posts
- Drug test you (with notice, in most cases)
- Use security cameras in work areas (not bathrooms or changing rooms)

**They CAN'T:**
- Read your personal texts or emails on your personal phone
- Require you to give them your social media passwords (illegal in some states)
- Record you in private spaces
- Fire you for discussing wages with coworkers (that's protected by the NLRA)
- Fire you for social media posts about unsafe working conditions

### Social Media and Your Career

**The reality:** Employers Google you. They look at your Instagram, TikTok, and Twitter. A 2025 survey found that 70% of employers check candidates' social media before hiring.

**What gets you rejected:**
- Posts about illegal drug use
- Racist, sexist, or violent content
- Badmouthing a previous employer
- Posting confidential work information

**What helps you get hired:**
- A professional LinkedIn profile (even a basic one)
- Posts showing community involvement, volunteering, or achievements
- Evidence of passion for your field (sharing articles, projects, certifications)
- A consistent, professional digital presence

**Pro tip:** Google yourself right now. What comes up? That's what employers see.

### Your Turn: Digital Presence Audit

1. Google your name — screenshot what comes up
2. Review your most recent 10 social media posts — would an employer have a problem with any of them?
3. Set up or update a basic LinkedIn profile using the AI assistant
4. Adjust your privacy settings on personal accounts

### Ecosystem Connection
- **AI Creation Studio** — build a professional portfolio site
- **Career Pathways** — research employers in your target industry`,
      activityData: JSON.stringify({
        type: "audit",
        title: "Digital Presence Audit",
        steps: [
          { id: "google", text: "Google your name and note what appears" },
          { id: "review", text: "Review your last 10 social media posts for professionalism" },
          { id: "linkedin", text: "Create or update a basic LinkedIn profile" },
          { id: "privacy", text: "Adjust privacy settings on personal accounts" },
        ]
      }),
    },
    {
      id: "wr_m2_lesson_4",
      moduleId: "wr_workplace_rights",
      lessonNumber: 4,
      title: "Resume Builder Part 2 — Your Skills Tell a Story",
      durationMinutes: 35,
      activityType: "interactive",
      content: `## Adding Your Skills Section

Now that you understand workplace rights and professional communication, you have NEW skills to add to your resume. Let's build your Skills section.

### Types of Skills Employers Want

**Hard Skills** — things you can demonstrate:
- Bilingual (English/Spanish)
- Microsoft Office / Google Workspace
- Cash register / POS systems
- Food handling certification
- CPR/First Aid certified
- Social media management
- Basic coding or website building

**Soft Skills** — how you work with people:
- Customer service
- Teamwork and collaboration
- Conflict resolution
- Time management
- Adaptability
- Bilingual communication
- Leadership

### How to Write Skills on Your Resume

Don't just list words. Connect them to evidence:

Bad: "Good communicator"
Better: "Professional written and verbal communication — experienced in customer-facing roles and formal email correspondence"

Bad: "Teamwork"
Better: "Collaborative team member — coordinated group projects in CTE classes and organized church volunteer events"

### What You Learned in This Module Goes on Your Resume

From Modules 1 and 2, you can now legitimately add:
- Professional email and phone communication
- Understanding of workplace rights (Title VII, ADA, FLSA)
- Harassment recognition and bystander intervention
- Digital professionalism and social media management
- Interview preparation

These are REAL skills that REAL employers value.

### Your Turn: Build Your Skills Section

1. Open your resume in the ThriveUp Resume Builder
2. Add a "Skills" section below your education
3. List at least 6 skills — mix hard and soft
4. For each skill, write one line connecting it to evidence
5. Save and review with the AI for feedback`,
      activityData: JSON.stringify({
        type: "resume_builder",
        title: "Resume Builder — Part 2",
        sections: ["skills"],
        milestone: "resume_skills_added"
      }),
    },

    // ===== MODULE 3: WORKPLACE SAFETY =====
    {
      id: "wr_m3_lesson_1",
      moduleId: "wr_workplace_safety",
      lessonNumber: 1,
      title: "They Can't Make You Do That — Your Safety Rights",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## Marcus's Story

Marcus is 16 and works at a warehouse on weekends. Good money — $14/hour. His supervisor, Rick, tells him to climb a ladder to stack heavy boxes on a high shelf. The ladder is missing a rung and wobbles.

"Just be careful," Rick says. "We need those boxes up there before the truck comes."

Marcus looks at the ladder. He looks at the boxes. He looks at Rick.

**What should Marcus do?**

He should say: "I'm not comfortable doing that. The ladder isn't safe. Can we find another way to get the boxes up, or fix the ladder first?"

And here's the thing Rick doesn't want Marcus to know: **Marcus has the legal right to refuse.**

### OSHA: Your Safety Guardian

OSHA stands for the **Occupational Safety and Health Administration**. They exist for one reason: to make sure you go home in the same condition you came to work.

**Your OSHA rights:**
- A safe workplace free from serious hazards
- Training about workplace dangers (in a language you understand)
- Access to safety records and injury logs
- The right to report unsafe conditions WITHOUT retaliation
- The right to **refuse dangerous work** if you believe there's an immediate threat to your life

**How to report:** Call OSHA at 1-800-321-OSHA (6742) or file online at osha.gov. You can report anonymously.

### Common Hazards by Industry

**Retail (Target, Walmart, H-E-B):**
- Slip and fall hazards (wet floors, cluttered aisles)
- Lifting injuries (heavy boxes, poor technique)
- Repetitive strain (scanning, stocking)
- Customer aggression

**Food Service (Chick-fil-A, McDonald's, restaurants):**
- Burns (grills, fryers, hot surfaces)
- Cuts (knives, slicers, broken glass)
- Slip hazards (grease, water on kitchen floors)
- Chemical exposure (cleaning products)

**Warehouse/Logistics (Amazon, UPS):**
- Forklift injuries
- Falling objects
- Repetitive strain and back injuries
- Heat stress (non-climate-controlled facilities)

**Construction/Trades:**
- Falls from heights
- Electrical hazards
- Power tool injuries
- Hearing damage

### Real Talk: "But I'm New — I Can't Say No to My Boss"

Yes you can. And here's why: if you get hurt because of an unsafe condition your employer knew about, THEY are liable. Most supervisors will respect you MORE for speaking up — it protects them too.

If they retaliate against you for raising a safety concern, that's a federal violation. Document it, report it, and know that the law is on your side.

### Your Turn: Hazard Hunt

Look at 5 workplace photos and identify:
1. All the hazards you can find
2. What injury could happen
3. How to fix it
4. Whether this is an OSHA violation`,
      activityData: JSON.stringify({
        type: "hazard_hunt",
        title: "Workplace Hazard Identification",
        industries: ["retail", "food_service", "warehouse", "construction", "office"]
      }),
    },
    {
      id: "wr_m3_lesson_2",
      moduleId: "wr_workplace_safety",
      lessonNumber: 2,
      title: "PPE, Chemicals & Protecting Your Body",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## Your Body Is Your Most Important Tool

### Personal Protective Equipment (PPE)

PPE is any equipment you wear to protect yourself from workplace hazards. Your employer is REQUIRED to provide it for free. You should never have to buy your own safety equipment for a job.

**Common PPE by job:**

| Equipment | When You Need It |
|---|---|
| Safety glasses/goggles | Construction, manufacturing, lab work, some cleaning tasks |
| Gloves | Food handling, cleaning with chemicals, construction, healthcare |
| Non-slip shoes | Kitchens, warehouses, retail (spill-prone areas) |
| Hard hat | Construction, warehouse (falling object risk) |
| Hearing protection | Manufacturing, construction, loud equipment |
| Back brace/support | Heavy lifting jobs |
| Face mask/respirator | Chemical cleaning, painting, dusty environments |
| High-visibility vest | Warehouse, construction, night/outdoor work |

### How to Lift Safely

Back injuries are the #1 workplace injury for young workers. Here's the right way:

1. **Get close** to the object — don't reach
2. **Bend your knees**, not your back
3. **Grip firmly** with both hands
4. **Lift with your legs** — keep your back straight
5. **Don't twist** — move your feet to turn
6. **Know your limits** — if it's too heavy, get help. That's not weakness, that's smart.

### Chemical Safety (GHS Labels)

If you work with any cleaning products, you need to know:
- **SDS (Safety Data Sheets)** — your employer must keep these available for every chemical in the workplace. They tell you what's in it, what it can do to you, and what to do if something goes wrong.
- **Never mix chemicals** — especially bleach + ammonia (creates toxic gas)
- **Always read the label** before using any cleaning product
- **Ventilation** — open windows/doors when using strong chemicals

### Your Turn: PPE Matching Challenge

Match the correct PPE to each workplace scenario. The AI will explain why each answer is correct and what could happen without proper protection.

### Ecosystem Connection
- **PillScheduler** — track any medications that might interact with workplace chemicals
- **Sankofa Health Network** — connect with local health resources if you've been exposed to workplace hazards`,
      activityData: JSON.stringify({
        type: "matching",
        title: "PPE Matching Challenge",
        pairs: [
          { scenario: "Working the fryer at McDonald's", ppe: "Non-slip shoes, heat-resistant gloves, apron" },
          { scenario: "Stacking boxes at an Amazon warehouse", ppe: "Steel-toe boots, back brace, high-vis vest" },
          { scenario: "Cleaning bathrooms at a hotel", ppe: "Rubber gloves, safety glasses, face mask" },
          { scenario: "Construction site helper", ppe: "Hard hat, safety glasses, steel-toe boots, high-vis vest" },
          { scenario: "Working at a lawn care company", ppe: "Safety glasses, hearing protection, gloves, sun protection" },
        ]
      }),
    },
    {
      id: "wr_m3_lesson_3",
      moduleId: "wr_workplace_safety",
      lessonNumber: 3,
      title: "Emergency Response — Know Before You Need It",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## When Something Goes Wrong

You never think an emergency will happen at YOUR workplace. Until it does. The difference between a crisis and a catastrophe is preparation.

### Fire Emergency

**If you discover a fire:**
1. **Pull the fire alarm** (if there is one)
2. **Alert people nearby** — "FIRE! Everyone out!"
3. **Exit immediately** — use the nearest EXIT, not the elevator
4. **Close doors behind you** (slows the fire)
5. **Call 911** once you're outside
6. **Go to the meeting point** — don't go back inside for anything

**Know BEFORE an emergency:** Where are the exits? Where is the fire extinguisher? Where is the meeting point?

### Medical Emergency

**If someone is injured:**
1. **Don't panic.** Take a breath.
2. **Call 911** (or have someone call while you help)
3. **Don't move them** unless they're in immediate danger
4. **Apply pressure** to bleeding wounds with a clean cloth
5. **Stay with them** and keep them calm until help arrives

**Burns:** Run cool (not cold) water over the burn for at least 10 minutes. Don't apply ice, butter, or ointment.

### Active Threat

**Run. Hide. Fight.** In that order.
- **Run** — if you can get out safely, go. Don't wait for others to decide. Leave your stuff.
- **Hide** — if you can't run, find a room with a lockable door. Turn off lights. Silence your phone. Stay quiet.
- **Fight** — only as an absolute last resort. Use anything available. Commit fully.

Call 911 as soon as it's safe.

### Incident Reporting

After ANY workplace incident (even minor ones), you should:
1. Report it to your supervisor immediately
2. Write down exactly what happened while it's fresh
3. Include: date, time, location, what happened, injuries, witnesses
4. Get a copy of any incident report you sign
5. Take photos if relevant

### Your Turn: Emergency Scenario Walkthroughs

Walk through 3 emergency scenarios with the AI. You make decisions at each step. The AI shows you the consequences of each choice and teaches the correct procedure.

### Video: How to Do the Heimlich Maneuver

Watch the demonstration video and practice the hand positioning (on a pillow, not a person).`,
      activityData: JSON.stringify({
        type: "scenario_walkthrough",
        title: "Emergency Response Scenarios",
        scenarios: [
          { id: "fire", title: "Kitchen Fire at Work", steps: 6 },
          { id: "injury", title: "Coworker Falls Off a Ladder", steps: 5 },
          { id: "medical", title: "Customer Has a Seizure", steps: 5 },
        ]
      }),
    },
    {
      id: "wr_m3_lesson_4",
      moduleId: "wr_workplace_safety",
      lessonNumber: 4,
      title: "Resume Builder Part 3 — Certifications That Matter",
      durationMinutes: 35,
      activityType: "interactive",
      content: `## Your Certifications & Training Section

Completing this module means you now have REAL training to put on your resume. Let's add it.

### What Counts as a Certification?

- **ThriveUp Workforce Readiness Certificate** (when you complete all 5 modules)
- **OSHA 10-Hour General Industry** (available free online — we'll show you how)
- **Food Handler's Permit** (required for food service in Texas — $7-15 online)
- **CPR/First Aid** (American Red Cross or American Heart Association)
- **TABC Certification** (if you plan to work where alcohol is served, 18+)
- **Any school-issued CTE certifications**

### Free Certifications You Can Get RIGHT NOW

| Certification | Where | Cost | Time |
|---|---|---|---|
| OSHA 10-Hour | oshaeducationcenter.com | Free for students | 10 hours |
| Texas Food Handler | statefoodsafety.com/texas | $7.99 | 2 hours |
| Google Digital Garage | grow.google | Free | 40 hours |
| Microsoft Office Specialist prep | linkedin.com/learning | Free with library card | Self-paced |

**Pro tip:** Getting even ONE certification before your first interview sets you apart from 90% of other applicants your age.

### How to List Certifications on Your Resume

**Certifications & Training**
- ThriveUp Workforce Readiness Certificate — The Collaborative Advocate, 2026
- OSHA 10-Hour General Industry Safety — OSHA Education Center, 2026
- Texas Food Handler Certification — Texas DSHS, 2026
- Workplace Hazard Identification Training — ThriveUp Academy, 2026
- Emergency Response Procedures — ThriveUp Academy, 2026

### Your Turn

1. Add a "Certifications & Training" section to your resume
2. Include the training you've completed so far in this program
3. Pick ONE free certification from the list above and start it this week
4. Set a calendar reminder to complete it within 2 weeks

### Ecosystem Connection
- **Career Pathways** — see which certifications are most valued in your target industry
- **Apprenticeship Tracker** — explore registered apprenticeships that build on these certifications`,
      activityData: JSON.stringify({
        type: "resume_builder",
        title: "Resume Builder — Part 3",
        sections: ["certifications"],
        milestone: "resume_certifications_added"
      }),
    },

    // ===== MODULE 4: TIME & PRIORITY MANAGEMENT =====
    {
      id: "wr_m4_lesson_1",
      moduleId: "wr_time_management",
      lessonNumber: 1,
      title: "Where Does Your Time Actually Go?",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## Sofia's Story

Sofia is 17. Here's her typical Monday:
- 6:30 AM — Wake up, get her little brother ready for school
- 7:15 AM — Bus to school
- 7:45 AM - 3:15 PM — School (AP US History, CTE Health Science, Spanish 3)
- 3:30 PM — Pick up her brother from aftercare
- 4:00 PM — Help brother with homework, make him a snack
- 4:30 PM — Start on her own homework (if she has time)
- 5:30 PM — Drive to Chick-fil-A for her 6 PM shift
- 6:00 PM - 10:00 PM — Work
- 10:30 PM — Get home, eat something, shower
- 11:00 PM — Try to do homework. Fall asleep with the book on her face.

Sofia is exhausted. Her grades are slipping. She feels like she's failing at everything.

**Sound familiar?**

Here's the truth: Sofia doesn't have a time management problem. She has a **boundary** problem and a **prioritization** problem. She's trying to do everything at 100% and there aren't enough hours in the day.

### The Time Audit

Before you can manage your time, you need to see where it actually goes. Most people are surprised.

**Your Turn — Map Your Actual Week:**
For the next 3 days, track everything you do in 30-minute blocks. Don't change your behavior — just observe.

You'll probably find:
- 1-3 hours/day on social media (not judging — just noticing)
- "Dead time" between activities where you scroll or zone out
- Tasks that take longer than they should because of distractions
- Time commitments you didn't choose (family responsibilities, commuting)

### The Eisenhower Matrix

President Eisenhower said: "What is important is seldom urgent, and what is urgent is seldom important."

| | URGENT | NOT URGENT |
|---|---|---|
| **IMPORTANT** | DO IT NOW (homework due tomorrow, work shift starts in 1 hour) | SCHEDULE IT (studying for next week's test, working on resume, exercise) |
| **NOT IMPORTANT** | DELEGATE or LIMIT (responding to group chat, social media drama) | ELIMINATE (scrolling TikTok for 2 hours, drama that isn't yours) |

The magic is in the **Important but Not Urgent** box. That's where your future lives — career planning, skill building, health, relationships. But it keeps getting pushed out by urgent stuff.

### Real Talk: "I Don't Have Time"

If you have family responsibilities that eat your time — caring for siblings, translating for parents, working to help pay bills — that's REAL. This program isn't going to pretend that everyone has the same 24 hours. They don't.

But even with heavy responsibilities, there's usually 30-60 minutes of recoverable time per day. We're going to find those minutes and make them count for YOUR goals.

### Your Turn: Build Your Eisenhower Matrix

1. List 15 things you do in a typical week
2. Place each one in the correct quadrant
3. Identify your top 3 "Important but Not Urgent" items — these are your growth activities
4. Identify 2 things you can reduce or eliminate
5. The AI will help you build a realistic plan

### Weekly Check-In

This week's live check-in: a neighborhood champion shares how they balance work, family, school (or how they did when they were your age). Real talk about what they sacrificed, what they protected, and what they wish they'd done differently.`,
      activityData: JSON.stringify({
        type: "eisenhower_matrix",
        title: "Build Your Eisenhower Matrix",
        quadrants: ["do_now", "schedule", "delegate", "eliminate"]
      }),
    },
    {
      id: "wr_m4_lesson_2",
      moduleId: "wr_time_management",
      lessonNumber: 2,
      title: "Digital Calendar Mastery",
      durationMinutes: 35,
      activityType: "interactive",
      content: `## Your Calendar Is Your Career's Best Friend

### Why a Digital Calendar Changes Everything

Your brain is terrible at remembering appointments, deadlines, and commitments. That's not a weakness — that's biology. Your brain is built for creative thinking, not storage. Let your phone do the storage.

A digital calendar (Google Calendar, Apple Calendar, Outlook) gives you:
- **Reminders** — never forget a shift, assignment, or appointment
- **Visibility** — see your whole week at a glance
- **Conflict detection** — spot scheduling problems before they happen
- **Recurring events** — set it once, it repeats forever
- **Sharing** — let your manager see your availability

### How to Set Up Your Calendar

**Step 1:** Color-code your life
- Red = Work shifts
- Blue = School/classes
- Green = Personal/family
- Yellow = Career development (resume work, certifications, ThriveUp lessons)
- Gray = Non-negotiable (appointments, deadlines)

**Step 2:** Block your fixed commitments first
School hours, work shifts, family responsibilities — these go in first because they're non-negotiable.

**Step 3:** Block your growth time
Look at the gaps. Find 30-60 minutes, 3-4 days a week, for career development. Block it like an appointment. If it's not on the calendar, it doesn't exist.

**Step 4:** Set reminders
- 1 day before important deadlines
- 1 hour before interviews or meetings
- 15 minutes before work shifts (so you arrive early)

### Pro Tips From People Who've Made It

- **Never say "I'll remember."** Put it in the calendar immediately.
- **Check your calendar every morning.** 60 seconds. Know what's coming.
- **Say "let me check my calendar" before committing.** This is the most professional thing you can do.
- **Block "buffer time" between activities.** You can't teleport. Travel time is real.

### Your Turn: Build Your First Professional Calendar

1. Set up a digital calendar (if you don't have one)
2. Color-code with the system above
3. Block your next 2 weeks — all fixed commitments
4. Find and block at least 3 career development sessions (30 min each)
5. Set reminders for everything
6. Screenshot your finished calendar — this is proof of a professional skill`,
      activityData: JSON.stringify({
        type: "calendar_builder",
        title: "Digital Calendar Setup",
        steps: [
          { id: "colors", text: "Set up color-coding system" },
          { id: "fixed", text: "Block all fixed commitments for 2 weeks" },
          { id: "growth", text: "Schedule 3+ career development sessions" },
          { id: "reminders", text: "Set reminders for all commitments" },
        ]
      }),
    },
    {
      id: "wr_m4_lesson_3",
      moduleId: "wr_time_management",
      lessonNumber: 3,
      title: "SMART Goals — Make Your Future Specific",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## The Difference Between a Dream and a Plan

"I want to be successful" is a dream.
"I will earn my Food Handler's Permit by April 30 by studying 20 minutes a day on the ThriveUp app" is a plan.

Dreams are nice. Plans get things done.

### SMART Goals

| Letter | Means | Example |
|---|---|---|
| **S** — Specific | What exactly will you do? | "Complete the OSHA 10-Hour certification" |
| **M** — Measurable | How will you know it's done? | "Certificate of completion downloaded" |
| **A** — Achievable | Can you actually do this? | "Yes — it's free and online, 1 hour/day for 10 days" |
| **R** — Relevant | Does this matter for your goals? | "Yes — required for warehouse and construction jobs" |
| **T** — Time-bound | When will it be done? | "By May 15, 2026" |

### Breaking Big Goals Into Weekly Milestones

**Big goal:** Get hired at a healthcare facility by August
**Weekly milestones:**
- Week 1: Complete Food Handler's Permit
- Week 2: Update resume with certification
- Week 3: Research 5 healthcare facilities in Austin that hire high school students
- Week 4: Apply to all 5
- Week 5: Practice interviews using AI Mock Interview Lab
- Week 6: Follow up on applications

Each week has ONE clear action. Not overwhelming. Just the next step.

### Accountability: The Secret Ingredient

Goals you tell someone about are 65% more likely to happen. Goals with a specific accountability partner are 95% more likely.

**Your accountability options:**
- Your ThriveUp cohort (weekly check-ins)
- A neighborhood champion mentor
- The AI companion (it'll check on your progress)
- A friend who's also in the program

### Your Turn: Set Your First Career SMART Goal

1. Choose ONE career goal for the next 30 days
2. Run it through the SMART framework (AI helps you tighten it)
3. Break it into 4 weekly milestones
4. Choose an accountability partner
5. Add all milestones to your digital calendar with reminders

### Ecosystem Connection
- **Career Pathways** — explore careers and salary data to set informed goals
- **Financial Literacy Hub** — calculate what your target salary means for your actual life
- **Neighborhood Intelligence** — understand your local job market and opportunities`,
      activityData: JSON.stringify({
        type: "goal_builder",
        title: "SMART Goal Workshop",
        fields: ["specific", "measurable", "achievable", "relevant", "timebound", "milestones", "accountability"]
      }),
    },
    {
      id: "wr_m4_lesson_4",
      moduleId: "wr_time_management",
      lessonNumber: 4,
      title: "Resume Builder Part 4 — Show What You've Done",
      durationMinutes: 35,
      activityType: "interactive",
      content: `## Projects & Accomplishments — Proof That You Can Deliver

### Why This Section Matters

Skills tell an employer what you CAN do. Projects and accomplishments tell them what you HAVE done. This is the section that makes employers say, "Let's interview this person."

### What Counts as a Project or Accomplishment?

- Organized a school club event (how many people attended?)
- Led a group project in class (what was the result?)
- Raised money for a cause (how much? for what?)
- Built something (website, app, garden, business)
- Won a competition or award
- Completed a certification or training program
- Improved something measurable

### How to Write Accomplishments (The XYZ Formula)

Google uses this formula for resumes. You should too:

**"Accomplished [X] as measured by [Y] by doing [Z]"**

Examples:
- "Organized a school fundraiser that raised $1,200 for the food bank by coordinating a team of 8 student volunteers"
- "Increased church youth group attendance by 40% by creating a social media campaign and personal outreach plan"
- "Completed ThriveUp Workforce Readiness Academy (15-week TEKS-aligned employability skills program) with 90%+ assessment scores"
- "Managed weekly schedule balancing AP coursework, part-time employment, and family responsibilities while maintaining a 3.2 GPA"

### Real Talk: "But I Haven't Done Anything Special"

Yes you have. You just haven't named it yet. Let's try:

| What You Think | What It Actually Is |
|---|---|
| "I just help my mom's friend with her kids" | "Provided reliable childcare services for family network, managing 3 children ages 4-9" |
| "I made some TikToks that got views" | "Created social media content achieving [X] views, demonstrating digital marketing and audience engagement skills" |
| "I organized rides for my friends" | "Coordinated transportation logistics for peer group events, demonstrating planning and communication skills" |
| "I took this workforce readiness course" | "Completed 15-week TEKS-aligned Workforce Readiness Academy covering professional conduct, workplace rights, safety, time management, and career leadership" |

### Your Turn: Add Projects & Accomplishments

1. List 3-5 things you've done that you're proud of (any area of life)
2. Rewrite each using the XYZ formula
3. Add them to your resume in a "Projects & Accomplishments" section
4. AI reviews and suggests improvements`,
      activityData: JSON.stringify({
        type: "resume_builder",
        title: "Resume Builder — Part 4",
        sections: ["projects_accomplishments"],
        milestone: "resume_accomplishments_added"
      }),
    },

    // ===== MODULE 5: WORK ETHIC & CAREER LEADERSHIP =====
    {
      id: "wr_m5_lesson_1",
      moduleId: "wr_work_ethic_leadership",
      lessonNumber: 1,
      title: "What Work Ethic Really Means",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## DeAndre's Story

DeAndre is 18. He's worked at the same auto parts store for a year. He shows up on time, does his job, and goes home. He's fine. But "fine" isn't getting him anywhere.

Then a new kid starts — 16 years old, first job. And DeAndre's manager asks HIM to train the new kid. "Why me?" DeAndre asks. His manager says: "Because you're the one I trust."

That's when DeAndre realizes: he has a reputation. And it's a good one. Not because he's flashy or the best salesperson — because he's RELIABLE. Every day. No drama. No excuses. Just shows up and does the work.

**That's work ethic. And it's the skill that gets you promoted.**

### The Four Pillars of Work Ethic

**1. Punctuality** — Being on time means being early. If your shift starts at 6, you're there at 5:50. Ready to go. Not walking in the door at 6:01 with a coffee in your hand.

Why it matters: Being late tells your employer, "My time is more important than yours." Even if that's not what you mean, that's what they hear.

**2. Dependability** — Can people count on you? If you say you'll do something, do you do it? If you're scheduled, do you show up?

The test: If your manager needed someone for an important task and had to choose between you and someone else — would they choose you? Why or why not?

**3. Reliability** — Consistency over time. Anyone can have a good day. Work ethic is having a good day EVERY day. Even when you're tired. Even when it's boring. Even when nobody's watching.

**4. Responsibility** — Owning your work. If you made a mistake, say "I made a mistake and here's how I'll fix it." Don't blame others, don't make excuses, don't hide.

### Work Ethic Self-Assessment

Be honest with yourself (this is private — nobody sees it but you):

Rate yourself 1-5 on each:
- I arrive on time (or early) to commitments
- People can count on me to follow through
- I'm consistent — I don't just show up when I feel like it
- I own my mistakes instead of making excuses
- I give full effort even when the task is boring
- I'm respectful to everyone, not just people I like
- I keep my phone away when I should be focused

Your score isn't a grade — it's a starting point. If you scored yourself low on something, that's an area to grow. The fact that you're honest about it already puts you ahead.

### Your Turn

1. Complete the work ethic self-assessment
2. Identify your strongest pillar and your growth area
3. Write one specific commitment for the next 2 weeks
4. Share your commitment in the weekly check-in (optional but powerful)

### Weekly Check-In

This week's neighborhood champion: someone who started in a job similar to yours and built a career through work ethic. Not college degrees. Not connections. Just showing up and being excellent, every day.`,
      activityData: JSON.stringify({
        type: "self_assessment",
        title: "Work Ethic Self-Assessment",
        categories: ["punctuality", "dependability", "reliability", "responsibility", "effort", "respect", "focus"],
        scale: 5
      }),
    },
    {
      id: "wr_m5_lesson_2",
      moduleId: "wr_work_ethic_leadership",
      lessonNumber: 2,
      title: "How Organizations Really Work",
      durationMinutes: 35,
      activityType: "exploration",
      content: `## Understanding the Game So You Can Win It

### What Is Meritocracy?

Meritocracy means: you advance based on your skills, effort, and results — not who you know, what you look like, or where you come from.

**The honest truth:** Pure meritocracy is the IDEAL, not always the reality. Bias exists. Discrimination happens. We covered that in Module 2.

But here's what's also true: **work ethic and skill are the things YOU can control.** You can't control other people's biases. But you can make yourself so good that saying no to you costs THEM.

### How Organizations Are Structured

Most businesses have a hierarchy. Understanding it helps you navigate it.

**Entry Level** — Where most of us start. Learn the job, prove yourself, build trust.

**Team Lead / Shift Lead** — First step up. You're still doing the work, but now you're also helping organize others.

**Supervisor / Manager** — You're responsible for a team's performance. More meetings, less hands-on work.

**Director / Regional Manager** — You manage managers. You set strategy for your area.

**VP / Executive** — Big picture decisions. Company-wide strategy.

**CEO / Owner** — The top. Where Dr. Flood sits at The Collaborative Advocate.

### How People Actually Get Promoted

Here's what actually moves you up (from real managers):
1. **Do your current job excellently** — not just adequately
2. **Solve problems without being asked** — see something broken? Fix it.
3. **Be easy to work with** — drama-free, positive, team-oriented
4. **Make your manager's job easier** — the fastest path to promotion
5. **Ask for more responsibility** — "I've got my tasks handled. What else can I help with?"
6. **Learn the next job** — watch what your supervisor does. Ask questions. Be ready.

### Equal Opportunity: Know the Law AND the Reality

**Equal Employment Opportunity** means employers cannot discriminate based on race, color, religion, sex, national origin, age, disability, or genetic information.

Every employer with 15+ employees must follow these laws. They must post EEO notices. They must have complaint procedures.

**If you believe you've been passed over unfairly:** Document everything. File with the EEOC. Use the tools from Module 2.

**AND:** Keep being excellent. Build your skills. Network. Make yourself undeniable.

### Your Turn: Org Chart Builder

1. Pick a company you'd like to work for (or one you work at now)
2. Research their organizational structure
3. Build a simple org chart showing the path from entry level to leadership
4. Identify the skills needed at each level
5. Mark where YOU are now and where you want to be in 5 years`,
      activityData: JSON.stringify({
        type: "org_chart",
        title: "Build an Organizational Chart",
        levels: ["entry", "team_lead", "supervisor", "manager", "director", "executive"]
      }),
    },
    {
      id: "wr_m5_lesson_3",
      moduleId: "wr_work_ethic_leadership",
      lessonNumber: 3,
      title: "Managers vs. Leaders — Be Both",
      durationMinutes: 40,
      activityType: "interactive",
      content: `## The Difference That Changes Everything

### Manager vs. Leader

| Manager | Leader |
|---|---|
| Tells people what to do | Shows people how and why |
| Focuses on tasks | Focuses on people |
| Maintains the system | Improves the system |
| Has authority from a title | Has authority from trust |
| "Get it done" | "Let's figure this out together" |
| Creates compliance | Creates commitment |

**The best bosses are BOTH.** They manage tasks AND lead people. You don't need a title to start being a leader. DeAndre proved that — he led by being reliable, helpful, and trustworthy.

### Leadership Styles

**Servant Leader** — Leads by serving others first. "How can I help you succeed?"
- Best for: teams that need support and trust-building

**Transformational Leader** — Inspires people to see a bigger vision. "Here's where we're going and why it matters."
- Best for: organizations going through change

**Democratic Leader** — Includes the team in decisions. "What do you all think?"
- Best for: creative teams, problem-solving

**Coaching Leader** — Develops people's potential. "Let me show you, then you try."
- Best for: training environments, mentorship

### Your Leadership Style

There's no "right" style. The best leaders adapt. But you probably have a natural tendency. Understanding it helps you lean into your strengths.

### The Leadership Actions That Anyone Can Take (No Title Required)

1. **Help the new person** — remember how lost you felt on day one? Be the person who makes it better.
2. **Speak up in meetings** — your ideas matter even if you're the youngest person in the room.
3. **Give credit** — "Maria actually came up with that idea." People never forget when you lift them up.
4. **Take initiative** — don't wait to be told. If the trash is full, take it out.
5. **Stay positive** — not fake-positive. Real-positive. "This is tough, but we've got it."

### Your Turn: Leadership Style Assessment

1. Take the leadership style quiz (AI-powered, 15 questions)
2. Get your primary and secondary leadership styles
3. Read about a real leader who shares your style
4. Write a "Leadership Pledge" — one way you'll lead THIS WEEK, with no title required

### Video Motivation

This week: a neighborhood champion who started as the youngest person on their team and became a leader. How they did it. What they learned. What they'd tell you.`,
      activityData: JSON.stringify({
        type: "leadership_assessment",
        title: "Leadership Style Quiz",
        styles: ["servant", "transformational", "democratic", "coaching"],
        questions: 15
      }),
    },
    {
      id: "wr_m5_lesson_4",
      moduleId: "wr_work_ethic_leadership",
      lessonNumber: 4,
      title: "Resume Builder Part 5 — Your Career Passport Is Complete",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## The Final Polish — Your Resume Is Your Career Passport

You've been building this for 15 weeks. Module by module. Section by section. And now it's time to bring it all together into a document that opens doors.

### Your Complete Resume Should Now Have:

1. **Header** — name, contact info, professional email (Module 1)
2. **Objective Statement** — who you are and what you're looking for (Module 1)
3. **Education** — school, graduation year, relevant courses (Module 1)
4. **Skills** — hard and soft skills with evidence (Module 2)
5. **Certifications & Training** — OSHA, food handler, ThriveUp certificate (Module 3)
6. **Projects & Accomplishments** — XYZ formula, quantified results (Module 4)
7. **Work/Volunteer Experience** — jobs, volunteering, family business (all modules)
8. **References** — "Available upon request" or 2-3 listed names (with permission)

### Writing Your Cover Letter

A cover letter is a one-page letter that goes WITH your resume. It answers: "Why should we hire YOU for THIS specific job?"

**The Formula:**

**Paragraph 1:** I'm applying for [specific job] at [company]. I found it on [where]. I'm excited about it because [specific reason about THEIR company].

**Paragraph 2:** Here's what I bring: [2-3 skills or experiences that match what THEY asked for in the job posting]. Use specific examples from your resume.

**Paragraph 3:** I'm available [your availability]. I'd love the opportunity to discuss how I can contribute to your team. Thank you for your time.

That's it. Three paragraphs. One page. Tailored to each job.

### The Final Step: Tailor to a Real Job

1. Find a real job posting online (Indeed, LinkedIn, company website) for a job you actually want
2. Highlight the skills they're asking for
3. Adjust your objective statement to match
4. Reorder your skills to put their priorities first
5. Write a cover letter specific to this job
6. Have the AI review both documents for fit

### Your Turn: Complete Your Career Passport

1. Open your resume — review all sections one more time
2. Run the AI Resume Reviewer for grammar, formatting, and content feedback
3. Find a real job posting and tailor your resume
4. Write a cover letter for that specific job
5. Download your completed resume as a PDF
6. **Celebrate.** You just did something most adults haven't done — built a professional resume from scratch using real experiences and real skills.

### What Happens Next

When you complete this lesson and pass the Module 5 quiz, you earn your **ThriveUp Workforce Readiness Certificate**. This is:
- Verifiable with a unique certificate ID
- Shareable on LinkedIn
- Printable for your portfolio
- Evidence that you completed a TEKS-aligned employability skills program
- A real credential that employers recognize

### Neighborhood Champions: Your Network

Throughout this program, you've connected with neighborhood champions who shared their real experiences. These aren't just guest speakers — they're your NETWORK now. Stay connected. Ask for advice. Let them know when you get that first interview, that first job, that first promotion.

This is how it works. Not who you know — who knows THAT YOU SHOW UP.

### Ecosystem Connection: Your ThriveUp Journey Continues

Completing the Workforce Readiness Academy unlocks new pathways across the ThriveUp ecosystem:
- **Career Pathways** — explore specific industries and career ladders
- **AI Creation Studio** — build a professional portfolio website
- **Financial Literacy Hub** — learn to manage your first paycheck
- **Mentor-to-Career (M2C)** — get matched with a professional mentor
- **LifeBridge** — navigate benefits and resources you may qualify for
- **Apprenticeship Tracker** — explore paid training opportunities
- **Neighborhood Intelligence** — understand the economic landscape of your community

**You started this program with skills you didn't know how to name. You're ending it with a resume, a certificate, a network, and a plan. That's not just workforce readiness. That's AGENCY.**`,
      activityData: JSON.stringify({
        type: "resume_builder",
        title: "Resume Builder — Part 5 (Final)",
        sections: ["experience", "references", "cover_letter", "review"],
        milestone: "resume_complete"
      }),
    },
  ]);

  // ===== QUIZ QUESTIONS: 10 PER MODULE, 50 TOTAL =====
  const existingQuiz = await db.select().from(quizQuestions).where(eq(quizQuestions.id, "wr_q_m1_1")).limit(1);
  if (existingQuiz.length === 0) {
    await db.insert(quizQuestions).values([
      // MODULE 1 QUIZ: Professional Presence
      { id: "wr_q_m1_1", moduleId: "wr_professional_presence", questionText: "Jaylen just got hired at H-E-B. His manager asks him to come in Saturday instead of Sunday. Jaylen can't make Saturday. What's the most professional response?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Don't respond and just show up Sunday"},{id:"b",text:"Text back 'nah cant do sat'"},{id:"c",text:"Reply thanking her for asking, explain he can't Saturday, offer his regular Sunday shift and an extra shift next week"},{id:"d",text:"Quit because the schedule keeps changing"}]), correctAnswer: "c", explanation: "Option C is professional — it's clear, respectful, shows initiative by offering an alternative, and keeps the relationship positive.", points: 10 },
      { id: "wr_q_m1_2", moduleId: "wr_professional_presence", questionText: "Research shows people form a first impression in about how many seconds?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"30 seconds"},{id:"b",text:"7 seconds"},{id:"c",text:"2 minutes"},{id:"d",text:"It depends on the conversation"}]), correctAnswer: "b", explanation: "Studies show first impressions form in about 7 seconds — based on appearance, body language, and your initial greeting.", points: 10 },
      { id: "wr_q_m1_3", moduleId: "wr_professional_presence", questionText: "Which email is the most professional?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"xXgamer420Xx@gmail.com"},{id:"b",text:"jaylen.carter@gmail.com"},{id:"c",text:"hotboy2009@yahoo.com"},{id:"d",text:"jc123456789@gmail.com"}]), correctAnswer: "b", explanation: "firstname.lastname@gmail.com is the standard professional format. Employers notice your email address before they even open your message.", points: 10 },
      { id: "wr_q_m1_4", moduleId: "wr_professional_presence", questionText: "Your friend says 'I can't make a resume because I don't have any experience.' What's the best response?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"They're right — you need a real job first"},{id:"b",text:"Babysitting, volunteering, school clubs, and family responsibilities all count as real experience"},{id:"c",text:"Just make stuff up — nobody checks"},{id:"d",text:"Wait until after college to write a resume"}]), correctAnswer: "b", explanation: "Volunteer work, family responsibilities, school activities, and community involvement are ALL real experience. You just need to name them professionally.", points: 10 },
      { id: "wr_q_m1_5", moduleId: "wr_professional_presence", questionText: "During a job interview, the interviewer asks a question and your mind goes blank. What should you do?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Say 'I don't know' and move on"},{id:"b",text:"Make something up quickly"},{id:"c",text:"Say 'That's a great question. Let me think about that for a moment.'"},{id:"d",text:"Change the subject"}]), correctAnswer: "c", explanation: "Pausing to think is professional and shows you take the question seriously. It's much better than rushing into a bad answer.", points: 10 },
      { id: "wr_q_m1_6", moduleId: "wr_professional_presence", questionText: "What is code-switching in a professional context?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Changing computer passwords frequently"},{id:"b",text:"Adapting how you communicate based on your audience and setting"},{id:"c",text:"Switching jobs frequently"},{id:"d",text:"Using a different phone for work"}]), correctAnswer: "b", explanation: "Code-switching means adjusting your communication style for different settings. It's a SKILL, not being fake — you already do it with friends vs. grandparents.", points: 10 },
      { id: "wr_q_m1_7", moduleId: "wr_professional_presence", questionText: "Which part of a professional email should state WHY you're writing?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"The greeting"},{id:"b",text:"The purpose line (first sentence after greeting)"},{id:"c",text:"The closing"},{id:"d",text:"The subject line only"}]), correctAnswer: "b", explanation: "The purpose line — the first sentence after your greeting — should clearly state why you're writing.", points: 10 },
      { id: "wr_q_m1_8", moduleId: "wr_professional_presence", questionText: "What should you ALWAYS say at the end of a job interview when asked 'Do you have any questions for us?'", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"No, I'm good"},{id:"b",text:"How much does this job pay?"},{id:"c",text:"Something specific about the role or company, like 'What does a typical day look like here?'"},{id:"d",text:"When do I start?"}]), correctAnswer: "c", explanation: "Always have at least one thoughtful question. It shows genuine interest in the role and that you've done your homework.", points: 10 },
      { id: "wr_q_m1_9", moduleId: "wr_professional_presence", questionText: "What's the FIRST thing you should do when you start the Workforce Readiness Academy?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Write your resume"},{id:"b",text:"Download ThriveUp as an app on your phone for 24/7 access"},{id:"c",text:"Buy interview clothes"},{id:"d",text:"Find a job posting"}]), correctAnswer: "b", explanation: "Downloading the ThriveUp PWA gives you 24/7 access to your career tools, resume builder, AI mock interviews, and lessons — right from your phone.", points: 10 },
      { id: "wr_q_m1_10", moduleId: "wr_professional_presence", questionText: "If you can't afford professional interview clothes, what should you do?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Skip the interview"},{id:"b",text:"Go in whatever you have — clothes don't matter"},{id:"c",text:"Check thrift stores, nonprofits that give free interview outfits, or ask your school counselor for resources"},{id:"d",text:"Borrow clothes that don't fit"}]), correctAnswer: "c", explanation: "Resources exist! Thrift stores, nonprofits, and school counselors can help. Clean, pressed, and fitting well matters more than brand names.", points: 10 },

      // MODULE 2 QUIZ: Workplace Rights
      { id: "wr_q_m2_1", moduleId: "wr_workplace_rights", questionText: "Your manager asks you to stay 20 minutes after your shift to fold clothes — off the clock. Is this legal?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Yes, if it's less than 30 minutes"},{id:"b",text:"Yes, everyone does it"},{id:"c",text:"No — if you're working, you must be paid"},{id:"d",text:"Only if your manager asks nicely"}]), correctAnswer: "c", explanation: "The Fair Labor Standards Act requires you to be paid for ALL hours worked, including any time your employer asks you to stay.", points: 10 },
      { id: "wr_q_m2_2", moduleId: "wr_workplace_rights", questionText: "Title VII of the Civil Rights Act protects workers from discrimination based on:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Race, color, religion, sex, and national origin"},{id:"b",text:"Height and weight"},{id:"c",text:"Political party"},{id:"d",text:"Personality type"}]), correctAnswer: "a", explanation: "Title VII protects against discrimination based on race, color, religion, sex, and national origin.", points: 10 },
      { id: "wr_q_m2_3", moduleId: "wr_workplace_rights", questionText: "A coworker keeps calling you by a nickname related to your ethnicity even though you've asked them to stop. This is:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Just a joke"},{id:"b",text:"Potentially harassment — creating a hostile work environment"},{id:"c",text:"Fine as long as they don't mean it"},{id:"d",text:"Only a problem if your manager does it"}]), correctAnswer: "b", explanation: "Repeated unwanted behavior based on ethnicity that creates a hostile work environment can be harassment under Title VII.", points: 10 },
      { id: "wr_q_m2_4", moduleId: "wr_workplace_rights", questionText: "If you report a workplace violation and your employer fires you, that's called:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Discipline"},{id:"b",text:"Downsizing"},{id:"c",text:"Retaliation — and it's illegal"},{id:"d",text:"Normal business"}]), correctAnswer: "c", explanation: "Firing someone for reporting a legitimate workplace violation is retaliation, which is illegal.", points: 10 },
      { id: "wr_q_m2_5", moduleId: "wr_workplace_rights", questionText: "Which of these is the BEST first step if you experience harassment at work?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Post about it on social media"},{id:"b",text:"Quit immediately"},{id:"c",text:"Document it — write down dates, times, what was said, and who was there"},{id:"d",text:"Ignore it and hope it stops"}]), correctAnswer: "c", explanation: "Documentation is crucial. Write down specifics while they're fresh.", points: 10 },
      { id: "wr_q_m2_6", moduleId: "wr_workplace_rights", questionText: "The ADA requires employers to provide:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Higher pay for disabled workers"},{id:"b",text:"Reasonable accommodations for workers with disabilities"},{id:"c",text:"Separate workspaces"},{id:"d",text:"Fewer work hours"}]), correctAnswer: "b", explanation: "The ADA requires 'reasonable accommodations' — adjustments that help a person with a disability do their job.", points: 10 },
      { id: "wr_q_m2_7", moduleId: "wr_workplace_rights", questionText: "During a job interview, which of these questions is ILLEGAL for an employer to ask?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"What are your strengths?"},{id:"b",text:"Are you available to work weekends?"},{id:"c",text:"Do you plan on having children soon?"},{id:"d",text:"Tell me about a challenge you've overcome"}]), correctAnswer: "c", explanation: "Asking about family plans is sex discrimination under Title VII.", points: 10 },
      { id: "wr_q_m2_8", moduleId: "wr_workplace_rights", questionText: "You see a coworker being harassed but you're afraid to speak up directly. What's a safe alternative?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Nothing — it's not your problem"},{id:"b",text:"Use the 'Distract' technique — interrupt with 'Hey, can you help me with something?'"},{id:"c",text:"Film it for social media"},{id:"d",text:"Wait and see if it gets worse"}]), correctAnswer: "b", explanation: "The Distract technique is one of the 5 D's of bystander intervention. It safely interrupts the situation.", points: 10 },
      { id: "wr_q_m2_9", moduleId: "wr_workplace_rights", questionText: "Can your employer check your public social media posts?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"No — that's an invasion of privacy"},{id:"b",text:"Yes — anything public is fair game"},{id:"c",text:"Only after they hire you"},{id:"d",text:"Only with your permission"}]), correctAnswer: "b", explanation: "Public social media is public. 70% of employers check candidates' social media.", points: 10 },
      { id: "wr_q_m2_10", moduleId: "wr_workplace_rights", questionText: "Which right is protected by the National Labor Relations Act (NLRA)?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"The right to refuse any task"},{id:"b",text:"The right to discuss wages with coworkers"},{id:"c",text:"The right to unlimited breaks"},{id:"d",text:"The right to set your own schedule"}]), correctAnswer: "b", explanation: "The NLRA protects your right to discuss wages and working conditions with coworkers.", points: 10 },

      // MODULE 3 QUIZ: Workplace Safety
      { id: "wr_q_m3_1", moduleId: "wr_workplace_safety", questionText: "Marcus's supervisor tells him to climb a broken ladder. Marcus says no. Is he protected?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"No — he has to do what his supervisor says"},{id:"b",text:"Yes — OSHA gives workers the right to refuse dangerous work"},{id:"c",text:"Only if he files paperwork first"},{id:"d",text:"Only if someone else got hurt on that ladder before"}]), correctAnswer: "b", explanation: "OSHA protects your right to refuse work that poses an immediate threat to your life or health.", points: 10 },
      { id: "wr_q_m3_2", moduleId: "wr_workplace_safety", questionText: "Who is required to pay for Personal Protective Equipment (PPE)?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"The employee"},{id:"b",text:"The employer — by law"},{id:"c",text:"It depends on the job"},{id:"d",text:"The government"}]), correctAnswer: "b", explanation: "OSHA requires employers to provide PPE at no cost to employees.", points: 10 },
      { id: "wr_q_m3_3", moduleId: "wr_workplace_safety", questionText: "You discover a grease fire in the kitchen at work. What's the FIRST thing you should do?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Throw water on it"},{id:"b",text:"Try to pick up the pan and carry it outside"},{id:"c",text:"Alert people nearby, pull the fire alarm if available, and evacuate"},{id:"d",text:"Take a video for your manager"}]), correctAnswer: "c", explanation: "Alert others and evacuate first. NEVER throw water on a grease fire. NEVER try to move a burning pan.", points: 10 },
      { id: "wr_q_m3_4", moduleId: "wr_workplace_safety", questionText: "What does SDS stand for, and why does it matter?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Safety Data Sheet — tells you what's in a chemical and what to do if something goes wrong"},{id:"b",text:"Standard Delivery Service — how chemicals are shipped"},{id:"c",text:"Safe Distance Standard — how far to stand from machines"},{id:"d",text:"Supervisor Decision Sheet — your manager's safety rules"}]), correctAnswer: "a", explanation: "Safety Data Sheets contain critical information about every chemical in your workplace.", points: 10 },
      { id: "wr_q_m3_5", moduleId: "wr_workplace_safety", questionText: "The correct way to lift a heavy box is:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Bend at the waist, lift with your back, twist to place it"},{id:"b",text:"Get close, bend your knees, lift with your legs, don't twist"},{id:"c",text:"Lift as fast as possible to get it over with"},{id:"d",text:"It doesn't matter as long as you're strong enough"}]), correctAnswer: "b", explanation: "Lift with your legs, not your back. Get close, bend your knees, grip firmly, and move your FEET to turn.", points: 10 },
      { id: "wr_q_m3_6", moduleId: "wr_workplace_safety", questionText: "What is OSHA's phone number for reporting unsafe conditions?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"911"},{id:"b",text:"1-800-321-OSHA (6742)"},{id:"c",text:"311"},{id:"d",text:"1-800-CALL-FBI"}]), correctAnswer: "b", explanation: "1-800-321-OSHA (6742). You can also file complaints online at osha.gov. Reports can be anonymous.", points: 10 },
      { id: "wr_q_m3_7", moduleId: "wr_workplace_safety", questionText: "In an active threat situation at work, what is the recommended response order?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Fight, Hide, Run"},{id:"b",text:"Run, Hide, Fight"},{id:"c",text:"Call 911, then wait"},{id:"d",text:"Hide and stay quiet no matter what"}]), correctAnswer: "b", explanation: "Run, Hide, Fight — in that order. Escape if possible, hide if you can't escape, fight only as an absolute last resort.", points: 10 },
      { id: "wr_q_m3_8", moduleId: "wr_workplace_safety", questionText: "If a coworker falls off a ladder and is injured, what should you NOT do?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Call 911"},{id:"b",text:"Stay with them and keep them calm"},{id:"c",text:"Move them to a more comfortable position"},{id:"d",text:"Apply pressure to any bleeding wounds"}]), correctAnswer: "c", explanation: "Do NOT move an injured person unless they're in immediate danger. Moving them could worsen injuries.", points: 10 },
      { id: "wr_q_m3_9", moduleId: "wr_workplace_safety", questionText: "You should NEVER mix these two cleaning chemicals:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Dish soap and water"},{id:"b",text:"Bleach and ammonia"},{id:"c",text:"Window cleaner and paper towels"},{id:"d",text:"Hand soap and sanitizer"}]), correctAnswer: "b", explanation: "Bleach + ammonia = toxic chloramine gas. This can cause serious breathing problems and even death.", points: 10 },
      { id: "wr_q_m3_10", moduleId: "wr_workplace_safety", questionText: "After a workplace incident (even a minor one), you should:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Keep it to yourself so you don't cause trouble"},{id:"b",text:"Report it to your supervisor, document what happened, and keep a copy"},{id:"c",text:"Post about it online for evidence"},{id:"d",text:"Only report it if someone got seriously hurt"}]), correctAnswer: "b", explanation: "Always report incidents. Document everything while it's fresh.", points: 10 },

      // MODULE 4 QUIZ: Time Management
      { id: "wr_q_m4_1", moduleId: "wr_time_management", questionText: "In the Eisenhower Matrix, where do tasks like 'studying for next week's test' and 'working on your resume' go?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Urgent & Important — Do It Now"},{id:"b",text:"Important but Not Urgent — Schedule It"},{id:"c",text:"Urgent but Not Important — Delegate or Limit"},{id:"d",text:"Not Urgent & Not Important — Eliminate"}]), correctAnswer: "b", explanation: "Career development and future planning are Important but Not Urgent. This is where your GROWTH lives.", points: 10 },
      { id: "wr_q_m4_2", moduleId: "wr_time_management", questionText: "What's the most professional response when someone asks you to commit to something?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Say yes immediately to seem helpful"},{id:"b",text:"Say 'Let me check my calendar and get back to you'"},{id:"c",text:"Say no to everything to protect your time"},{id:"d",text:"Say 'I'll try' and figure it out later"}]), correctAnswer: "b", explanation: "Checking your calendar before committing shows professionalism and prevents overcommitting.", points: 10 },
      { id: "wr_q_m4_3", moduleId: "wr_time_management", questionText: "What does the 'S' in SMART goals stand for?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Simple"},{id:"b",text:"Specific"},{id:"c",text:"Strategic"},{id:"d",text:"Successful"}]), correctAnswer: "b", explanation: "Specific — your goal must clearly define what you'll do.", points: 10 },
      { id: "wr_q_m4_4", moduleId: "wr_time_management", questionText: "Goals you share with an accountability partner are how much more likely to happen?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"10% more likely"},{id:"b",text:"30% more likely"},{id:"c",text:"65% more likely"},{id:"d",text:"95% more likely"}]), correctAnswer: "d", explanation: "Research shows goals with a specific accountability partner are 95% more likely to be achieved.", points: 10 },
      { id: "wr_q_m4_5", moduleId: "wr_time_management", questionText: "Sofia is overwhelmed with school, work, and family. The FIRST thing she should do is:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Quit her job"},{id:"b",text:"Drop her AP classes"},{id:"c",text:"Track where her time actually goes for 3 days, then use the Eisenhower Matrix to prioritize"},{id:"d",text:"Sleep less to fit everything in"}]), correctAnswer: "c", explanation: "Before you can manage your time, you need to see where it goes.", points: 10 },
      { id: "wr_q_m4_6", moduleId: "wr_time_management", questionText: "What's the best way to handle 'buffer time' in your calendar?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Don't plan buffers — fill every minute"},{id:"b",text:"Block travel time and transition time between activities"},{id:"c",text:"Only add buffers on weekends"},{id:"d",text:"Buffer time is wasted time"}]), correctAnswer: "b", explanation: "You can't teleport. Blocking buffer time between activities accounts for travel, transitions, and mental reset.", points: 10 },
      { id: "wr_q_m4_7", moduleId: "wr_time_management", questionText: "Color-coding your calendar helps because:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"It looks pretty"},{id:"b",text:"It lets you see at a glance how your time is distributed across work, school, personal, and growth"},{id:"c",text:"It's required by employers"},{id:"d",text:"It only helps if you use specific colors"}]), correctAnswer: "b", explanation: "Color-coding gives you a visual snapshot of your time distribution.", points: 10 },
      { id: "wr_q_m4_8", moduleId: "wr_time_management", questionText: "Which Eisenhower Matrix quadrant includes 'scrolling TikTok for 2 hours'?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Urgent & Important"},{id:"b",text:"Important but Not Urgent"},{id:"c",text:"Urgent but Not Important"},{id:"d",text:"Not Urgent & Not Important — Eliminate"}]), correctAnswer: "d", explanation: "Extended social media scrolling is neither urgent nor important. It's the quadrant to minimize.", points: 10 },
      { id: "wr_q_m4_9", moduleId: "wr_time_management", questionText: "Using Google's XYZ resume formula, which is the BEST way to describe an accomplishment?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Helped at school"},{id:"b",text:"Did good work"},{id:"c",text:"Organized a school fundraiser that raised $1,200 by coordinating a team of 8 volunteers"},{id:"d",text:"Was responsible for fundraising"}]), correctAnswer: "c", explanation: "The XYZ formula: Accomplished [X] as measured by [Y] by doing [Z]. Specific, quantified, and action-oriented.", points: 10 },
      { id: "wr_q_m4_10", moduleId: "wr_time_management", questionText: "What's the most important calendar habit to build?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Check it once a week"},{id:"b",text:"Check it every morning — 60 seconds to know what's coming"},{id:"c",text:"Only check it when you remember"},{id:"d",text:"Have someone else manage it for you"}]), correctAnswer: "b", explanation: "60 seconds every morning. Know what's coming. No surprises.", points: 10 },

      // MODULE 5 QUIZ: Work Ethic & Leadership
      { id: "wr_q_m5_1", moduleId: "wr_work_ethic_leadership", questionText: "DeAndre's manager asks him to train the new employee. Why did the manager choose DeAndre?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"DeAndre is the best salesperson"},{id:"b",text:"DeAndre has been there the longest"},{id:"c",text:"DeAndre is the most reliable — he shows up consistently, no drama, no excuses"},{id:"d",text:"Nobody else was available"}]), correctAnswer: "c", explanation: "Work ethic — showing up, being reliable, being consistent — is what builds trust.", points: 10 },
      { id: "wr_q_m5_2", moduleId: "wr_work_ethic_leadership", questionText: "What are the four pillars of work ethic?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Speed, strength, intelligence, creativity"},{id:"b",text:"Punctuality, dependability, reliability, responsibility"},{id:"c",text:"Education, connections, talent, luck"},{id:"d",text:"Ambition, aggression, networking, charm"}]), correctAnswer: "b", explanation: "Punctuality, dependability, reliability, responsibility. These are the foundation.", points: 10 },
      { id: "wr_q_m5_3", moduleId: "wr_work_ethic_leadership", questionText: "What is the FASTEST path to promotion according to real managers?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Being friends with the boss"},{id:"b",text:"Working the most hours"},{id:"c",text:"Making your manager's job easier — solving problems without being asked"},{id:"d",text:"Complaining about others to look better"}]), correctAnswer: "c", explanation: "Making your manager's job easier shows initiative, competence, and leadership potential.", points: 10 },
      { id: "wr_q_m5_4", moduleId: "wr_work_ethic_leadership", questionText: "A Servant Leader focuses on:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Being in charge and making all decisions"},{id:"b",text:"Serving others first — 'How can I help you succeed?'"},{id:"c",text:"Competing with team members"},{id:"d",text:"Avoiding responsibility"}]), correctAnswer: "b", explanation: "Servant leadership means leading by serving others' needs first. It builds trust and loyalty.", points: 10 },
      { id: "wr_q_m5_5", moduleId: "wr_work_ethic_leadership", questionText: "You made a mistake at work that affected a customer. The most professional response is:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Hope nobody notices"},{id:"b",text:"Blame a coworker"},{id:"c",text:"Say 'I made a mistake. Here's what happened and here's how I'll fix it.'"},{id:"d",text:"Wait for your manager to bring it up"}]), correctAnswer: "c", explanation: "Owning your mistakes is the 'Responsibility' pillar of work ethic.", points: 10 },
      { id: "wr_q_m5_6", moduleId: "wr_work_ethic_leadership", questionText: "What's the difference between a manager and a leader?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Managers make more money"},{id:"b",text:"Leaders have bigger offices"},{id:"c",text:"Managers maintain systems; leaders inspire people and drive change"},{id:"d",text:"There's no difference"}]), correctAnswer: "c", explanation: "Managers focus on tasks and systems. Leaders focus on people and vision. The best do both.", points: 10 },
      { id: "wr_q_m5_7", moduleId: "wr_work_ethic_leadership", questionText: "You don't need a title to be a leader. Which of these is a leadership action ANYONE can take?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Wait to be told what to do"},{id:"b",text:"Help the new person on their first day"},{id:"c",text:"Only do exactly what's in your job description"},{id:"d",text:"Stay quiet in meetings"}]), correctAnswer: "b", explanation: "Helping new team members is leadership. It shows initiative, empathy, and teamwork.", points: 10 },
      { id: "wr_q_m5_8", moduleId: "wr_work_ethic_leadership", questionText: "What does 'being on time' actually mean in the workplace?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Arriving at your start time"},{id:"b",text:"Arriving 5-10 minutes early, ready to start at your scheduled time"},{id:"c",text:"It doesn't matter as long as you get your work done"},{id:"d",text:"Arriving within 15 minutes of your start time"}]), correctAnswer: "b", explanation: "Being on time means being READY at your start time — not walking in the door.", points: 10 },
      { id: "wr_q_m5_9", moduleId: "wr_work_ethic_leadership", questionText: "By completing the Workforce Readiness Academy, you've earned:", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"A participation trophy"},{id:"b",text:"A verifiable ThriveUp Workforce Readiness Certificate aligned to TEKS, a complete resume, and real skills"},{id:"c",text:"A discount on college tuition"},{id:"d",text:"A guaranteed job"}]), correctAnswer: "b", explanation: "Your certificate is verifiable, your resume is built from real experiences, and your skills are aligned to Texas state standards.", points: 10 },
      { id: "wr_q_m5_10", moduleId: "wr_work_ethic_leadership", questionText: "What is the key message of the Workforce Readiness Academy?", questionType: "multiple_choice", options: JSON.stringify([{id:"a",text:"Get a job as fast as possible"},{id:"b",text:"You already have more skills than you think — this program helps you name them, prove them, and build on them"},{id:"c",text:"College is the only path to success"},{id:"d",text:"Just follow the rules and you'll be fine"}]), correctAnswer: "b", explanation: "You started with skills you didn't know how to name. You're ending with a resume, a certificate, a network, and a plan. That's agency.", points: 10 },
    ]);
  }

  // ===== WORKFORCE READINESS BADGES =====
  const existingBadge = await db.select().from(badges).where(eq(badges.id, "wr_professional_presence_badge")).limit(1);
  if (existingBadge.length === 0) {
    await db.insert(badges).values([
      { id: "wr_professional_presence_badge", name: "Professional Presence Pro", description: "Completed Module 1 — mastered first impressions, communication, and interview skills", category: "skill", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_workplace_rights_badge", name: "Rights Champion", description: "Completed Module 2 — knows workplace rights, harassment response, and bystander intervention", category: "skill", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_workplace_safety_badge", name: "Safety Expert", description: "Completed Module 3 — OSHA-trained in hazard ID, PPE, and emergency response", category: "skill", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_time_management_badge", name: "Time Master", description: "Completed Module 4 — Eisenhower Matrix, SMART goals, and calendar management", category: "skill", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_career_leader_badge", name: "Career Leader", description: "Completed Module 5 — work ethic, organizational understanding, and leadership identity", category: "skill", levelRequirement: 4, rarity: "rare" },
      { id: "wr_resume_started", name: "Resume Started", description: "Started building your professional resume", category: "milestone", levelRequirement: 4, rarity: "common" },
      { id: "wr_resume_skills", name: "Skills Documented", description: "Added a Skills section to your resume with evidence", category: "milestone", levelRequirement: 4, rarity: "common" },
      { id: "wr_resume_certs", name: "Certified", description: "Added Certifications & Training to your resume", category: "milestone", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_resume_accomplishments", name: "Accomplishments Proven", description: "Added Projects & Accomplishments with the XYZ formula", category: "milestone", levelRequirement: 4, rarity: "uncommon" },
      { id: "wr_resume_complete", name: "Career Passport Complete", description: "Finished your entire resume including cover letter — ready for the world", category: "milestone", levelRequirement: 4, rarity: "rare" },
      { id: "wr_workforce_ready_cert", name: "Workforce Ready", description: "Completed all 5 modules and earned the ThriveUp Workforce Readiness Certificate", category: "milestone", levelRequirement: 4, rarity: "legendary" },
    ]);
  }

  // ---- GRADES 6-8 WORKFORCE: wr_career_foundations_teamwork L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_68_teamwork_l1", moduleId: "wr_career_foundations_teamwork", lessonNumber: 1,
      title: "Working Together — The Building Blocks of Teamwork", durationMinutes: 30, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Good Teammate", "Needs Improvement"],
        items: [
          { text: "Listening to everyone's ideas before the group decides", category: "Good Teammate" },
          { text: "Doing all the work yourself because you want an A", category: "Needs Improvement" },
          { text: "Encouraging a shy group member to share their idea", category: "Good Teammate" },
          { text: "Making fun of someone's suggestion in front of the group", category: "Needs Improvement" },
          { text: "Dividing tasks fairly based on people's strengths", category: "Good Teammate" },
          { text: "Letting one person do nothing while the rest work", category: "Needs Improvement" },
          { text: "Speaking up when you disagree respectfully", category: "Good Teammate" },
          { text: "Gossiping about teammates behind their back", category: "Needs Improvement" },
        ],
        instructions: "Sort each behavior: Is this what a good teammate does, or does it need improvement?",
      }),
      content: `## Working Together — The Building Blocks of Teamwork

Every job you'll ever have involves working with other people. Learning to be an effective teammate now — in school projects, sports teams, clubs, and community activities — builds skills you'll use for the rest of your life.

### Why Teamwork Matters

Think about anything impressive humans have accomplished: building cities, creating technology, winning championships, solving diseases. None of it was done alone. The ability to work effectively with others is consistently rated as one of the TOP skills employers look for — across every industry.

### The Four Roles Every Team Needs

**The Organizer:** Keeps the team on track. Creates plans, sets deadlines, tracks progress. "Okay, here's what we need to do and by when."

**The Contributor:** Does the work. Produces quality output on time. "I've got my section done — here it is."

**The Communicator:** Makes sure everyone understands. Asks questions, clarifies confusion, shares information. "Let me make sure we all agree on what we're doing."

**The Encourager:** Keeps morale up. Recognizes contributions, supports struggling teammates, maintains positive energy. "Great idea! That's going to make this project so much better."

You don't have to be just ONE of these. The best teammates can play multiple roles depending on what the team needs.

### Active Listening — The Most Important Team Skill

Most people listen to respond. Effective teammates listen to UNDERSTAND.

**How to actively listen:**
1. Put your phone away and make eye contact
2. Let the speaker finish before you respond
3. Repeat what you heard: "So you're saying..."
4. Ask questions to understand better
5. Acknowledge their point before sharing yours

**Why it matters:** When people feel heard, they contribute more, collaborate better, and trust the team. When people feel ignored, they shut down, disengage, and resent the group.

### Handling Disagreements

Disagreements aren't bad — they mean people care enough to have opinions. The key is HOW you disagree:

**DO:** "I see it differently. Here's my thinking..." + explain your reasoning
**DON'T:** "That's stupid" or rolling your eyes or just going silent

**DO:** Look for the overlap. "We both want the project to be great. Let's find a way to combine our ideas."
**DON'T:** Make it personal. "You always..." or "You never..."

**DO:** Be willing to compromise or let the group decide.
**DON'T:** Insist on your way or sulk when the group chooses differently.

### Your Teamwork Self-Assessment

Rate yourself honestly (1-5) on each:
- I listen to others before sharing my opinion
- I do my fair share of the work reliably
- I encourage teammates and recognize their contributions
- I speak up when I disagree, respectfully
- I follow through on commitments I make to the team

Wherever you scored lowest — that's where you grow next.`,
    },
    {
      id: "wr_68_teamwork_l2", moduleId: "wr_career_foundations_teamwork", lessonNumber: 2,
      title: "Communication Skills — Speaking, Writing, and Presenting", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Talking to a friend at lunch", right: "Casual communication — relaxed, personal, slang is fine" },
          { left: "Emailing a teacher about a missing assignment", right: "Semi-formal — polite, clear, proper grammar, specific request" },
          { left: "Presenting a project to your class", right: "Formal communication — organized, practiced, professional language, eye contact" },
          { left: "Texting your group chat about homework", right: "Casual communication — abbreviations okay, quick and informal" },
          { left: "Writing a thank-you note to someone who helped you", right: "Semi-formal — sincere, specific about what you're thanking them for" },
          { left: "Interviewing for a summer job", right: "Formal communication — prepared answers, professional appearance, confident and respectful" },
        ],
        instructions: "Match each situation to the appropriate communication level. Knowing which register to use is a critical life skill.",
      }),
      content: `## Communication Skills — Speaking, Writing, and Presenting

Communication is more than just talking. It's about making sure the right message reaches the right person in the right way. In this lesson, you'll learn the three levels of communication and when to use each one.

### The Three Levels of Communication

**Casual** — How you talk with friends. Relaxed, informal, slang is fine. Group chats, hanging out, social media with friends.

**Semi-Formal** — How you talk with teachers, coaches, or adults you respect. Polite, clear, proper grammar. Emails to teachers, talking to a coach, meeting a friend's parents.

**Formal** — How you talk in professional settings. Organized, practiced, professional vocabulary. Job interviews, class presentations, workplace communication.

### Written Communication

**Emails** follow a simple formula:
1. Subject line (what it's about)
2. Greeting ("Dear Ms. Johnson," or "Hi Mr. Rodriguez,")
3. Purpose (why you're writing — ONE sentence)
4. Details (what they need to know — 2-3 sentences)
5. Closing ("Thank you," + your name)

**Pro tip:** Read your email out loud before sending. If it sounds rude, confusing, or too long — edit it.

### Speaking and Presenting

Public speaking is the #1 fear in America — more than spiders, heights, or even death. But it's also one of the most valuable skills you can develop.

**Tips for presenting:**
- Practice out loud at least 3 times
- Make eye contact with different people in the room
- Speak slowly — you're always faster than you think
- Use your hands naturally — don't put them in your pockets
- If you mess up, keep going. Nobody noticed as much as you think.

### Body Language — The Communication You Don't Say

55% of communication is body language. That means MORE than half of your message comes from how you stand, sit, and move — not what you say.

**Positive body language:** Eye contact, open posture, nodding, leaning in slightly, genuine smile
**Negative body language:** Crossed arms, looking at phone, slouching, avoiding eye contact, fidgeting

### Your Turn

Practice writing a semi-formal email to a teacher asking for help with an assignment. Then practice introducing yourself to a new person in 30 seconds — your "elevator pitch."`,
    },
    {
      id: "wr_68_teamwork_l3", moduleId: "wr_career_foundations_teamwork", lessonNumber: 3,
      title: "Conflict Resolution — Turning Problems Into Solutions", durationMinutes: 30, activityType: "interactive",
      activityData: JSON.stringify({
        type: "scenario_sort",
        title: "Conflict Resolution Strategies",
        scenarios: [
          { id: "c1", text: "Your teammate isn't doing their share of a group project.", answer: "Talk to them privately first. Ask if something is going on. Offer to help redistribute tasks.", law: "Direct communication" },
          { id: "c2", text: "Two friends are fighting and both want you to take their side.", answer: "Listen to both sides without judging. Help them see each other's perspective. Don't pick sides.", law: "Mediation" },
          { id: "c3", text: "Someone spreads a rumor about you at school.", answer: "Don't retaliate with another rumor. Address it calmly with the person if safe, or talk to a trusted adult.", law: "De-escalation" },
          { id: "c4", text: "Your coach criticizes your performance in front of the team.", answer: "Stay calm in the moment. Talk to the coach privately afterward about how the feedback felt.", law: "Assertive communication" },
        ]
      }),
      content: `## Conflict Resolution — Turning Problems Into Solutions

Conflict is normal. It happens in every relationship, every team, every workplace. The question isn't whether you'll face conflict — it's whether you'll handle it in a way that makes things better or worse.

### The Five Conflict Resolution Styles

**Competing** — "My way or the highway." Win at all costs.
- When it works: Emergencies, safety issues
- When it doesn't: Most other situations. Creates resentment.

**Avoiding** — "I don't want to deal with this." Walk away, ignore it.
- When it works: The issue is truly minor and temporary
- When it doesn't: Important issues that won't go away on their own

**Accommodating** — "Whatever you want." Give in to keep the peace.
- When it works: The issue matters more to them than to you
- When it doesn't: When you always give in (leads to resentment)

**Compromising** — "Let's meet in the middle." Both sides give something up.
- When it works: Both sides have valid points and time is limited
- When it doesn't: When the compromise satisfies nobody

**Collaborating** — "Let's find a solution that works for everyone." Creative problem-solving together.
- When it works: Important issues where the relationship matters
- When it doesn't: When time is extremely limited (takes more effort)

### The "I" Statement Formula

Instead of blaming ("YOU always..."), use "I" statements:

"I feel [emotion] when [specific behavior] because [impact on you]. I would like [specific request]."

Example: "I feel frustrated when the project work isn't divided equally because I end up staying up late to finish everything. I would like us to sit down and split the tasks more fairly."

### Steps to Resolve Conflict

1. **Cool down first.** Don't address conflict when you're angry. Take a walk, take a breath.
2. **Choose the right time and place.** Private, when you're both calm.
3. **Use "I" statements.** Focus on how you feel, not what they did wrong.
4. **Listen to their side.** Really listen. There might be something you don't know.
5. **Find common ground.** What do you both want? Start there.
6. **Agree on a solution.** Be specific about what changes.
7. **Follow up.** Check in later to make sure the solution is working.

### Your Turn

Practice resolving 4 conflict scenarios using the strategies you've learned. The AI will guide you through each one and show you how different approaches lead to different outcomes.`,
    },
  ]);

  // ---- GRADES 6-8 WORKFORCE: wr_career_foundations_professionalism L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_68_prof_l1", moduleId: "wr_career_foundations_professionalism", lessonNumber: 1,
      title: "What Does 'Professional' Mean? (It's Not What You Think)", durationMinutes: 30, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Professional Behavior", "Unprofessional Behavior"],
        items: [
          { text: "Saying 'please' and 'thank you' to adults", category: "Professional Behavior" },
          { text: "Rolling your eyes when a teacher gives instructions", category: "Unprofessional Behavior" },
          { text: "Turning in assignments on time", category: "Professional Behavior" },
          { text: "Making excuses instead of owning mistakes", category: "Unprofessional Behavior" },
          { text: "Dressing appropriately for the occasion", category: "Professional Behavior" },
          { text: "Using your phone during class or meetings", category: "Unprofessional Behavior" },
          { text: "Helping a classmate who's struggling", category: "Professional Behavior" },
          { text: "Talking negatively about people behind their back", category: "Unprofessional Behavior" },
        ],
        instructions: "Sort each behavior: professional or unprofessional?",
      }),
      content: `## What Does 'Professional' Mean?

When most people hear "professional," they think of suits, offices, and boring adults. But being professional isn't about what you wear — it's about how you carry yourself.

### Professional = Reliable + Respectful + Responsible

That's it. Three R's:

**Reliable:** You do what you say you'll do. If you commit to something, people can count on you.

**Respectful:** You treat everyone with dignity — classmates, teachers, cafeteria workers, janitors, everyone. Not just people who can do something for you.

**Responsible:** You own your actions. Good or bad, you take responsibility.

### You're Already More Professional Than You Think

Do you:
- Show up to practice on time? That's professional.
- Keep your promises to friends? That's professional.
- Help around the house without being asked? That's professional.
- Apologize when you mess up? That's professional.

Professionalism isn't something you turn on at 18 when you get a job. It's a set of habits you build NOW that will serve you for the rest of your life.

### The Golden Rule of Professionalism

Treat every interaction as if it might lead to an opportunity — because it might. The teacher you're respectful to might write your college recommendation. The neighbor you help might know about a summer job. The classmate you're kind to might become your business partner.

You never know who's watching, and you never know who can open a door for you.

### First Impressions Start NOW

In middle school, you're building your reputation. Every day, people are forming opinions about you:
- Is this person reliable?
- Is this person kind?
- Is this person someone I want on my team?

The answers they form now follow you. Make them good answers.

### Your Turn

Sort 8 behaviors into "Professional" and "Unprofessional" categories. Then write 3 professional habits you already have and 2 you want to build.`,
    },
    {
      id: "wr_68_prof_l2", moduleId: "wr_career_foundations_professionalism", lessonNumber: 2,
      title: "Time Management for Middle Schoolers — Your Future Self Will Thank You", durationMinutes: 30, activityType: "interactive",
      activityData: JSON.stringify({
        type: "checklist",
        title: "Time Management Setup",
        items: [
          { id: "planner", text: "Set up a planner or digital calendar", points: 15 },
          { id: "homework", text: "Write down all homework due this week", points: 10 },
          { id: "activities", text: "Block out all activities and commitments", points: 10 },
          { id: "study", text: "Schedule at least 3 study sessions", points: 10 },
          { id: "fun", text: "Schedule fun/relaxation time too", points: 5 },
        ]
      }),
      content: `## Time Management — Your Future Self Will Thank You

In middle school, you're juggling more than ever: multiple classes, homework, sports, clubs, family, friends, and your own interests. Learning to manage your time NOW saves you from constant stress later.

### Why Time Management Matters

Students who manage their time well:
- Get better grades (not because they're smarter — because they're organized)
- Feel less stressed (knowing what's coming reduces anxiety)
- Have MORE free time (efficient work = more play time)
- Build habits that carry into high school, college, and careers

### The Planner System

Whether you use a paper planner, a phone app, or a notebook — the system is the same:

1. **Write it down immediately.** When a teacher assigns something, write it down RIGHT THEN. Don't say "I'll remember." You won't.

2. **Check your planner every night.** 5 minutes before bed. What's due tomorrow? What's coming this week?

3. **Break big projects into small steps.** A project due in 2 weeks = 10 small tasks, not 1 all-nighter.

4. **Estimate time.** How long will each task actually take? Most people underestimate by 50%. If you think it'll take 30 minutes, plan for 45.

### The Homework Strategy

**Best order for homework:**
1. Start with the hardest subject (when your brain is freshest)
2. Alternate between subjects (math, then reading, then science — variety keeps you focused)
3. Take 5-minute breaks every 25 minutes (the Pomodoro Technique)
4. Put your phone in another room while working (seriously — it makes a huge difference)

### Building Good Habits NOW

The habits you build in middle school become automatic by high school. Start with just ONE:
- Checking your planner every night before bed
- OR starting homework at the same time every day
- OR putting your phone away during study time

Master one habit before adding another. Small wins build momentum.

### Your Turn

Set up your time management system and plan your next week.`,
    },
    {
      id: "wr_68_prof_l3", moduleId: "wr_career_foundations_professionalism", lessonNumber: 3,
      title: "Career Exploration — What's Out There?", durationMinutes: 35, activityType: "exploration",
      activityData: JSON.stringify({
        type: "career_explorer",
        title: "Career Interest Inventory",
        categories: ["Technology", "Healthcare", "Business", "Creative Arts", "Trades & Construction", "Education", "Public Service"],
        instructions: "Explore 3 careers that interest you and research what they involve."
      }),
      content: `## Career Exploration — What's Out There?

You don't have to know what you want to be "when you grow up" right now. But exploring careers helps you understand what's possible — and what skills to start building.

### Career Clusters

The U.S. Department of Education organizes careers into 16 clusters. Here are some that might interest you:

**Technology & IT**
- Software Developer — builds apps and websites ($120K+ average)
- Cybersecurity Analyst — protects systems from hackers ($100K+)
- Data Scientist — finds patterns in data to solve problems ($95K+)

**Healthcare**
- Registered Nurse — direct patient care ($80K+)
- Physical Therapist — helps people recover from injuries ($90K+)
- Medical Technologist — runs lab tests that diagnose diseases ($55K+)

**Business & Finance**
- Accountant — manages money for companies and individuals ($75K+)
- Marketing Manager — helps companies reach customers ($135K+)
- Entrepreneur — starts and runs your own business (unlimited potential)

**Skilled Trades**
- Electrician — installs and maintains electrical systems ($60K+)
- Plumber — installs and repairs water systems ($60K+)
- HVAC Technician — heating and cooling systems ($50K+)
- Welder — joins metal for construction and manufacturing ($45K+)

**Creative & Media**
- Graphic Designer — creates visual content ($55K+)
- Video Producer — creates video content for companies ($65K+)
- UX Designer — designs user-friendly apps and websites ($100K+)

### Not All Careers Require College

This is important: many high-paying careers DON'T require a 4-year degree. Skilled trades, technology certifications, and apprenticeships can lead to six-figure careers.

**Paths to a career:**
- 4-year college degree
- 2-year associate degree
- Trade school / vocational program
- Apprenticeship (earn while you learn)
- Certifications + experience
- Military service + training
- Entrepreneurship

### How to Explore

1. **Talk to adults in your life.** Ask them what they do and how they got there.
2. **Job shadow.** Spend a day watching someone work.
3. **Research online.** Bureau of Labor Statistics (bls.gov) has detailed career info.
4. **Try things.** Join clubs, take electives, volunteer — every experience teaches you something.

### Your Career Interest Inventory

For this activity, pick 3 careers that interest you:
- For each, research: daily responsibilities, education required, salary range, growth outlook
- Interview or research someone in each field
- Rate each on a scale of 1-10 for: interest, fit with your skills, earning potential, lifestyle match
- Revisit and update as you learn more

Your career exploration is a journey, not a destination. The more you explore, the more confident your eventual choice will be.`,
    },
  ]);
}
