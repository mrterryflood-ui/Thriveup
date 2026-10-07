export interface WizardStep {
  title: string;
  instruction: string;
  sparkTip: string;
}

export const WIZARD_STEPS: Record<string, WizardStep[]> = {
  "welcome": [
    { title: "Welcome, Young Panther!", instruction: "Welcome to the ThriveUp! This is your launchpad for learning about business, finance, leadership, and life.", sparkTip: "I'm Spark, your AI learning companion. I'll guide you through everything!" },
    { title: "Your Power Score", instruction: "Everything you do in the Learning Hub earns Panther Power points across 5 categories: Education, Character, Leadership, Entrepreneurship, and Community.", sparkTip: "The more you explore, the more powerful you become!" },
    { title: "Daily Quests", instruction: "Each day, you'll get 3 unique quests that challenge you across different learning features. Complete them to earn bonus Power points!", sparkTip: "Consistency is key - your streak multiplies your rewards!" },
    { title: "You're Ready!", instruction: "Start by customizing your avatar, then explore the Stock Market or check your House Points. Your journey begins now!", sparkTip: "Remember: every business skill teaches a life lesson. Look for the connections!" },
  ],
  "stocks": [
    { title: "Welcome to the Stock Market", instruction: "Here you can buy and sell shares of 10 simulated companies. Each stock represents a value like LEARN, DREAM, or GROW.", sparkTip: "In real life, stocks represent ownership in a company. When the company does well, your investment grows!" },
    { title: "Reading Stock Prices", instruction: "Each stock shows its current price, previous price, and percent change. Green means it went up, red means it went down.", sparkTip: "Life lesson: Not every day will be a win. What matters is the long-term trend!" },
    { title: "Making Your First Trade", instruction: "Choose a stock, enter the number of shares you want, and click Buy. The cost comes from your virtual wallet.", sparkTip: "Smart investors research before buying. Look at the price history before you invest!" },
  ],
  "wallet": [
    { title: "Your Virtual Wallet", instruction: "You start with $1,000 in simulated money. This is your financial foundation for all learning activities.", sparkTip: "In real life, managing money well is one of the most important skills you can learn!" },
    { title: "Earning & Spending", instruction: "Earn money through stock market gains and competition prizes. Spend it on campus building, merchandise, or more investments.", sparkTip: "Life lesson: Every dollar should have a job. Budget wisely!" },
  ],
  "campus": [
    { title: "Build Your Black Campus", instruction: "This is your dream project! Fund and develop a virtual campus with 5 phases: Foundation, Walls, Interior, Landscaping, and Grand Opening.", sparkTip: "Life lesson: Big dreams are built one brick at a time. Every contribution matters!" },
    { title: "Funding Your Campus", instruction: "Use earnings from your wallet to fund the campus. Watch it grow from an empty lot to a fully-furnished building!", sparkTip: "In real estate, patience and consistent investment create wealth over time." },
  ],
  "houses": [
    { title: "The House System", instruction: "You belong to one of 4 houses: Phoenix Rising, Golden Eagles, Ocean Tide, or Emerald Forest. Earn points for your house!", sparkTip: "Life lesson: Being part of a team means your actions affect others. Lead by example!" },
    { title: "Earning Merit Points", instruction: "Points are awarded across 6 categories: Academic, Character, Creative, Community, Athletic, and Innovation. Anyone can recognize great work!", sparkTip: "Character is doing the right thing even when no one is watching." },
  ],
  "avatar": [
    { title: "Express Yourself", instruction: "Your avatar is your digital identity in the Learning Hub. Customize your look with skin tone, hair, outfit, accessories, and background.", sparkTip: "Life lesson: Knowing who you are gives you confidence to show up authentically!" },
  ],
  "dreams": [
    { title: "Design Your Dream", instruction: "Your Dream Profile is a holistic resume tracking your growth across academics, leadership, community, and wellness.", sparkTip: "Life lesson: Setting goals and tracking progress turns dreams into plans!" },
    { title: "Reflection Time", instruction: "Add your dream career, college goals, strengths, and areas for growth. This is your roadmap to the future.", sparkTip: "The most successful people regularly reflect on where they are and where they want to go." },
  ],
  "competitions": [
    { title: "Competition Circuit", instruction: "Compete in academic and cultural challenges - both virtual games and real in-person events. Show what you've got!", sparkTip: "Life lesson: Competition isn't about beating others, it's about becoming your best self!" },
  ],
  "merch": [
    { title: "Print Shop & Fundraising", instruction: "Design and sell real merchandise through our UBO partnership. Proceeds go toward college tuition!", sparkTip: "Life lesson: Entrepreneurship means creating value for others while building your own future." },
  ],
  "student-config": [
    { title: "Welcome to Student Setup", instruction: "This wizard helps you configure a personalized learning experience for a student. You'll set their interests, learning style, pace, and which learning features to prioritize.", sparkTip: "Every Panther is unique. Let's build a plan that fits THIS student." },
    { title: "Learning Style & Pace", instruction: "Select this student's primary learning style (visual, auditory, reading/writing, kinesthetic) and their preferred pace (accelerated, standard, supportive). This adjusts how content is presented to them.", sparkTip: "There's no wrong pace. Some Panthers sprint, some explore every corner. Both reach the finish line." },
    { title: "Interest Areas", instruction: "Choose up to 5 career interest areas for this student. These will customize their Career Explorer recommendations, Daily Quests, and CYOA scenario themes.", sparkTip: "Interests change \u2014 and that's great! You can update these anytime through the revision process." },
    { title: "Panther Power Focus", instruction: "Select which Panther Power categories this student should focus on: Education, Character, Leadership, Entrepreneurship, or Community. This weights their quest generation and milestone tracking.", sparkTip: "Balance is the goal, but every student has areas where they can grow the most." },
    { title: "Feature Access", instruction: "Enable or disable specific learning features for this student. You can turn on advanced modules like the Stock Exchange or Marketplace, or keep them in guided mode until they're ready.", sparkTip: "Scaffolding is key. Start with guided mode and unlock features as they demonstrate readiness." },
    { title: "Mentor Preferences", instruction: "Set this student's mentor matching preferences: preferred career field, communication style (in-person, virtual, both), and any special considerations the mentor should know about.", sparkTip: "The right mentor can change a student's entire trajectory. Be thoughtful here." },
    { title: "Support Notes", instruction: "Add any special notes about this student: IEP accommodations, social-emotional considerations, family context, or strengths to leverage. These are visible only to staff.", sparkTip: "Knowing the whole child means meeting them where they are \u2014 not where we assume they should be." },
    { title: "Configuration Complete", instruction: "This student's personalized learning profile is now set. You can always come back and adjust these settings as the student grows and their needs evolve.", sparkTip: "Great work! This student now has a tailored experience. Remember: check in quarterly and adjust as needed." },
  ],
  "career-pathway": [
    { title: "Career Pathway Setup", instruction: "Let's help this student build their initial pathway plan. We'll walk through career interests, education path preferences, and first milestone goals.", sparkTip: "This isn't a permanent decision \u2014 it's a starting point that can be revised with accountability." },
    { title: "Education Path Type", instruction: "Help the student identify their preferred education path after graduation: 4-Year University, Community College, Trade School, Technical Certification, Military Service, or Entrepreneurship. All paths are equally valued.", sparkTip: "Every path leads somewhere powerful. The key is choosing one that fits who you are and who you're becoming." },
    { title: "Primary Career Interest", instruction: "Select the student's primary career interest from the Career Explorer library. This becomes the anchor for their pathway plan and mentor matching.", sparkTip: "This can change! The revision system exists specifically because interests evolve." },
    { title: "First Year Goals", instruction: "Set 3 specific goals for this student's current academic year. These should be achievable, measurable, and aligned with their pathway.", sparkTip: "Good goals are specific enough to track but flexible enough to grow with." },
    { title: "Pathway Created", instruction: "The student's pathway plan is now active. They'll see their timeline, milestones, and progress in the My Pathway section of Panther Village.", sparkTip: "Check in monthly. The best pathway plans are living documents that evolve with the student." },
  ],
  "quarterly-review": [
    { title: "Quarterly Check-In", instruction: "Time for a quarterly advisory review. We'll assess this student's Panther Power growth, milestone progress, and overall engagement.", sparkTip: "Quarterly check-ins are where real mentorship happens. Listen more than you advise." },
    { title: "Growth Assessment", instruction: "Review the student's Panther Power scores across all 5 categories. Identify areas of growth and areas needing attention. Compare to last quarter.", sparkTip: "Look for patterns. Consistent growth matters more than spikes." },
    { title: "Milestone Check", instruction: "Review which milestones have been completed, which are in progress, and which haven't been started. Are they on track for grade-level requirements?", sparkTip: "If milestones are stalled, the question isn't 'why aren't they done?' \u2014 it's 'what barrier exists?'" },
    { title: "Pathway Adjustment", instruction: "Based on this quarter's data, does the student's pathway need adjustment? If yes, guide them through the revision request process.", sparkTip: "Revisions aren't failures \u2014 they're signs of growth and self-awareness." },
    { title: "Action Items", instruction: "Set 2-3 specific action items for next quarter. These should address gaps identified in this review and build on strengths.", sparkTip: "Write these down together. When students help set their own goals, they own the outcomes." },
  ],
};
