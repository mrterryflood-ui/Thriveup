import { mentorProfiles } from "@shared/schema";

export async function seedMentors(db: any): Promise<void> {
  console.log("[Seed Mentors] Seeding mentor profiles...");

  const mentors = [
    {
      name: "Dr. Angela Washington",
      title: "Software Engineer & STEM Advocate",
      organization: "TechBridge Solutions",
      careerField: "Technology",
      bio: "Example profile representing Austin-area STEM careers. 15 years in software engineering with a passion for introducing underrepresented youth to coding and AI. Former NASA intern turned tech leader.",
      expertise: ["Software Development", "AI/Machine Learning", "STEM Education", "Mentoring"],
      availability: "Tuesdays and Thursdays, 3-5 PM",
      contactEmail: "mentor.washington@txea.edu",
      yearsExperience: 15,
      isActive: true,
      isExample: true,
    },
    {
      name: "Marcus Johnson",
      title: "Master Electrician & Small Business Owner",
      organization: "Johnson Electric LLC",
      careerField: "Skilled Trades",
      bio: "Example profile representing Austin-area skilled trades. Licensed master electrician for 20 years. Built my own business from scratch. I believe trade careers offer incredible opportunity and financial stability.",
      expertise: ["Electrical Systems", "Small Business Management", "Apprenticeship Programs", "Financial Planning"],
      availability: "Saturdays, 10 AM - 12 PM",
      contactEmail: "mentor.johnson@txea.edu",
      yearsExperience: 20,
      isActive: true,
      isExample: true,
    },
    {
      name: "Captain Maria Rodriguez",
      title: "U.S. Army Captain & Veterans Advocate",
      organization: "U.S. Army Reserve",
      careerField: "Military & Public Service",
      bio: "Example profile representing Austin-area military & public service careers. Army officer with deployments across three continents. Now focused on helping young people explore military career paths and leadership development.",
      expertise: ["Military Leadership", "Logistics", "Veterans Services", "Public Speaking"],
      availability: "Wednesdays, 4-6 PM",
      contactEmail: "mentor.rodriguez@txea.edu",
      yearsExperience: 12,
      isActive: true,
      isExample: true,
    },
    {
      name: "Jasmine Okafor",
      title: "Registered Nurse & Community Health Educator",
      organization: "Community Health Partners",
      careerField: "Healthcare",
      bio: "Example profile representing Austin-area healthcare careers. Pediatric RN passionate about health equity. I run free health workshops in underserved communities and mentor aspiring healthcare professionals.",
      expertise: ["Pediatric Nursing", "Community Health", "Health Education", "CPR/First Aid Training"],
      availability: "Mondays, 3-5 PM",
      contactEmail: "mentor.okafor@txea.edu",
      yearsExperience: 10,
      isActive: true,
      isExample: true,
    },
    {
      name: "David Chen",
      title: "Restaurant Owner & Culinary Entrepreneur",
      organization: "Dragon Spice Kitchen",
      careerField: "Entrepreneurship",
      bio: "Example profile representing Austin-area entrepreneurship careers. Started my first food truck at 22, now own three restaurants. I teach young entrepreneurs that every great business starts with a great idea and hard work.",
      expertise: ["Restaurant Management", "Food Industry", "Business Planning", "Marketing"],
      availability: "Fridays, 2-4 PM",
      contactEmail: "mentor.chen@txea.edu",
      yearsExperience: 14,
      isActive: true,
      isExample: true,
    },
    {
      name: "Keisha Williams",
      title: "Criminal Justice Professor & Former Detective",
      organization: "Prairie View A&M University",
      careerField: "Law & Public Safety",
      bio: "Example profile representing Austin-area law & public safety careers. Spent 15 years as a detective before transitioning to academia. I help students understand both the challenges and opportunities in criminal justice and public service.",
      expertise: ["Criminal Justice", "Law Enforcement", "Academic Research", "Youth Advocacy"],
      availability: "Thursdays, 3-5 PM",
      contactEmail: "mentor.williams@txea.edu",
      yearsExperience: 22,
      isActive: true,
      isExample: true,
    },
    {
      name: "Roberto Garza",
      title: "Certified Welder & Union Representative",
      organization: "International Brotherhood of Boilermakers",
      careerField: "Skilled Trades",
      bio: "Example profile representing Austin-area skilled trades. Pipeline welder for 18 years, now training the next generation. Trade school changed my life, and I want students to know it's a path to real prosperity.",
      expertise: ["Welding & Fabrication", "Union Organizing", "Safety Training", "Career Counseling"],
      availability: "Tuesdays, 5-7 PM",
      contactEmail: "mentor.garza@txea.edu",
      yearsExperience: 18,
      isActive: true,
      isExample: true,
    },
    {
      name: "Dr. Tanya Brooks",
      title: "Data Scientist & Education Researcher",
      organization: "EduMetrics Analytics",
      careerField: "Technology",
      bio: "Example profile representing Austin-area technology careers. Former teacher turned data scientist. I use data to improve education outcomes. Passionate about showing students that math leads to amazing tech careers.",
      expertise: ["Data Science", "Machine Learning", "Education Analytics", "Python Programming"],
      availability: "Wednesdays and Fridays, 3-5 PM",
      contactEmail: "mentor.brooks@txea.edu",
      yearsExperience: 9,
      isActive: true,
      isExample: true,
    },
  ];

  try {
    for (const mentor of mentors) {
      await db
        .insert(mentorProfiles)
        .values(mentor)
        .onConflictDoNothing();
    }

    console.log(
      `[Seed Mentors] Successfully seeded ${mentors.length} mentor profiles`
    );
  } catch (error) {
    console.error("[Seed Mentors] Error seeding mentors:", error);
    throw error;
  }
}
