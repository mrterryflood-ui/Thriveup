export interface WizardStep {
  title: string;
  instruction: string;
  sparkTip: string;
}

export const WIZARD_STEPS: Record<string, WizardStep[]> = {
  "welcome": [
    { title: "Welcome, Young Panther!", instruction: "Welcome to the TxEA Academy! This is your launchpad for learning about business, finance, leadership, and life.", sparkTip: "I'm Spark, your AI learning companion. I'll guide you through everything!" },
    { title: "Your Power Score", instruction: "Everything you do in the Academy earns Panther Power points across 5 categories: Education, Character, Leadership, Entrepreneurship, and Community.", sparkTip: "The more you explore, the more powerful you become!" },
    { title: "Daily Quests", instruction: "Each day, you'll get 3 unique quests that challenge you across different Academy features. Complete them to earn bonus Power points!", sparkTip: "Consistency is key - your streak multiplies your rewards!" },
    { title: "You're Ready!", instruction: "Start by customizing your avatar, then explore the Stock Market or check your House Points. Your journey begins now!", sparkTip: "Remember: every business skill teaches a life lesson. Look for the connections!" },
  ],
  "stocks": [
    { title: "Welcome to the Stock Market", instruction: "Here you can buy and sell shares of 10 simulated companies. Each stock represents a value like LEARN, DREAM, or GROW.", sparkTip: "In real life, stocks represent ownership in a company. When the company does well, your investment grows!" },
    { title: "Reading Stock Prices", instruction: "Each stock shows its current price, previous price, and percent change. Green means it went up, red means it went down.", sparkTip: "Life lesson: Not every day will be a win. What matters is the long-term trend!" },
    { title: "Making Your First Trade", instruction: "Choose a stock, enter the number of shares you want, and click Buy. The cost comes from your virtual wallet.", sparkTip: "Smart investors research before buying. Look at the price history before you invest!" },
  ],
  "wallet": [
    { title: "Your Virtual Wallet", instruction: "You start with $1,000 in simulated money. This is your financial foundation for all Academy activities.", sparkTip: "In real life, managing money well is one of the most important skills you can learn!" },
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
    { title: "Express Yourself", instruction: "Your avatar is your digital identity in the Academy. Customize your look with skin tone, hair, outfit, accessories, and background.", sparkTip: "Life lesson: Knowing who you are gives you confidence to show up authentically!" },
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
};
