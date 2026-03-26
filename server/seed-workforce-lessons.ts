import { lessons } from "@shared/schema";

export async function seedWorkforceLessons(db: any): Promise<void> {
  // ============================================================
  // WORKFORCE READINESS GRADES 9-12 — TEKS §127.15 Aligned
  // ============================================================

  await db.insert(lessons).values([
    // ---- wr_professional_presence L1, L2, L3 ----
    {
      id: "wr_prof_l1", moduleId: "wr_professional_presence", lessonNumber: 1,
      title: "First Impressions — Professional Communication and Presence", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Slouching, looking at phone during conversation", right: "Unprofessional — signals disinterest and disrespect to the speaker" },
          { left: "Firm handshake, eye contact, and a genuine greeting", right: "Professional — creates an immediate positive first impression" },
          { left: "Using slang and abbreviations in a work email", right: "Unprofessional — workplace communication requires standard language and clear structure" },
          { left: "Arriving 5 minutes early, prepared with materials", right: "Professional — demonstrates reliability, planning, and respect for others' time" },
          { left: "Interrupting coworkers to share your opinion", right: "Unprofessional — active listening shows respect and produces better collaboration" },
          { left: "Asking clarifying questions when you don't understand a task", right: "Professional — shows initiative, prevents mistakes, and demonstrates maturity" },
        ],
        instructions: "Classify each workplace behavior as professional or unprofessional. Every interaction shapes how others perceive your competence.",
      }),
      content: `## First Impressions — Professional Communication and Presence

Research shows that first impressions form in 7 seconds. Seven seconds. In a job interview, a client meeting, or your first day at work, those seven seconds shape everything that follows. Let's make sure they work in your favor.

### The Three Channels of Professional Presence

Communication research (Albert Mehrabian's studies) suggests that in-person communication breaks down into three channels:

**1. VERBAL — What you say (7% of impact)**
Your words matter, but less than you think. What counts:
- Speaking clearly and at an appropriate pace
- Using language appropriate to the workplace (no slang, profanity, or excessive filler words)
- Asking intelligent questions
- Expressing ideas concisely — get to the point

**2. VOCAL — How you say it (38% of impact)**
Your tone, pace, volume, and inflection carry more meaning than the words themselves:
- Confident but not aggressive
- Enthusiastic but not manic
- Calm under pressure
- Matching the energy of the professional setting

**3. VISUAL — What they see (55% of impact)**
Body language and appearance dominate first impressions:
- Posture: Stand and sit up straight. Slouching signals low energy or disinterest.
- Eye contact: Maintain natural eye contact (not staring). It builds trust.
- Facial expression: A genuine smile goes further than any perfect answer.
- Grooming: Clean, neat, and appropriate for the workplace.
- Attire: Dress for the job you want, not the job you have. When in doubt, overdress.

### Professional Communication Fundamentals

**Email Communication:**
Every professional email should have:
- A clear, specific subject line ("Meeting Follow-Up: Q3 Budget Review" not "Hey")
- A professional greeting ("Good morning, Ms. Johnson" not "Hey")
- A clear purpose in the first 1-2 sentences
- Any required action items clearly stated
- A professional closing ("Best regards," "Thank you,")
- Proofread for grammar, spelling, and tone

**Phone/Video Communication:**
- Answer professionally: "Good morning, this is [your name]."
- Speak clearly and at a moderate pace
- On video: Look at the camera (not yourself), ensure good lighting, choose a clean background
- Minimize background noise
- Follow up important calls with a written summary

**In-Person Communication:**
- Arrive on time (early is on time; on time is late)
- Offer a firm handshake (when culturally appropriate)
- Use people's names — it shows respect and attention
- Practice active listening: nod, maintain eye contact, paraphrase what you heard
- Take notes when receiving instructions

### The Professionalism Spectrum

Professionalism isn't just about formal settings. It's a spectrum you navigate daily:

**Formal:** Client presentations, job interviews, meetings with executives
→ Highest level of professional behavior, formal language, business attire

**Business Casual:** Regular office environment, team meetings, daily interactions
→ Professional but relaxed, conversational tone, appropriate casual attire

**Informal Professional:** Team lunches, casual Fridays, informal check-ins
→ Relaxed but still respectful, appropriate humor, awareness of boundaries

**Key insight:** You can always dress down from formal to match your environment. It's much harder to recover from being too casual in a formal setting.

### Common First-Job Mistakes

1. **Being too casual too fast** — Observe the culture before you relax. Match or slightly exceed the professional level around you.
2. **Not asking questions** — New employees who ask questions learn faster and make fewer costly mistakes. Silence isn't strength — it's a missed opportunity.
3. **Phone addiction** — Nothing says "I'm not invested" like checking your phone during a meeting or conversation.
4. **Gossip** — It will always get back to the person. Always. Stay out of it.
5. **Defensiveness when receiving feedback** — Say "Thank you for the feedback. I'll work on that." Process your emotions later. Responding defensively makes people stop helping you grow.`,
    },
    {
      id: "wr_prof_l2", moduleId: "wr_professional_presence", lessonNumber: 2,
      title: "Professional Writing — Emails, Reports, and Documentation", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Strong Professional Writing", "Needs Improvement", "Unacceptable"],
        items: [
          { text: "Subject: Project Update — Phase 2 Milestone Reached, Next Steps Inside", category: "Strong Professional Writing" },
          { text: "Subject: stuff", category: "Unacceptable" },
          { text: "Hi team, wanted to share a quick update on our progress and outline next steps.", category: "Strong Professional Writing" },
          { text: "yo, so basically we kinda finished the thing, lmk what u think", category: "Unacceptable" },
          { text: "Hi, I finished the report. Attached. Let me know if you need anything else.", category: "Needs Improvement" },
          { text: "Dear Mr. Rodriguez, Thank you for your time today. As discussed, I've attached the proposal with the three options we reviewed. I'd welcome your feedback by Friday if possible.", category: "Strong Professional Writing" },
        ],
        instructions: "Classify each piece of writing by professionalism level. In the workplace, writing is your first impression when you're not in the room.",
      }),
      content: `## Professional Writing — Emails, Reports, and Documentation

In the modern workplace, you are judged by your writing every single day. Your emails, reports, messages, and documents represent you when you're not in the room. Strong professional writing is one of the most consistently valuable career skills.

### The CLEAR Framework for Professional Writing

**C — Concise:** Say what needs to be said in as few words as possible. Busy professionals don't read walls of text.

**L — Logical:** Organize information in a logical sequence. Lead with the most important point.

**E — Error-free:** Proofread everything. Grammar and spelling errors undermine your credibility instantly.

**A — Actionable:** Make clear what you need from the reader. "Please review and approve by Friday" is actionable. "Let me know your thoughts" is vague.

**R — Respectful:** Professional tone that respects the reader's time and position.

### Email Mastery

**The anatomy of a professional email:**

Subject Line: Specific and informative
"Q3 Budget Review — Action Required by March 15"
NOT: "Important" or "Question" or "Help"

Opening: Context and purpose
"Following up on our Tuesday meeting, I've compiled the three vendor proposals you requested."
NOT: "Hey, so remember when we talked about that thing..."

Body: Organized information
- Use bullet points for multiple items
- Bold key deadlines or action items
- Keep paragraphs short (2-3 sentences max)
- Put the most important information first

Closing: Clear next steps
"Could you review the attached proposals and share your preferred option by Thursday? I'll schedule vendor demos once we've narrowed it down."
NOT: "Let me know."

Sign-off: Professional and consistent
"Best regards," "Thank you," "Respectfully,"

### Report Writing

Professional reports follow a standard structure:

**Executive Summary:** The entire report compressed into 1 page. A busy executive should be able to read only this and understand the key findings, conclusions, and recommendations.

**Background/Context:** Why does this report exist? What problem does it address?

**Methodology:** How was the information gathered? What data was used?

**Findings:** What did you discover? Present data clearly with charts and tables.

**Analysis:** What do the findings mean? What are the implications?

**Recommendations:** Based on the analysis, what should be done? Be specific and actionable.

**Appendices:** Supporting data, detailed tables, raw data for reference.

### Documentation Skills

In every job, you'll need to document processes, decisions, and outcomes:

**Why documentation matters:**
- It creates institutional memory (so knowledge doesn't leave when people leave)
- It enables consistency (everyone follows the same process)
- It provides accountability (decisions and reasoning are recorded)
- It supports compliance (auditors can verify procedures)

**Good documentation is:**
- Written for someone who wasn't in the room
- Step-by-step and specific enough to follow
- Updated when processes change
- Stored where people can actually find it

### The AI Writing Partnership

AI can help with professional writing — but only if you use it correctly:

**Good AI use:** Draft a report outline, check grammar, suggest clearer phrasing, format data tables
**Bad AI use:** Have AI write the entire report without your analysis, skip proofreading because "AI wrote it," submit AI-generated content without verification

**Remember:** AI-assisted writing is YOUR writing. Every word, every claim, every recommendation bears YOUR name. You are accountable for accuracy, tone, and content.`,
    },
    {
      id: "wr_prof_l3", moduleId: "wr_professional_presence", lessonNumber: 3,
      title: "Interview Skills — Preparation, Performance, and Follow-Up", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Tell me about yourself", right: "Prepare a 90-second professional summary: current situation, relevant experience, why you're interested in this role" },
          { left: "What's your greatest weakness?", right: "Name a real area of growth with specific steps you're taking to improve. Never say 'I work too hard.'" },
          { left: "Why should we hire you?", right: "Connect your specific skills and experience directly to their stated job requirements. Use evidence, not adjectives." },
          { left: "Tell me about a time you failed", right: "Share a genuine failure, what you learned from it, and how you applied that lesson. Show self-awareness and growth." },
          { left: "Do you have any questions for us?", right: "Ask thoughtful questions about the role, team culture, and growth opportunities. Never say 'No.' This is your chance to show genuine interest." },
          { left: "Where do you see yourself in 5 years?", right: "Show ambition aligned with the company's growth. Demonstrate you've thought about your career path beyond just getting hired." },
        ],
        instructions: "Match each common interview question to the strongest response strategy.",
      }),
      content: `## Interview Skills — Preparation, Performance, and Follow-Up

Job interviews are one of the highest-stakes communication situations you'll face. The difference between getting the job and not getting it often comes down to preparation — not talent. This lesson teaches you to prepare like a professional.

### Before the Interview — Research and Preparation

**Research the organization:**
- What do they do? What's their mission?
- What's their culture like? (Check Glassdoor, their social media, news articles)
- Who are their competitors?
- What challenges are they facing?
- Who will be interviewing you? (LinkedIn research)

**Research the role:**
- Read the job description line by line
- Identify the top 3-5 requirements
- Prepare a specific example from your experience for each requirement
- Understand the salary range for this role in your area

**Prepare your stories — The STAR Method:**
For behavioral questions ("Tell me about a time when..."), use STAR:
- **S — Situation:** Set the scene briefly. Where were you? What was happening?
- **T — Task:** What was your specific responsibility or challenge?
- **A — Action:** What did YOU specifically do? (Not the team — YOU)
- **R — Result:** What was the measurable outcome? What did you learn?

Prepare 5-7 STAR stories covering: leadership, teamwork, problem-solving, conflict resolution, failure/learning, and achievement.

### During the Interview — Performance

**The first 2 minutes:**
- Arrive 10 minutes early
- Greet everyone warmly — including the receptionist
- Firm handshake, eye contact, genuine smile
- Thank them for the opportunity

**Answering questions:**
- Listen to the FULL question before answering
- Take a breath before responding (2 seconds of thought is fine)
- Be specific — use numbers, details, and concrete examples
- Keep answers to 1-2 minutes (don't ramble)
- If you don't understand, ask for clarification (this shows confidence, not weakness)

**Body language:**
- Sit up straight but don't look rigid
- Lean slightly forward to show engagement
- Maintain natural eye contact
- Keep hands visible and gestures controlled
- Smile when appropriate — you want to seem like someone people want to work with

**Asking YOUR questions:**
Always ask at least 3 questions. Strong options:
- "What does success look like in this role in the first 90 days?"
- "What are the team's biggest priorities this quarter?"
- "How would you describe the team's working style?"
- "What do you enjoy most about working here?"
- "What are the growth opportunities for someone in this role?"

Never ask about salary, vacation, or benefits in a first interview (unless they bring it up).

### After the Interview — Follow-Up

**Within 24 hours:** Send a thank-you email to every person who interviewed you.

**Template:**
"Dear [Name], Thank you for taking the time to meet with me today about the [Position] role. I particularly enjoyed learning about [specific topic discussed]. Our conversation reinforced my interest in joining [Company] — especially the opportunity to [specific aspect]. I'm confident my experience with [relevant skill/experience] would allow me to contribute meaningfully to your team. Please don't hesitate to reach out if you need any additional information. I look forward to hearing from you."

**If you don't hear back:** Follow up politely after 1 week. One email. If they don't respond after that, move on.

**If you get rejected:** Respond graciously. "Thank you for letting me know. I appreciate the opportunity to interview and would welcome consideration for future openings." The professional world is smaller than you think. Today's rejection could be next year's opportunity.

### The Mindset Shift

The biggest interview mistake is treating it as a test you might fail. Instead, think of it as a conversation between two parties trying to determine if they're a good fit for each other. You're interviewing THEM as much as they're interviewing you. This mindset reduces anxiety and produces more authentic, confident interviews.`,
    },
  ]);

  // ---- wr_workplace_rights L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_rights_l1", moduleId: "wr_workplace_rights", lessonNumber: 1,
      title: "Know Your Rights — Employment Law Fundamentals", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Your Right", "Employer's Right", "Shared Responsibility"],
        items: [
          { text: "Work in an environment free from harassment and discrimination", category: "Your Right" },
          { text: "Set work schedules and assign tasks within the job description", category: "Employer's Right" },
          { text: "Receive at least minimum wage for all hours worked", category: "Your Right" },
          { text: "Terminate employment for legitimate business reasons", category: "Employer's Right" },
          { text: "Maintain a safe workplace meeting OSHA standards", category: "Shared Responsibility" },
          { text: "Report unsafe conditions without retaliation", category: "Your Right" },
          { text: "Following company policies and procedures", category: "Shared Responsibility" },
          { text: "File a workers' compensation claim if injured on the job", category: "Your Right" },
        ],
        instructions: "Classify each workplace protection by who holds the right or responsibility.",
      }),
      content: `## Know Your Rights — Employment Law Fundamentals

Knowing your rights at work isn't optional — it's essential. Too many workers, especially young workers and workers of color, are exploited because they don't know what protections exist. This lesson ensures you're not one of them.

### The Foundation: Key Employment Laws

**Fair Labor Standards Act (FLSA):**
- Establishes federal minimum wage (currently $7.25/hr federal; Texas matches this, but many cities set higher local minimums)
- Requires overtime pay (1.5x regular rate) for non-exempt employees working over 40 hours/week
- Sets rules for youth employment (hours, types of work, age minimums)
- Requires employers to keep accurate time records

**Title VII of the Civil Rights Act:**
- Prohibits employment discrimination based on race, color, religion, sex, or national origin
- Applies to employers with 15 or more employees
- Covers hiring, firing, pay, promotions, and workplace conditions
- Established the Equal Employment Opportunity Commission (EEOC) for enforcement

**Americans with Disabilities Act (ADA):**
- Prohibits discrimination against qualified individuals with disabilities
- Requires reasonable accommodations (modified schedules, assistive technology, accessible workspaces)
- Applies to employers with 15 or more employees

**Age Discrimination in Employment Act (ADEA):**
- Protects workers 40 and older from age-based discrimination
- Applies to employers with 20 or more employees

**Equal Pay Act:**
- Requires equal pay for equal work regardless of sex
- Applies to all employers

### Texas-Specific Protections

- Texas is an "at-will" employment state — either party can end employment at any time for any lawful reason
- Texas Payday Law requires payment of wages on regular paydays
- Texas Commission on Human Rights Act mirrors federal anti-discrimination protections
- Workers' compensation is not required in Texas but most employers carry it

### Your Rights as a Young Worker

If you're under 18 in Texas:
- Cannot work in hazardous occupations (mining, manufacturing, operating heavy equipment)
- 14-15 year olds: Limited to 3 hours on school days, 8 hours on non-school days, 18 hours during school weeks
- 16-17 year olds: No federal hour restrictions, but may be limited by school requirements
- Must have working papers or age verification available

### What to Do If Your Rights Are Violated

**Step 1: Document everything**
- Dates, times, witnesses, what was said or done
- Save emails, texts, and any written communication
- Keep records at home (not just on work devices)

**Step 2: Report internally**
- Follow your employer's complaint procedure (usually HR)
- Put your complaint in writing
- Keep a copy for yourself

**Step 3: Report externally if needed**
- EEOC (discrimination): eeoc.gov or 1-800-669-4000
- Department of Labor (wage/hour): dol.gov/agencies/whd
- OSHA (safety): osha.gov or 1-800-321-6742
- Texas Workforce Commission: twc.texas.gov

**Step 4: Know your retaliation protections**
It is ILLEGAL for an employer to retaliate against you for:
- Filing a discrimination complaint
- Reporting safety violations
- Filing for workers' compensation
- Cooperating with an investigation

### The Power of Knowledge

Many employers count on workers not knowing their rights. A 2021 survey found that 40% of workers couldn't identify basic employment protections. Knowledge is your first line of defense. You don't need to be aggressive — you just need to know what you're entitled to and how to advocate for yourself professionally.`,
    },
    {
      id: "wr_rights_l2", moduleId: "wr_workplace_rights", lessonNumber: 2,
      title: "Workplace Harassment and Discrimination — Recognition and Response", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Harassment", "Discrimination", "Inappropriate But Not Illegal"],
        items: [
          { text: "A supervisor makes repeated sexual comments despite being asked to stop", category: "Harassment" },
          { text: "A qualified candidate is not promoted because of their race", category: "Discrimination" },
          { text: "A coworker occasionally tells annoying jokes unrelated to protected characteristics", category: "Inappropriate But Not Illegal" },
          { text: "An employee is paid less than colleagues doing the same work because of their gender", category: "Discrimination" },
          { text: "A manager creates a hostile environment by mocking an employee's religious practices", category: "Harassment" },
          { text: "A coworker is rude and difficult to work with toward everyone equally", category: "Inappropriate But Not Illegal" },
          { text: "Job postings that require a 'young, energetic' candidate", category: "Discrimination" },
          { text: "Persistent unwanted physical contact from a colleague", category: "Harassment" },
        ],
        instructions: "Classify each scenario correctly. Understanding the legal categories helps you respond appropriately.",
      }),
      content: `## Workplace Harassment and Discrimination — Recognition and Response

This lesson covers material that is serious and important. Workplace harassment and discrimination are real, they're common, and they disproportionately affect women, people of color, LGBTQ+ individuals, and people with disabilities. Knowing how to recognize and respond is essential.

### What Is Workplace Harassment?

Legal harassment occurs when unwelcome conduct based on a protected characteristic (race, color, religion, sex, national origin, age, disability, genetic information) becomes:
- **Severe:** A single incident so serious it creates a hostile environment, OR
- **Pervasive:** Repeated behavior that creates an intimidating, hostile, or offensive work environment

**Types of harassment:**

**Verbal:** Slurs, offensive jokes targeting protected groups, sexual comments, intimidation, threats
**Physical:** Unwanted touching, blocking movement, assault, invasion of personal space
**Visual:** Displaying offensive images, sharing inappropriate content, making obscene gestures
**Online/Digital:** Harassing emails, texts, or social media posts related to work

### What Is Workplace Discrimination?

Discrimination occurs when an employer makes job decisions based on protected characteristics rather than qualifications and performance:

- Not hiring someone because of their race or gender
- Paying different wages for the same work based on sex
- Denying promotions based on age, religion, or national origin
- Firing someone because of disability or pregnancy
- Creating requirements that disproportionately exclude protected groups without business justification

### Recognizing the Signs

Harassment and discrimination aren't always obvious. Watch for:
- Being excluded from meetings, projects, or social events based on identity
- Different standards applied to different groups
- "Jokes" that target specific identity groups
- Unwelcome personal questions about identity, religion, or family planning
- Subtle comments that undermine competence based on identity ("You're articulate — for your background")
- Patterns of certain groups being passed over for opportunities

### How to Respond

**If you're experiencing harassment or discrimination:**

1. **Name it (if safe to do so).** "That comment is inappropriate and I need you to stop." Clear, firm, professional. Many harassers count on targets staying silent.

2. **Document everything.** Date, time, location, what was said/done, who witnessed it. This is critical if you need to file a complaint later.

3. **Report it.** Use your employer's reporting procedure. Most companies have an HR department or hotline. Report in WRITING so there's a record.

4. **Know your protections.** Retaliation is illegal. If your employer retaliates for reporting, that's a separate legal violation.

5. **Seek external help if needed.** EEOC (federal), Texas Workforce Commission (state), or an employment attorney.

**If you witness harassment or discrimination:**

1. **Support the target.** Check in privately. "I saw what happened. That wasn't okay. How can I support you?"

2. **Speak up when safe.** "That's not appropriate" or "We don't talk to people that way here."

3. **Report what you saw.** Bystanders who report strengthen the target's case and contribute to a safer workplace.

4. **Don't minimize.** "It was just a joke" or "That's just how they are" enables harassment. Take it seriously.

### Prevention Is Everyone's Job

Creating a respectful workplace isn't just HR's responsibility:
- Don't participate in or tolerate offensive behavior
- Treat every person with dignity regardless of their role or identity
- Educate yourself about different perspectives and experiences
- Model the professional behavior you want to see
- Speak up when something isn't right

The workplace you help create is the workplace you work in. Make it one where everyone can contribute their best work.`,
    },
    {
      id: "wr_rights_l3", moduleId: "wr_workplace_rights", lessonNumber: 3,
      title: "Financial Literacy — Understanding Pay, Benefits, and Taxes", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Gross pay", right: "Your total earnings before any deductions — the number in your offer letter" },
          { left: "Net pay", right: "Your take-home pay after all taxes and deductions — what actually hits your bank account" },
          { left: "W-4 form", right: "Tells your employer how much federal income tax to withhold from your paycheck" },
          { left: "W-2 form", right: "Annual statement from your employer showing total earnings and taxes withheld — needed to file your tax return" },
          { left: "401(k) contribution", right: "Pre-tax retirement savings deducted from your paycheck — employer may match a percentage" },
          { left: "FICA taxes", right: "Social Security (6.2%) and Medicare (1.45%) — automatically deducted from every paycheck" },
        ],
        instructions: "Match each financial term to its correct definition. Understanding your paycheck is understanding your financial reality.",
      }),
      content: `## Financial Literacy — Understanding Pay, Benefits, and Taxes

Your first real paycheck will probably be smaller than you expected. That's because you didn't understand the difference between gross pay and net pay, or how taxes, benefits, and deductions work. This lesson fixes that.

### Reading Your Pay Stub

Every paycheck comes with a pay stub showing:

**Gross Pay:** Your total earnings before anything is taken out.
If you make $20/hour and work 40 hours: Gross pay = $800

**Deductions (what comes out):**
- **Federal income tax:** Based on your W-4 and tax bracket (10-37%)
- **State income tax:** Texas has NO state income tax (a real advantage)
- **FICA — Social Security:** 6.2% of your gross pay
- **FICA — Medicare:** 1.45% of your gross pay
- **Health insurance premium:** If you elect coverage (can be $50-$500/month for your share)
- **401(k) retirement:** If you choose to contribute (typically 3-10% of gross)
- **Other:** Dental, vision, life insurance, union dues, etc.

**Net Pay (Take-Home):** What's left after all deductions. Typically 65-80% of gross pay.

**Example:** $50,000 annual salary in Texas
- Gross monthly: ~$4,167
- Federal income tax: ~$500
- Social Security: ~$258
- Medicare: ~$60
- Health insurance: ~$200
- 401(k) at 5%: ~$208
- **Net monthly: ~$2,941** (about 70% of gross)

### Understanding Benefits

Benefits are part of your total compensation — sometimes worth 30-40% on top of salary:

**Health Insurance:** The most valuable benefit. Without employer-provided insurance, individual coverage can cost $400-$800/month. Key terms:
- **Premium:** Monthly cost (often split between you and employer)
- **Deductible:** Amount you pay before insurance starts covering costs
- **Copay:** Fixed amount you pay for each doctor visit or prescription
- **Out-of-pocket maximum:** The most you'll pay in a year — after this, insurance covers 100%

**Retirement (401k/403b):**
- You contribute pre-tax money (reduces your taxable income)
- Many employers MATCH your contribution up to a percentage (FREE MONEY)
- If your employer matches 100% up to 5%, contributing 5% means they ADD another 5% — that's an immediate 100% return on your investment
- **Rule #1 of financial adulting:** ALWAYS contribute enough to get the full employer match

**Paid Time Off (PTO):** Vacation days, sick days, personal days. Typical entry-level: 10-15 days/year.

**Other benefits to value:** Life insurance, disability insurance, tuition reimbursement, professional development budget, flexible schedule, remote work options.

### Taxes — The Basics

**Filing your taxes:**
Every year by April 15, you file a tax return with the IRS. Your W-2 from each employer tells you what you earned and what was withheld.

If too much was withheld → you get a refund
If too little was withheld → you owe money

**Tax brackets (2026 approximate, single filer):**
- $0 - $11,600: 10%
- $11,601 - $47,150: 12%
- $47,151 - $100,525: 22%
- And up from there...

**Important:** Tax brackets are MARGINAL. If you earn $50,000, you don't pay 22% on all $50,000. You pay 10% on the first $11,600, 12% on the next $35,550, and 22% only on the remaining portion.

### Negotiating Salary

Most entry-level workers accept the first offer. Don't.

**Do your research:** Know the market rate for your role, location, and experience level. Use Glassdoor, Bureau of Labor Statistics, and LinkedIn Salary.

**Negotiate professionally:** "Thank you for the offer. I'm very excited about this opportunity. Based on my research and the value I can bring, I was hoping we could discuss a salary of $X. Is there flexibility?"

**If they can't move on salary:** Negotiate other things — signing bonus, additional PTO, flexible schedule, professional development budget, earlier performance review.

**Know your worth:** Companies expect negotiation. You're not being greedy — you're being professional.`,
    },
  ]);

  // ---- wr_workplace_safety L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_safety_l1", moduleId: "wr_workplace_safety", lessonNumber: 1,
      title: "Workplace Safety — OSHA Standards and Your Responsibilities", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "OSHA", right: "Occupational Safety and Health Administration — federal agency enforcing workplace safety standards" },
          { left: "PPE", right: "Personal Protective Equipment — gear required to protect workers from specific hazards" },
          { left: "MSDS/SDS", right: "Safety Data Sheets — detailed information about hazardous chemicals in the workplace" },
          { left: "Workers' Compensation", right: "Insurance providing wage replacement and medical benefits for work-related injuries" },
          { left: "Near miss", right: "An unplanned event that didn't result in injury but had the potential to — must be reported" },
          { left: "Ergonomics", right: "Designing workspaces and tasks to fit human capabilities and reduce strain injuries" },
        ],
        instructions: "Match each workplace safety term to its correct definition.",
      }),
      content: `## Workplace Safety — OSHA Standards and Your Responsibilities

Workplace injuries are not just statistics. Every year, approximately 2.6 million workers in the US suffer nonfatal workplace injuries, and about 5,000 workers die from workplace incidents. Safety isn't bureaucratic red tape — it saves lives.

### OSHA — Your Safety Watchdog

The Occupational Safety and Health Administration (OSHA) was created in 1970 after a year when 14,000 workers died on the job. Its mission: ensure safe and healthful working conditions.

**Your OSHA rights as a worker:**
- Work in a safe environment
- Receive safety training in a language you understand
- Access information about hazards, safety procedures, and injury records
- Report unsafe conditions without fear of retaliation
- Request an OSHA inspection if you believe conditions are unsafe
- Refuse dangerous work that could cause serious injury or death

**Your employer's OSHA responsibilities:**
- Provide a workplace free from recognized hazards
- Train workers on safety procedures and hazard recognition
- Provide required personal protective equipment (PPE) at no cost
- Maintain injury and illness records
- Display the OSHA poster informing workers of their rights

### The Big Four Hazard Categories

**1. Safety Hazards** (most common)
- Slips, trips, and falls
- Working from heights
- Unguarded machinery
- Electrical hazards
- Vehicle/equipment operations

**2. Chemical Hazards**
- Cleaning products, solvents, fuels, pesticides
- Safety Data Sheets (SDS) must be available for every chemical
- Proper ventilation, PPE, and storage required

**3. Biological Hazards**
- Bacteria, viruses, mold, animal waste
- Common in healthcare, food service, agriculture, laboratory work
- Prevention: hand hygiene, PPE, vaccinations, proper disposal

**4. Ergonomic Hazards**
- Repetitive motions (typing, assembly line work)
- Poor posture and workstation setup
- Heavy lifting with improper technique
- Prolonged standing or sitting

### Safety in Modern Workplaces

Even if you work in an office, safety matters:
- **Ergonomic setup:** Monitor at eye level, feet flat on floor, wrists neutral while typing
- **Fire safety:** Know two exit routes, location of fire extinguishers, and assembly point
- **Emergency procedures:** Know what to do for fire, severe weather, active shooter
- **Mental health:** Excessive workload, harassment, and toxic culture are safety hazards too

### Your Responsibilities

Safety is not just the employer's job. As a worker, you must:
- Follow all safety rules and procedures
- Use required PPE correctly and consistently
- Report hazards, near misses, and unsafe conditions immediately
- Participate in safety training
- Look out for your coworkers — safety is a team effort
- Never operate equipment you haven't been trained on
- Never work under the influence of substances that impair judgment

### If You're Injured at Work

1. **Report the injury immediately** — even if it seems minor
2. **Seek medical attention** — don't "tough it out"
3. **Document everything** — date, time, circumstances, witnesses
4. **File a workers' compensation claim** — this is your right
5. **Know that retaliation is illegal** — your employer cannot punish you for reporting an injury`,
    },
    {
      id: "wr_safety_l2", moduleId: "wr_workplace_safety", lessonNumber: 2,
      title: "Digital Safety and Cybersecurity in the Workplace", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Do This", "Never Do This"],
        items: [
          { text: "Use unique, complex passwords for each work account", category: "Do This" },
          { text: "Click a link in an unexpected email from 'IT Department' asking you to verify your password", category: "Never Do This" },
          { text: "Enable two-factor authentication on all work accounts", category: "Do This" },
          { text: "Use public WiFi to access company systems without a VPN", category: "Never Do This" },
          { text: "Report a suspicious email to IT rather than clicking anything", category: "Do This" },
          { text: "Share your login credentials with a coworker who needs access", category: "Never Do This" },
          { text: "Lock your computer screen every time you step away from your desk", category: "Do This" },
          { text: "Download software from the internet onto your work computer without IT approval", category: "Never Do This" },
        ],
        instructions: "Classify each action as safe practice or dangerous behavior. In the modern workplace, cybersecurity is everyone's responsibility.",
      }),
      content: `## Digital Safety and Cybersecurity in the Workplace

In the modern workplace, your digital behavior can protect or endanger your entire organization. A single clicked phishing link can cost a company millions. Cybersecurity isn't just IT's job — it's yours.

### The Threat Landscape

**Phishing:** Fake emails, texts, or messages designed to trick you into revealing credentials, clicking malicious links, or downloading malware. This is the #1 cyberattack method.

**How to recognize phishing:**
- Urgent language: "Your account will be suspended!" "Act now!"
- Slightly wrong email addresses: john@company-support.com instead of john@company.com
- Generic greetings: "Dear Employee" instead of your name
- Requests for sensitive information via email (legitimate companies never do this)
- Links that don't match the displayed text (hover to check before clicking)
- Unexpected attachments from unknown senders

**Social Engineering:** Manipulation techniques that exploit human psychology rather than technical vulnerabilities:
- Pretexting (creating a false scenario to gain trust)
- Baiting (offering something enticing that contains malware)
- Tailgating (following an authorized person into a secure area)
- Quid pro quo (offering help in exchange for information)

### Password Security

**The math:** A 6-character password can be cracked in seconds. A 12-character password with mixed characters could take thousands of years.

**Best practices:**
- Use 12+ characters with uppercase, lowercase, numbers, and symbols
- Never reuse passwords across accounts
- Use a password manager (Bitwarden, 1Password, LastPass)
- Enable two-factor authentication (2FA) on every account that supports it
- Never share passwords — even with your manager (they shouldn't ask)

### Data Protection

Every organization handles sensitive data. Your responsibility:

**Classify before sharing:**
- Public information: OK to share freely
- Internal information: OK within the organization
- Confidential: Only with authorized individuals
- Restricted: Highest protection level — regulated data (financial, medical, personal)

**Practical rules:**
- Don't discuss confidential work in public places
- Don't leave sensitive documents on your desk (clean desk policy)
- Encrypt sensitive emails and files
- Use secure file sharing (not personal email or social media)
- Report lost or stolen devices immediately

### AI-Specific Cybersecurity

As AI tools become standard in workplaces, new security risks emerge:
- Don't paste confidential company data into public AI tools
- Don't share customer information, financial data, or trade secrets with AI chatbots
- Be aware that AI-generated phishing emails are increasingly sophisticated
- AI can be used to create deepfake voice calls impersonating executives
- Verify unusual requests through a separate communication channel

### Your Digital Responsibility

In the modern workplace, every employee is a security checkpoint. The strongest firewalls and antivirus software can't protect against a human who clicks a phishing link or shares their password. Your awareness and behavior are the first line of defense.`,
    },
    {
      id: "wr_safety_l3", moduleId: "wr_workplace_safety", lessonNumber: 3,
      title: "Emergency Preparedness and Mental Health Safety", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Fire alarm sounds", right: "Leave immediately by the nearest exit. Do not use elevators. Go to the designated assembly point." },
          { left: "Active threat/shooter", right: "Run if possible, hide if not, fight only as last resort. Call 911 when safe." },
          { left: "Severe weather warning", right: "Move to interior rooms on lowest floor. Stay away from windows. Follow facility-specific procedures." },
          { left: "Medical emergency", right: "Call 911. Provide first aid if trained. Do not move the person unless in immediate danger." },
          { left: "Chemical spill", right: "Evacuate the immediate area. Do not attempt cleanup unless trained. Report to supervisor and emergency services." },
          { left: "Coworker showing signs of extreme distress", right: "Listen without judgment. Ask directly if they need help. Connect them with EAP or crisis resources." },
        ],
        instructions: "Match each emergency scenario to the correct response. Knowing what to do before an emergency happens saves lives.",
      }),
      content: `## Emergency Preparedness and Mental Health Safety

Every workplace should prepare you for physical emergencies. Fewer prepare you for mental health crises — but both can be life-threatening. This lesson covers both.

### Physical Emergency Preparedness

**Every first day at a new job, identify:**
1. Two exit routes from your workspace
2. Location of fire extinguishers and first aid kits
3. Location of the AED (automated external defibrillator)
4. The designated assembly point for evacuations
5. Emergency contact numbers (posted in common areas)
6. Your building's emergency action plan (ask your supervisor)

**Fire Response:**
- When the alarm sounds, leave IMMEDIATELY
- Don't stop to gather belongings
- Use stairs, never elevators
- Close doors behind you (this slows fire spread)
- Go to the assembly point and report to your supervisor
- Don't re-enter until emergency services clear the building

**Active Threat Response (Run-Hide-Fight):**
- **RUN:** If there's a safe escape path, take it. Leave belongings. Help others if possible without putting yourself at risk.
- **HIDE:** If you can't run, find a secure room. Lock and barricade the door. Silence your phone. Stay quiet and hidden.
- **FIGHT:** Only as an absolute last resort. Act with aggression. Use anything available to defend yourself.
- Call 911 when it's safe to do so.

**Medical Emergency:**
- Call 911 immediately for serious injuries or illness
- If trained in first aid/CPR, provide assistance
- Don't move an injured person unless they're in immediate danger
- Stay calm and provide information to emergency responders

### Mental Health Safety in the Workplace

Mental health IS workplace safety. Untreated mental health challenges lead to:
- Increased workplace accidents
- Decreased productivity and concentration
- Higher turnover and absenteeism
- Interpersonal conflict

**Recognizing distress in yourself:**
- Persistent anxiety or dread about going to work
- Difficulty concentrating or making decisions
- Physical symptoms: headaches, stomach problems, sleep disruption
- Withdrawal from coworkers and activities
- Increased irritability or emotional reactions
- Using substances to cope with work stress

**Recognizing distress in coworkers:**
- Sudden changes in behavior or performance
- Withdrawal from team activities
- Increased absences
- Expressions of hopelessness or worthlessness
- Talking about feeling trapped or being a burden

**What to do:**
- For yourself: Use your Employee Assistance Program (EAP) — free, confidential counseling provided by most employers. Talk to your doctor. Set boundaries. It's not weakness — it's maintenance.
- For others: Ask directly — "I've noticed you seem down lately. Are you okay? Is there anything I can do?" Listen without judgment. Share EAP and crisis resources. If someone is in immediate danger, call 988 (Suicide & Crisis Lifeline) or 911.

### Burnout Prevention

Burnout is not just "being tired." It's a state of chronic workplace stress characterized by:
- Emotional exhaustion (feeling drained and unable to cope)
- Depersonalization (cynicism and detachment from your work)
- Reduced personal accomplishment (feeling ineffective)

**Prevention strategies:**
- Set clear boundaries between work and personal time
- Use your PTO — it exists for a reason
- Communicate workload concerns before reaching a breaking point
- Maintain relationships and activities outside of work
- Move your body regularly — exercise is the most evidence-based stress intervention
- Sleep 7-9 hours — everything is harder when you're exhausted

### Creating a Safe Culture

Safety culture isn't about posters on the wall. It's about:
- Leaders who model safe behavior and mental health openness
- Workers who look out for each other
- An environment where reporting concerns is encouraged, not punished
- Regular training that's taken seriously
- Continuous improvement based on incidents and near-misses

**You contribute to safety culture by:** Following procedures, speaking up about hazards, supporting coworkers, and treating safety as a value — not a checkbox.`,
    },
  ]);

  // ---- wr_time_management L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_time_l1", moduleId: "wr_time_management", lessonNumber: 1,
      title: "Time Management — The Eisenhower Matrix and Priority Setting", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Urgent + Important (Do First)", "Important + Not Urgent (Schedule)", "Urgent + Not Important (Delegate)", "Neither (Eliminate)"],
        items: [
          { text: "Project deadline is tomorrow and you haven't started", category: "Urgent + Important (Do First)" },
          { text: "Building skills that will advance your career next year", category: "Important + Not Urgent (Schedule)" },
          { text: "A coworker asks you to attend a meeting you're not needed in", category: "Urgent + Not Important (Delegate)" },
          { text: "Scrolling social media during work hours", category: "Neither (Eliminate)" },
          { text: "Client has an emergency that only you can resolve", category: "Urgent + Important (Do First)" },
          { text: "Planning your professional development for the quarter", category: "Important + Not Urgent (Schedule)" },
          { text: "Responding to a non-critical email within minutes of receiving it", category: "Urgent + Not Important (Delegate)" },
          { text: "Attending to a task that no longer serves any purpose but 'we've always done it'", category: "Neither (Eliminate)" },
        ],
        instructions: "Sort each task into the correct quadrant of the Eisenhower Matrix. How you spend your time determines your career trajectory.",
      }),
      content: `## Time Management — The Eisenhower Matrix and Priority Setting

"I don't have time" is almost never true. What's true is "I haven't prioritized this." Time management isn't about doing more — it's about doing the RIGHT things.

### The Eisenhower Matrix

President Eisenhower said: "What is important is seldom urgent, and what is urgent is seldom important." This insight becomes a powerful decision-making tool:

**Quadrant 1: Urgent + Important → DO FIRST**
Crises, deadlines, emergencies. These demand immediate attention.
But if you're ALWAYS in Q1, something is wrong — you're not planning or preventing well enough.

**Quadrant 2: Important + Not Urgent → SCHEDULE**
This is where growth happens: skill development, relationship building, planning, health, strategic thinking.
Most people neglect Q2 because it never screams for attention. But Q2 activities PREVENT Q1 crises.

**Quadrant 3: Urgent + Not Important → DELEGATE or minimize**
Interruptions, some meetings, many emails. They feel urgent but don't advance your goals.
Learn to say: "Can this wait?" or "Is there someone better suited to handle this?"

**Quadrant 4: Not Urgent + Not Important → ELIMINATE**
Time-wasters: excessive social media, busywork, activities that don't serve any purpose.
Be honest about how much time you spend here.

### The 80/20 Rule (Pareto Principle)

Roughly 80% of your results come from 20% of your efforts. The key is identifying which 20% produces the most value:
- Which tasks directly advance your most important goals?
- Which activities produce measurable outcomes?
- Which relationships create the most opportunities?

Focus your best energy and attention on the high-impact 20%.

### Practical Time Management Techniques

**Time Blocking:**
Schedule specific blocks for specific types of work:
- 8:00-10:00: Deep work (complex, creative, high-concentration tasks)
- 10:00-11:00: Meetings and collaboration
- 11:00-12:00: Communication (email, messages, follow-ups)
- 1:00-3:00: Deep work
- 3:00-4:00: Administrative tasks
- 4:00-5:00: Planning and preparation for tomorrow

**The Two-Minute Rule:**
If a task takes less than 2 minutes, do it immediately. If it takes longer, schedule it.

**Eat the Frog:**
Do your most difficult or dreaded task FIRST each day. Once it's done, everything else feels easier.

**Batch Similar Tasks:**
Group similar activities: answer all emails at once, make all phone calls in sequence, complete all data entry together. Context-switching between different types of tasks wastes significant mental energy.

### Planning Rhythms

**Daily:** Spend 10 minutes each evening planning tomorrow. Identify your top 3 priorities.
**Weekly:** Spend 30 minutes on Sunday or Monday reviewing the week ahead. What are the must-accomplish items?
**Monthly:** Review progress toward larger goals. What's working? What needs to change?
**Quarterly:** Evaluate your direction. Are you spending time on what matters most?

### The Productivity Trap

Busyness is not productivity. You can be extremely busy and accomplish nothing important. The most productive people aren't the ones who work the most hours — they're the ones who work on the right things.

Ask yourself regularly: "Is this the most important thing I could be doing right now?" If the answer is no, stop and switch.`,
    },
    {
      id: "wr_time_l2", moduleId: "wr_time_management", lessonNumber: 2,
      title: "Goal Setting — SMART Goals and Accountability Systems", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "I want to be healthier", right: "Vague — no measurement, no timeline, no specific action" },
          { left: "I will exercise for 30 minutes, 4 days per week, for the next 3 months and track my workouts in a journal", right: "SMART — Specific, Measurable, Achievable, Relevant, Time-bound" },
          { left: "I want to make more money", right: "Vague — no target, no strategy, no deadline" },
          { left: "I will earn my CompTIA A+ certification by September 2026 by studying 1 hour daily using the official study guide", right: "SMART — clear target, timeline, and daily action plan" },
          { left: "I should read more books", right: "Vague — no number, no timeline, no accountability" },
          { left: "I will read 2 professional development books per month for the next 6 months and write a 1-page summary of key takeaways for each", right: "SMART — specific quantity, timeline, and output that demonstrates learning" },
        ],
        instructions: "Match each goal to its evaluation. Vague goals fail. SMART goals succeed because they build in accountability.",
      }),
      content: `## Goal Setting — SMART Goals and Accountability Systems

Dreams without goals are wishes. Goals without plans are fantasies. Plans without accountability are procrastination. This lesson teaches you to build the entire chain.

### The SMART Framework

Every professional goal should be:

**S — Specific:** What exactly will you accomplish? Not "do better at work" but "complete the project management certification."

**M — Measurable:** How will you know you've achieved it? Not "improve my skills" but "pass the PMP exam with a score of 70% or higher."

**A — Achievable:** Is this realistic given your current resources, time, and circumstances? Ambitious is good. Impossible is demotivating.

**R — Relevant:** Does this goal align with your larger career or life objectives? A goal that doesn't connect to your bigger picture wastes your limited time.

**T — Time-bound:** When will you achieve this? Not "someday" but "by December 31, 2026."

### Breaking Big Goals into Milestones

A big goal like "Build a career in technology" is overwhelming. Break it down:

**Annual goal:** Earn CompTIA A+ certification and secure an entry-level IT position
**Quarterly milestones:**
- Q1: Complete first half of study material, pass 2 practice exams
- Q2: Complete study material, pass final practice exam, schedule certification test
- Q3: Pass certification exam, update resume, begin job applications
- Q4: Apply to 20 positions, attend 2 networking events, secure employment

**Weekly actions:**
- Study 5 hours per week (1 hour daily, M-F)
- Complete one practice module per week
- Connect with one IT professional on LinkedIn per week

### Accountability Systems

Goals without accountability have a ~10% success rate. Goals with accountability systems have a ~70% success rate. Build accountability:

**1. Public commitment:** Tell someone your goal. The social pressure to follow through is powerful.

**2. Progress tracking:** Use a visible tracking system (spreadsheet, journal, app, calendar). Seeing progress motivates continued effort. Seeing stagnation motivates course correction.

**3. Accountability partner:** Find someone pursuing similar goals. Check in weekly. Share progress and obstacles. Hold each other to commitments.

**4. Reward milestones:** Celebrate when you hit milestones. Not just the final achievement — the intermediate wins that keep you going.

**5. Review and adjust:** Every month, review: Am I on track? What's working? What needs to change? Adjust your plan — not your goal.

### Common Goal-Setting Mistakes

**Too many goals:** Focus on 3-5 goals at a time. More than that splits your attention too thin.

**All-or-nothing thinking:** Missing one day doesn't mean failure. It means you're human. Get back on track tomorrow.

**No flexibility:** Life happens. Rigid plans break. Build in buffer time and be willing to adjust timelines while maintaining the goal.

**Comparing to others:** Your timeline is yours. Someone else's speed doesn't change your path.

**Forgetting why:** When motivation drops, reconnect with WHY this goal matters. The emotional fuel of purpose sustains effort when willpower fades.

### Your Professional Development Plan

Write 3 SMART goals for the next 12 months:
1. One skill development goal (certification, course completion, or skill mastery)
2. One career advancement goal (job, promotion, raise, or professional milestone)
3. One personal growth goal that supports your career (health, networking, financial)

For each goal, create:
- Quarterly milestones
- Weekly action items
- An accountability system
- A progress tracking method`,
    },
    {
      id: "wr_time_l3", moduleId: "wr_time_management", lessonNumber: 3,
      title: "Project Management Basics — Planning and Executing Work", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Planning Phase", "Execution Phase", "Closing Phase"],
        items: [
          { text: "Define project scope, objectives, and deliverables", category: "Planning Phase" },
          { text: "Assign tasks to team members and begin work", category: "Execution Phase" },
          { text: "Conduct lessons-learned review with the team", category: "Closing Phase" },
          { text: "Create a timeline with milestones and deadlines", category: "Planning Phase" },
          { text: "Track progress and adjust plans as obstacles arise", category: "Execution Phase" },
          { text: "Document outcomes and archive project files", category: "Closing Phase" },
          { text: "Identify risks and create mitigation strategies", category: "Planning Phase" },
          { text: "Hold regular check-ins to monitor status and resolve blockers", category: "Execution Phase" },
        ],
        instructions: "Sort each activity into the correct project phase. Understanding the phases helps you lead projects successfully.",
      }),
      content: `## Project Management Basics — Planning and Executing Work

Every job involves projects — tasks with a beginning, a middle, and an end. Whether you manage projects formally or informally, understanding project management basics makes you more effective, more reliable, and more promotable.

### The Project Lifecycle

**Phase 1: Initiation**
- What are we trying to accomplish?
- Why does this project matter?
- Who are the stakeholders?
- What does success look like?
- Is this project worth doing?

**Phase 2: Planning**
- Define the scope: What's included and what's NOT included?
- Break the work into tasks (Work Breakdown Structure)
- Estimate time for each task
- Identify dependencies (what must happen before what?)
- Assign responsibilities
- Create the timeline
- Identify risks and plan responses
- Get stakeholder approval on the plan

**Phase 3: Execution**
- Do the work according to the plan
- Track progress against the timeline
- Communicate status regularly
- Solve problems as they arise
- Adjust plans when necessary (scope changes, delays, resource issues)
- Document decisions and changes

**Phase 4: Closing**
- Deliver the final product/outcome
- Get stakeholder acceptance
- Conduct a lessons-learned review
- Document what worked, what didn't, and what to do differently
- Archive project files
- Celebrate the team's accomplishment

### Essential Project Management Tools

**The Work Breakdown Structure (WBS):**
Break a large project into smaller, manageable tasks:
- Project: Plan a community health fair
  - Task 1: Secure venue (research locations, visit sites, negotiate cost, sign contract)
  - Task 2: Recruit vendors (identify potential vendors, send invitations, confirm participants)
  - Task 3: Marketing (design flyer, create social media posts, distribute to community partners)
  - Task 4: Logistics (plan layout, arrange tables/chairs, coordinate setup crew, plan cleanup)
  - Task 5: Day-of execution (setup, run event, breakdown, collect feedback)

**The Gantt Chart:**
A visual timeline showing tasks, durations, and dependencies. Many free tools available (Google Sheets, Trello, Asana free tier).

**The Status Report:**
Weekly or bi-weekly update covering:
- What was accomplished since last report
- What's planned for next period
- Risks, issues, or blockers
- Any scope or timeline changes needed

### Leading Without Authority

You don't need to be a manager to lead a project. Project leadership skills:

**Communication:** Keep everyone informed. Over-communicate rather than under-communicate.
**Organization:** Track tasks, deadlines, and assignments systematically.
**Problem-solving:** When obstacles arise, propose solutions rather than just identifying problems.
**Accountability:** Follow through on your commitments and hold others to theirs (professionally).
**Adaptability:** Plans change. Be the person who adjusts calmly rather than panicking.

### The Professional Difference

The workers who get promoted are often the ones who can manage projects — even informally. When your boss says "Can someone handle this?" and you step up with a plan, a timeline, and clear communication, you demonstrate leadership. That's how careers are built.`,
    },
  ]);

  // ---- wr_work_ethic_leadership L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_ethic_l1", moduleId: "wr_work_ethic_leadership", lessonNumber: 1,
      title: "Work Ethic — Reliability, Initiative, and Professional Growth", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Completing every task on time, every time, without reminders", right: "Reliability — the foundation of professional trust" },
          { left: "Identifying a problem and proposing a solution before being asked", right: "Initiative — the trait that separates average from exceptional employees" },
          { left: "Asking for feedback on your work and actually implementing it", right: "Growth mindset — demonstrating commitment to continuous improvement" },
          { left: "Doing the minimum required and watching the clock until quitting time", right: "Low work ethic — noticed by every supervisor and remembered during promotion decisions" },
          { left: "Helping a struggling coworker complete their work when you've finished yours", right: "Teamwork and service orientation — valued in every workplace" },
          { left: "Taking responsibility when you make a mistake instead of making excuses", right: "Accountability — the character trait that builds lasting professional reputation" },
        ],
        instructions: "Match each workplace behavior to the professional quality it demonstrates.",
      }),
      content: `## Work Ethic — Reliability, Initiative, and Professional Growth

Talent gets you in the door. Work ethic keeps you in the room. The most talented person who is unreliable will always lose to a moderately talented person who shows up every day, does excellent work, and continually improves.

### The Three Pillars of Work Ethic

**Pillar 1: Reliability**
Being reliable means people can count on you. Period.
- You do what you say you'll do
- You meet deadlines without excuses
- You show up on time, prepared
- You follow through on commitments
- You communicate proactively when issues arise

Reliability is boring. It's not flashy. And it is the SINGLE most valuable trait in a new employee. Managers will forgive skill gaps in reliable people. They will not keep unreliable people regardless of talent.

**Pillar 2: Initiative**
Initiative means seeing what needs to be done and doing it — without being asked.
- Notice a process that could be improved? Propose the improvement.
- Finish your work early? Ask your supervisor what else you can help with.
- See a problem emerging? Raise it before it becomes a crisis.
- Learn a new skill that could benefit the team? Share it.

Initiative is what separates "good employees" from "future leaders."

**Pillar 3: Continuous Improvement**
The professional world changes constantly. The workers who thrive are the ones who never stop learning:
- Seek feedback regularly and implement it
- Stay current in your field (read industry publications, attend webinars, pursue certifications)
- Learn from mistakes — document what went wrong and what you'll do differently
- Develop skills outside your immediate job requirements
- Build relationships with people who challenge you to grow

### What Employers Actually Value

Multiple employer surveys consistently rank these traits above technical skills:

1. **Dependability/reliability** — 93% of employers rate this as critical
2. **Integrity/honesty** — 90%
3. **Communication skills** — 89%
4. **Work ethic/initiative** — 88%
5. **Adaptability** — 85%
6. **Technical skills specific to the job** — 78%

Notice that technical skills rank BELOW character and communication traits. You can teach skills. You can't easily teach character.

### Building Your Professional Reputation

Your reputation is built one interaction at a time:
- Every email is an impression
- Every deadline met (or missed) is noted
- Every interaction with a coworker shapes how you're perceived
- Every response to feedback reveals your character
- Every challenge is an opportunity to demonstrate (or undermine) your reputation

**The compound effect:** Small, consistent positive actions compound over time. The person who consistently delivers quality work, communicates proactively, and treats everyone with respect builds a reputation that opens doors for decades.

### Career Leadership

You don't have to manage people to be a leader. Leadership is:
- Setting the standard through your own behavior
- Lifting others up rather than competing against them
- Speaking up when something isn't right
- Taking responsibility for outcomes, not just tasks
- Making the people around you better at their jobs

The best leaders don't say "follow me." They demonstrate excellence so consistently that others naturally want to follow.`,
    },
    {
      id: "wr_ethic_l2", moduleId: "wr_work_ethic_leadership", lessonNumber: 2,
      title: "Teamwork — Collaboration, Conflict Resolution, and Communication", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Effective Team Behavior", "Ineffective Team Behavior"],
        items: [
          { text: "Listening fully before responding to a teammate's idea", category: "Effective Team Behavior" },
          { text: "Taking credit for the team's work in front of the boss", category: "Ineffective Team Behavior" },
          { text: "Raising disagreements respectfully with specific alternatives", category: "Effective Team Behavior" },
          { text: "Agreeing with everything to avoid conflict, then complaining later", category: "Ineffective Team Behavior" },
          { text: "Sharing information proactively so teammates aren't blindsided", category: "Effective Team Behavior" },
          { text: "Doing all the work yourself because 'it's faster that way'", category: "Ineffective Team Behavior" },
          { text: "Acknowledging teammates' contributions publicly", category: "Effective Team Behavior" },
          { text: "Sending passive-aggressive messages instead of having direct conversations", category: "Ineffective Team Behavior" },
        ],
        instructions: "Classify each behavior. Teamwork is a skill — and these are the specific behaviors that make teams work (or fail).",
      }),
      content: `## Teamwork — Collaboration, Conflict Resolution, and Communication

Almost every job requires working with other people. The ability to collaborate effectively — to communicate clearly, resolve conflicts constructively, and contribute to a team's success — is one of the most consistently demanded skills across every industry.

### What Makes Teams Work

Research (most notably Google's Project Aristotle) identified the factors that make teams effective:

**#1: Psychological Safety** — Team members feel safe taking risks, admitting mistakes, and sharing ideas without fear of punishment or humiliation. This is BY FAR the most important factor.

**#2: Dependability** — Every team member reliably completes quality work on time.

**#3: Structure & Clarity** — Everyone understands their role, the plan, and the goals.

**#4: Meaning** — The work matters to the team members personally.

**#5: Impact** — The team believes their work makes a difference.

### Communication in Teams

**Active Listening:**
- Focus fully on the speaker (put down the phone)
- Don't plan your response while they're talking
- Paraphrase what you heard: "So what you're saying is..."
- Ask clarifying questions before disagreeing
- Acknowledge emotions: "I can see this is important to you"

**Clear Communication:**
- State your point upfront, then provide supporting details
- Be specific: "I need the report by 3 PM Thursday" not "I need it soon"
- Match your communication channel to the message (complex = meeting, simple = email, urgent = phone/text)
- Confirm understanding: "Just to make sure we're aligned — you'll handle X and I'll handle Y?"

**Difficult Conversations:**
- Address issues directly but respectfully
- Focus on behavior, not personality: "The report had errors" not "You're careless"
- Use "I" statements: "I felt frustrated when the deadline was missed" not "You always miss deadlines"
- Propose solutions, not just problems: "Here's what I think we could do differently"

### Conflict Resolution

Conflict in teams is normal and can be healthy if handled well:

**Step 1: Acknowledge the conflict**
Ignoring conflict makes it worse. Name it: "I think we see this differently. Let's talk it through."

**Step 2: Listen to understand (not to win)**
Each person shares their perspective without interruption. The goal is understanding, not agreement.

**Step 3: Identify shared interests**
Even in disagreement, you usually share a goal: "We both want the project to succeed."

**Step 4: Generate options**
Brainstorm solutions together. Don't lock into positions — explore possibilities.

**Step 5: Agree on a path forward**
Choose a solution you can both support. Document what was agreed. Follow up.

### Giving and Receiving Feedback

**Giving feedback:**
- Be timely (don't wait months)
- Be specific (not "good job" but "the way you organized the client data made the analysis much clearer")
- Balance: acknowledge strengths AND identify areas for growth
- Make it actionable: "Next time, try starting with the executive summary"

**Receiving feedback:**
- Listen without defending
- Thank the person (it takes courage to give honest feedback)
- Ask clarifying questions
- Take time to process before responding emotionally
- Implement what's useful

### Your Role on Any Team

Regardless of your title or seniority:
- Contribute your best work consistently
- Communicate proactively and clearly
- Support teammates who are struggling
- Share credit generously
- Take responsibility for problems
- Bring solutions, not just complaints
- Be someone others want to work with`,
    },
    {
      id: "wr_ethic_l3", moduleId: "wr_work_ethic_leadership", lessonNumber: 3,
      title: "Career Planning — Building Your Professional Path", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Resume", right: "A 1-2 page summary of your experience, skills, and education — your marketing document" },
          { left: "Cover letter", right: "A personalized letter explaining WHY you want THIS specific job at THIS specific company" },
          { left: "LinkedIn profile", right: "Your professional online presence — 85% of recruiters use this to find candidates" },
          { left: "Professional network", right: "The relationships you build with people in your field — 70% of jobs are filled through networking" },
          { left: "Portfolio", right: "A collection of your best work samples that demonstrate your capabilities to potential employers" },
          { left: "Informational interview", right: "A conversation with a professional in your target field to learn about the work, not to ask for a job" },
        ],
        instructions: "Match each career tool to its description and purpose.",
      }),
      content: `## Career Planning — Building Your Professional Path

A career doesn't just happen to you. It's built intentionally through planning, preparation, and strategic action. Whether you're heading to college, trade school, the military, or directly into the workforce, this lesson gives you the tools to build your path.

### Self-Assessment — Know Yourself First

Before planning a career, understand yourself:

**Skills inventory:** What are you good at? Not just school subjects — include soft skills (communication, leadership, problem-solving), technical skills (computer skills, languages, certifications), and practical skills (driving, cooking, construction).

**Interest exploration:** What topics make you lose track of time? What problems do you want to solve? What activities energize rather than drain you?

**Values clarification:** What matters most to you in work? Options include: helping others, earning high income, work-life balance, creative freedom, job security, leadership opportunities, making a difference, working outdoors, working with technology.

**Personality fit:** Are you energized by working with people or independently? Do you prefer routine or variety? Do you thrive under pressure or in calm environments? Do you prefer leading or supporting?

### Career Research

Once you know yourself, research careers that match:

**Bureau of Labor Statistics (bls.gov/ooh):** The Occupational Outlook Handbook provides:
- Job descriptions and daily responsibilities
- Education and training requirements
- Median salary
- Job growth projections
- Similar occupations

**Key questions for any career:**
- What does a typical day look like?
- What education or training is required?
- What's the salary range (entry-level through experienced)?
- Is the field growing or shrinking?
- What's the work-life balance like?
- What advancement opportunities exist?

### Building Your Professional Toolkit

**Your Resume:**
- Keep it to 1 page (until you have 10+ years of experience)
- Lead with your strongest qualifications
- Use action verbs: "Led," "Created," "Managed," "Increased," "Designed"
- Quantify results: "Increased sales 20%" not "Helped with sales"
- Tailor it for each application
- Proofread. Then proofread again. Then have someone else proofread.

**Your LinkedIn:**
- Professional photo (doesn't need to be expensive — just professional)
- Compelling headline beyond just your job title
- Summary that tells your professional story
- Complete experience section with accomplishments (not just duties)
- Skills section with endorsements
- Active engagement: share industry content, comment thoughtfully, connect with professionals

**Your Network:**
- 70% of jobs are filled through networking
- Attend industry events, join professional organizations, connect with alumni
- Build relationships BEFORE you need something
- Give before you ask — share resources, make introductions, offer help
- Follow up and maintain connections

### The Career Ladder vs. The Career Lattice

**Old model (ladder):** One path straight up — entry level → manager → director → VP
**New model (lattice):** Multiple paths — lateral moves, skill pivots, industry changes, entrepreneurship

The lattice model reflects reality. Your career will likely include:
- Multiple employers (average tenure is ~4 years for young professionals)
- At least one career pivot
- Continuous skill development
- Both traditional and non-traditional roles
- Possible entrepreneurship or freelancing

### Your Career Action Plan

Create a 5-year career action plan:
**Year 1:** Foundation — complete education/certification, build professional presence, gain entry-level experience
**Year 2:** Development — deepen skills, expand network, seek increasing responsibility
**Year 3:** Growth — pursue advanced training, lead projects, build expertise
**Year 4:** Advancement — seek promotion or strategic career move, mentor others
**Year 5:** Leadership — take on leadership responsibilities, contribute to your field, plan next phase

This plan will change. That's fine. Having a direction you can adjust is infinitely better than drifting.`,
    },
  ]);

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

The ability to communicate clearly is the #1 skill employers look for — above technical ability, above education, above experience. Whether you become a doctor, an engineer, a teacher, or an entrepreneur, your career will be built on how well you communicate.

### The Three Communication Registers

**Casual:** How you talk to friends. Relaxed language, slang, incomplete sentences, emojis in texts. Perfectly appropriate with peers in social settings.

**Semi-formal:** How you communicate with teachers, coaches, and supervisors. Polite, clear, complete sentences, proper grammar. Respectful but not stiff.

**Formal:** How you communicate in professional settings. Job interviews, presentations, official emails, business meetings. Organized, professional language, practiced delivery.

**The skill:** Knowing which register fits each situation. Using casual language in a formal setting makes you look unprepared. Using formal language with friends makes you look disconnected.

### Written Communication

**Email structure that works every time:**
1. **Clear subject line:** "Science Project Question — Period 3" (not "hey")
2. **Greeting:** "Hi Ms. Rodriguez," (not "yo")
3. **Purpose in first sentence:** "I'm writing to ask about..."
4. **Details in the middle:** Keep it brief and organized
5. **Clear closing:** What do you need? By when? "Could you let me know by Friday?"
6. **Sign off:** "Thank you, [Your name]"

**Proofread everything.** Read it once for content, once for grammar, once for tone. Would you be comfortable if this email was read out loud to the whole class? If not, revise it.

### Speaking and Presenting

**Preparation:**
- Know your material (don't read from slides)
- Practice out loud (not just in your head)
- Time yourself (stay within your limit)
- Prepare for questions (what might people ask?)

**Delivery:**
- Make eye contact with different people around the room
- Speak clearly and at a moderate pace (slow down — nervousness makes you speed up)
- Use your hands naturally (don't put them in your pockets or cross your arms)
- Pause between points (silence is more powerful than "um")
- Stand up straight and project confidence (even if you're nervous)

**The #1 fear:** Public speaking is feared more than death by many adults. The cure is practice. Every presentation you give makes the next one easier. Start now, and by the time you're interviewing for jobs, you'll be ahead of 90% of candidates.

### Listening — The Hidden Communication Skill

Communication isn't just about talking. The best communicators are exceptional listeners:
- They make the speaker feel heard and valued
- They ask questions that show genuine interest
- They remember details from previous conversations
- They don't interrupt or finish others' sentences
- They respond to what was actually said, not what they assumed

People who feel listened to trust you more, collaborate better, and support you more. Listening is a superpower with a very low price tag.`,
    },
    {
      id: "wr_68_teamwork_l3", moduleId: "wr_career_foundations_teamwork", lessonNumber: 3,
      title: "Leadership — Influence, Service, and Taking Initiative", durationMinutes: 30, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Real Leadership", "Not Leadership"],
        items: [
          { text: "Helping a struggling classmate understand the material", category: "Real Leadership" },
          { text: "Telling everyone what to do because you're the 'group leader'", category: "Not Leadership" },
          { text: "Speaking up when you see something unfair, even when it's uncomfortable", category: "Real Leadership" },
          { text: "Taking credit for the group's success in front of the teacher", category: "Not Leadership" },
          { text: "Volunteering to do the task nobody wants to do", category: "Real Leadership" },
          { text: "Being the loudest person in every discussion", category: "Not Leadership" },
          { text: "Admitting when you're wrong and changing your approach", category: "Real Leadership" },
          { text: "Refusing to listen to ideas that aren't yours", category: "Not Leadership" },
        ],
        instructions: "Sort each behavior: Is this real leadership, or is it something else dressed up as leadership?",
      }),
      content: `## Leadership — Influence, Service, and Taking Initiative

Leadership isn't about being in charge. It's about taking care of the people in your charge. The best leaders in every field — business, education, military, community — share common traits that you can start building right now.

### What Leadership Actually Looks Like

**Leadership is NOT:**
- Being the loudest person in the room
- Having the fanciest title
- Telling people what to do
- Taking credit for the team's work
- Winning every argument

**Leadership IS:**
- Seeing what needs to be done and doing it without being asked
- Making the people around you better
- Taking responsibility when things go wrong
- Giving credit when things go right
- Speaking up for what's right, even when it's hard

### The Service Leadership Model

The most effective leadership model is servant leadership — the idea that a leader's primary job is to serve the people they lead, not the other way around.

**Service leaders:**
- Ask "How can I help?" more than "Why didn't you?"
- Remove obstacles for their team
- Develop others' skills and confidence
- Put the team's needs above their ego
- Lead by example — they do what they ask others to do

### Leadership Skills You Can Build Now

**1. Initiative:** Don't wait to be asked. See the problem, propose the solution, volunteer to help.

**2. Responsibility:** Own your outcomes. When you make a mistake, say "I made a mistake and here's how I'll fix it." No excuses, no blame.

**3. Encouragement:** Notice what others do well and tell them. "Your presentation was really strong — especially the way you explained the data." Specific encouragement builds people up.

**4. Courage:** Leadership requires doing hard things — speaking up against bullying, admitting you were wrong, taking on challenges you might fail at.

**5. Empathy:** Understand what others are going through. A leader who can see the world through others' eyes makes better decisions for everyone.

### Leadership in Action

You don't need a title to lead. Look for opportunities:
- In class: Organize a study group. Help someone who's struggling.
- In clubs/sports: Be the person who keeps morale up and holds standards high.
- In your community: Volunteer. Organize. Advocate.
- At home: Help your family. Take responsibility for your space.

Every act of initiative, service, and courage builds your leadership muscles. By the time you enter the workforce, you won't need to be told to lead — it will be who you are.

### Your Leadership Reflection

Think about the best leader you've ever experienced — a teacher, coach, family member, or mentor.
1. What specifically did they do that made them effective?
2. How did they make you feel?
3. What did you learn from them?
4. Which of their qualities do you want to develop in yourself?
5. What one leadership action will you take this week?`,
    },
  ]);

  // ---- GRADES 6-8 WORKFORCE: wr_career_foundations_professionalism L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "wr_68_prof_l1", moduleId: "wr_career_foundations_professionalism", lessonNumber: 1,
      title: "What Does 'Professional' Mean? — Standards and Expectations", durationMinutes: 30, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Showing up on time with everything you need", right: "Preparedness — a basic building block of professionalism" },
          { left: "Following through on what you said you'd do", right: "Reliability — people trust professionals who keep their word" },
          { left: "Treating everyone with respect regardless of their role", right: "Respect — true professionals treat the janitor the same as the CEO" },
          { left: "Dressing appropriately for the situation", right: "Presentation — how you present yourself signals how seriously you take the situation" },
          { left: "Staying calm when things go wrong", right: "Composure — professionals manage their emotions, especially under pressure" },
          { left: "Admitting mistakes and learning from them", right: "Integrity — owning your errors builds trust and shows character" },
        ],
        instructions: "Match each professional behavior to the quality it demonstrates.",
      }),
      content: `## What Does 'Professional' Mean?

You've heard adults say "be professional" but what does that actually mean? It's not about wearing a suit or using big words. Professionalism is a set of behaviors and attitudes that show you take your work and the people around you seriously.

### The Core of Professionalism

**Professionalism = Treating your commitments, your work, and the people around you with respect and care.**

That's it. Everything else flows from there:
- You show up on time because you respect other people's time
- You do quality work because you respect the task and the people counting on you
- You communicate clearly because you respect the relationship
- You dress appropriately because you respect the environment
- You handle problems calmly because you respect yourself enough to stay in control

### Professional Behavior Starts Now

You might think "I don't need to be professional yet — I'm in middle school." But every habit you build now becomes your default behavior later. The students who practice professionalism now don't have to learn it under pressure later.

**In school, professionalism looks like:**
- Being on time to class, prepared with materials
- Turning in work that represents your best effort
- Communicating respectfully with teachers and classmates
- Following through on commitments to group projects
- Handling disagreements calmly and respectfully
- Taking responsibility for your mistakes

**In activities and part-time jobs:**
- Being reliable — doing what you said you'd do
- Representing your team, school, or employer positively
- Treating customers, coaches, and teammates with respect
- Learning from feedback without getting defensive
- Being someone others can count on

### The Professionalism Mindset

Professional behavior isn't about being fake or stiff. It's about being your best self in situations that matter:

**Self-awareness:** Know how your behavior affects others
**Self-regulation:** Control your reactions, especially when frustrated or upset
**Empathy:** Consider how others feel and adjust your approach
**Accountability:** Own your actions — both successes and mistakes
**Continuous improvement:** Always be learning and growing

### Why It Matters (Even Now)

- Teachers recommend students for programs, awards, and opportunities based on professionalism
- Coaches select team leaders based on character, not just skill
- Early job references matter — your supervisor at your summer job may write references for years
- College admissions look for demonstrated maturity and responsibility
- The habits you build now become automatic later

### Your Professionalism Assessment

Rate yourself honestly on each (1 = rarely, 5 = consistently):
- I arrive on time and prepared
- I complete my commitments
- I treat everyone respectfully
- I handle frustration calmly
- I accept feedback without getting defensive
- I take responsibility for my mistakes

Your lowest score is your biggest growth opportunity. Pick one area to focus on this week.`,
    },
    {
      id: "wr_68_prof_l2", moduleId: "wr_career_foundations_professionalism", lessonNumber: 2,
      title: "Digital Professionalism — Your Online Reputation", durationMinutes: 30, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Helps Your Future", "Hurts Your Future", "Neutral"],
        items: [
          { text: "Social media posts about community service you did", category: "Helps Your Future" },
          { text: "Photos of underage drinking at a party", category: "Hurts Your Future" },
          { text: "A blog about a hobby you're passionate about", category: "Helps Your Future" },
          { text: "Angry rants about teachers or classmates", category: "Hurts Your Future" },
          { text: "Sharing an article about your career interest", category: "Helps Your Future" },
          { text: "A meme account that's funny but not offensive", category: "Neutral" },
          { text: "Cyberbullying comments, even 'as a joke'", category: "Hurts Your Future" },
          { text: "A private account with strict privacy settings", category: "Neutral" },
        ],
        instructions: "Sort each online activity by how it affects your future opportunities. Remember: the internet is forever.",
      }),
      content: `## Digital Professionalism — Your Online Reputation

Here's a reality most teenagers don't know: **70% of employers check applicants' social media before hiring.** What they find can eliminate you from consideration — even if your resume is perfect.

### The Internet Is Forever

Every post, photo, comment, and like creates a digital footprint:
- Deleted posts may still exist in screenshots, caches, or archives
- Private accounts can be screenshot and shared
- Today's joke could be tomorrow's disqualification
- Things that seem funny at 14 can be career-ending at 24

### What Employers Look For (and Find)

**Red flags that get candidates rejected:**
- Discriminatory comments, hate speech, or bullying
- Photos or references to illegal activities
- Complaints about previous employers or teachers
- Poor communication skills (constant profanity, inability to write clearly)
- Posts that contradict the professional image they presented in the interview

**Green flags that help candidates:**
- Involvement in community service, clubs, or organizations
- Content showing passion for their field or interests
- Professional communication and positive interactions
- Evidence of creativity, leadership, or initiative
- Thoughtful engagement with topics related to their career

### Building a Positive Digital Presence

**The Google Test:** Google your name. What comes up? This is what employers, colleges, and others see. If the results don't represent your best self, start creating content that does.

**Smart practices:**
- Think before you post: Would you be comfortable with a future employer seeing this?
- Separate personal and professional: Consider having accounts for different purposes
- Create positive content: Share your interests, achievements, and thoughtful opinions
- Be kind online: Treat digital interactions with the same respect as in-person ones
- Privacy settings: Use them — but don't rely on them completely

### Digital Communication Etiquette

**Emails to teachers, employers, or professionals:**
- Use a professional email address (firstname.lastname@, not coolgamer2012@)
- Include a clear subject line
- Use proper greeting and closing
- Write in complete sentences with correct grammar
- Proofread before sending

**Online meetings (Zoom, Teams, etc.):**
- Camera on unless told otherwise
- Mute when not speaking
- Professional background (or use blur)
- Don't multitask visibly
- Pay attention and participate

### Your Digital Audit

Do a self-audit:
1. Google your name — what appears?
2. Review your social media profiles — what would an employer think?
3. Check your email address — is it professional?
4. Review your recent posts — anything you'd want to delete?
5. Look at your online comments — are they respectful?

Start today: Make one change that improves your digital professional presence.`,
    },
    {
      id: "wr_68_prof_l3", moduleId: "wr_career_foundations_professionalism", lessonNumber: 3,
      title: "Career Exploration — Discovering Your Path", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "I love helping people and am interested in science", right: "Explore: Healthcare (nursing, physical therapy, public health, medical research)" },
          { left: "I enjoy building things and solving mechanical problems", right: "Explore: Skilled trades (electrician, plumber, HVAC technician, construction management)" },
          { left: "I love computers and figuring out how technology works", right: "Explore: Technology (software development, cybersecurity, data science, IT support)" },
          { left: "I enjoy working with children and love explaining things", right: "Explore: Education (teaching, counseling, educational technology, administration)" },
          { left: "I'm creative and love visual design and storytelling", right: "Explore: Creative industries (graphic design, marketing, film/video, UX design)" },
          { left: "I want to run my own business someday", right: "Explore: Entrepreneurship (business management, marketing, finance, product development)" },
        ],
        instructions: "Match your interests to potential career paths. This is just a starting point — most careers combine multiple interests.",
      }),
      content: `## Career Exploration — Discovering Your Path

You don't have to know exactly what you want to do with your life right now. But starting to explore opens doors you didn't know existed. The students who explore early make better decisions later.

### The Career Clusters

The U.S. Department of Education organizes careers into 16 clusters. Here are some with high demand and good earning potential:

**Healthcare:** Doctors, nurses, therapists, technicians, public health workers
- Growing fast (aging population)
- Range from 2-year certifications to 12+ years of education
- Strong job security and benefits

**Technology:** Software developers, cybersecurity analysts, data scientists, IT support
- Highest growth sector
- Many paths don't require a 4-year degree (certifications, bootcamps, apprenticeships)
- Remote work options

**Skilled Trades:** Electricians, plumbers, HVAC technicians, welders, construction managers
- Chronic shortage of workers (high demand)
- Earn while you learn through apprenticeships
- Average salaries often exceed college graduate averages
- Essential jobs that can't be outsourced or automated

**Education:** Teachers, counselors, administrators, educational technology specialists
- Deep personal fulfillment
- Strong benefits and job security
- Growing demand, especially in STEM and special education

**Business & Finance:** Accountants, financial analysts, marketing managers, project managers
- Present in every industry
- AI is changing these roles (creating new opportunities for AI-skilled professionals)
- Strong earning potential with experience

### Pathways Beyond the 4-Year Degree

A 4-year college degree is ONE path — not the only path:

**Community college (2-year degree):** Many high-demand jobs (nursing, IT, dental hygiene, paralegal) require only an associate degree. Lower cost, practical training.

**Trade/vocational school:** Direct training for skilled trades. Often includes paid apprenticeships.

**Certifications:** Industry-recognized credentials (CompTIA for IT, AWS for cloud computing, Google Career Certificates) that can be earned in months.

**Military:** Training in dozens of career fields, education benefits (GI Bill), leadership development, and job placement support.

**Direct workforce entry:** Some careers start with entry-level positions and on-the-job training. Retail management, customer service, sales, and many others offer advancement without degrees.

### How to Explore

**1. Informational interviews:** Talk to people who do jobs that interest you. Ask: What does a typical day look like? What do you love about it? What's hard? How did you get started?

**2. Job shadowing:** Spend a day observing someone in a career that interests you. Most professionals are happy to have a motivated young person shadow them.

**3. Volunteering:** Get hands-on experience in a field. Volunteer at a hospital, animal shelter, school, nonprofit, or community organization.

**4. Online exploration:** Bureau of Labor Statistics (bls.gov/ooh), career exploration websites, and YouTube "day in the life" videos from real professionals.

**5. School courses and electives:** Take classes in areas that interest you. CTE (Career and Technical Education) courses give you hands-on experience in career fields.

### The Career Exploration Journal

Start a career exploration journal:
- List 5 careers that interest you
- For each, research: daily responsibilities, education required, salary range, growth outlook
- Interview or research someone in each field
- Rate each on a scale of 1-10 for: interest, fit with your skills, earning potential, lifestyle match
- Revisit and update as you learn more

Your career exploration is a journey, not a destination. The more you explore, the more confident your eventual choice will be.`,
    },
  ]);
}
