import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, Shield, Heart, Users, BookOpen, Brain,
  Fingerprint, Sparkles, ArrowRight,
  MonitorSmartphone, Lock, UserCheck,
  CheckCircle2, ChevronDown, ChevronUp, Mail
} from "lucide-react";

interface ModuleContent {
  topic: string;
  paragraphs: string[];
}

interface StudentModule {
  id: string;
  icon: typeof Fingerprint;
  title: string;
  grades: string;
  description: string;
  topics: string[];
  content: ModuleContent[];
}

interface ParentModule {
  id: string;
  icon: typeof MonitorSmartphone;
  title: string;
  description: string;
  topics: string[];
  content: ModuleContent[];
}

const studentModules: StudentModule[] = [
  {
    id: "digital-footprint",
    icon: Fingerprint,
    title: "Your Digital Footprint",
    grades: "All Grades",
    description: "Everything you share online tells a story about who you are. Learn how to make sure it's a story you're proud of.",
    topics: [
      "What you share online stays online forever",
      "Building a positive digital identity",
      'Thinking before you post: the "billboard test"',
      "Understanding privacy settings and what they really mean",
    ],
    content: [
      {
        topic: "What you share online stays online forever",
        paragraphs: [
          "Think of posting something online like writing with a permanent marker instead of a pencil. When you write with a pencil, you can erase it and start over. But online, even if you delete a post, photo, or comment, it may already be saved somewhere else. Other people can take screenshots, websites can cache (save copies of) pages, and search engines may have already indexed what you shared.",
          "Every post, photo, comment, and like you make online lives on servers — powerful computers that store data, sometimes forever. Even apps that promise your messages will disappear may not be as temporary as they seem. Someone can always capture what you shared before it vanishes.",
          "Here is something worth thinking about: your future teachers, college admissions officers, employers, and even future friends may one day see what you post today. Ask yourself — would I be proud of this post in five years? If the answer is no, it is probably best not to share it.",
        ],
      },
      {
        topic: "Building a positive digital identity",
        paragraphs: [
          "Your online presence is like a portfolio that tells the world who you are. Just like you would carefully choose what to put in a school project folder, you can be intentional about what you share online. The things you post, the communities you join, and the way you interact with others all paint a picture of your character and interests.",
          "Think about sharing things that reflect the best parts of who you are — a school project you worked hard on, a kind comment supporting a friend's achievement, or joining an online community about something you genuinely love, like art, science, music, or sports. These kinds of posts show that you are thoughtful, creative, and supportive.",
          "Building a positive digital identity does not mean being fake or only posting perfect things. It means being intentional. Share your real interests, celebrate your growth, and treat others the way you would want to be treated. Your digital identity is something you build over time, one post at a time.",
        ],
      },
      {
        topic: 'Thinking before you post: the "billboard test"',
        paragraphs: [
          "Before you post anything online — a photo, a comment, a story, or even a direct message — try the billboard test. Imagine that whatever you are about to share gets printed on a giant billboard right in the middle of your town. Everyone you know can see it: your parents, your teachers, your friends, your coach, and even your future self. If that thought makes you feel uncomfortable, it is a sign that you probably should not post it.",
          "The billboard test does not just apply to your own posts. It also applies to comments you leave on other people's content and private messages you send. Remember, anything digital can be screenshotted and shared with people you never intended to see it.",
          "When you are not sure, ask yourself three simple questions: Is it true? Is it kind? Is it necessary? If your post does not pass all three, take a moment to reconsider. These few seconds of reflection can save you from a lot of regret later on.",
        ],
      },
      {
        topic: "Understanding privacy settings and what they really mean",
        paragraphs: [
          "Most social media platforms give you privacy settings that let you control who can see your posts, send you messages, and find your profile in search results. The two main options are usually public (anyone can see your content) and private (only people you approve can see it). Understanding the difference is an important first step in protecting yourself online.",
          "However, it is important to know that even private accounts are not completely private. Anyone who follows you can take a screenshot of your posts and share them with others. Friends of friends might see your comments on shared posts. And if someone tags you in a photo, that photo might be visible to people outside your approved followers.",
          "Make it a habit to review your privacy settings regularly — at least once every few months. Platforms update their settings often, and sometimes changes can reset your preferences. Check who can see your posts, who can message you, and whether your account shows up in search results. Taking a few minutes to do this gives you much more control over your online experience.",
        ],
      },
    ],
  },
  {
    id: "spotting-tricks",
    icon: Shield,
    title: "Spotting Tricks & Staying Safe",
    grades: "All Grades",
    description: "The internet is full of amazing people and ideas, but not everything is what it seems. Learn how to stay smart and safe.",
    topics: [
      "How to recognize misinformation and fake accounts",
      "What to do if someone makes you uncomfortable online",
      "Cyberbullying: recognizing it, stopping it, and getting help",
      "The difference between online friends and real-life friends",
    ],
    content: [
      {
        topic: "How to recognize misinformation and fake accounts",
        paragraphs: [
          "Not everything you see online is true, and not every account is run by a real person. Misinformation — false or misleading information — spreads quickly on social media because it is designed to grab your attention and make you react emotionally. If a story seems too outrageous, too perfect, or too scary to be true, that is a signal to pause and check before you believe it or share it.",
          "Fake accounts and bots are common on every platform. Look for warning signs: generic profile pictures (like stock photos or cartoon characters), accounts that were created very recently, unusual follower-to-following ratios, and posts that appear at strange hours or repeat the same message over and over. Verified badges can help identify real accounts, but not every real person has one.",
          "The best defense against misinformation is checking multiple sources. If you see a shocking claim, search for it on trusted news websites or fact-checking sites. If something makes you feel really angry or scared, that strong emotional reaction might be exactly what someone wants — it is a common manipulation tactic. Take a breath, check the facts, and then decide how to respond.",
        ],
      },
      {
        topic: "What to do if someone makes you uncomfortable online",
        paragraphs: [
          "If someone online ever makes you feel uncomfortable, unsafe, or uneasy — trust your gut feeling. You do not owe anyone a response, and you never have to continue a conversation that does not feel right. Whether it is a stranger sending weird messages, someone asking personal questions, or a person being mean, you have the right to protect yourself.",
          "Here is what to do: First, do not respond to the message. Next, save the evidence by taking screenshots — this is important in case you need to report what happened. Then, block the person so they cannot contact you again. Finally, and most importantly, tell a trusted adult right away. This could be a parent, teacher, school counselor, or any adult you feel safe talking to.",
          "Remember: it is never your fault if someone behaves inappropriately toward you online. You will not get in trouble for asking for help. Adults in your life want to keep you safe, and they need to know when something is wrong so they can help. Speaking up is always the right thing to do.",
        ],
      },
      {
        topic: "Cyberbullying: recognizing it, stopping it, and getting help",
        paragraphs: [
          "Cyberbullying is when someone uses technology to repeatedly hurt, embarrass, or intimidate another person. It can look like many things: sending mean or threatening messages, spreading rumors online, sharing embarrassing photos or videos without permission, or deliberately excluding someone from group chats or online activities. Unlike in-person bullying, cyberbullying can follow you home and happen at any time of day.",
          "If you see cyberbullying happening to someone else, you have the power to make a difference. Do not join in, do not share the hurtful content, and do not just watch it happen. Be an upstander instead of a bystander: reach out to the person being targeted to let them know you support them, and report the behavior to the platform and to a trusted adult.",
          "If cyberbullying is happening to you, know that you are not alone and it is not your fault. Save the evidence by taking screenshots of the messages or posts. Block the person or people involved. Then tell a trusted adult — a parent, teacher, or counselor — so they can help you handle the situation. You deserve to feel safe online, and asking for help is a sign of strength, not weakness.",
        ],
      },
      {
        topic: "The difference between online friends and real-life friends",
        paragraphs: [
          "Online friendships can be real and meaningful. You might connect with people who share your interests in gaming, art, music, or other hobbies, and those connections can feel genuine. However, it is important to remember one key difference: online, people may not be who they say they are. Someone who claims to be your age could actually be much older, and you have no way to verify their identity just from a screen.",
          "Because of this, there are important boundaries to keep with people you have only met online. Never share personal information like your home address, school name, phone number, or daily schedule with someone you have not met in person. Be cautious about sharing photos that could reveal your location. And if an online friend ever asks you to move your conversation to a different, more private platform, that is a warning sign.",
          "Real friends — whether you met them online or in person — respect your boundaries. They do not pressure you to share information you are not comfortable sharing, they do not ask you to keep secrets from your parents, and they do not make you feel bad for saying no. If someone does any of these things, they are not acting like a true friend.",
        ],
      },
    ],
  },
  {
    id: "healthy-habits",
    icon: Heart,
    title: "Building Healthy Social Media Habits",
    grades: "All Grades",
    description: "Social media can be a great tool when you use it wisely. Learn how to stay balanced and use it for good.",
    topics: [
      "Screen time balance: knowing when to log off",
      "How social media is designed to keep you scrolling",
      "Comparing yourself to others: filters, highlight reels, and reality",
      "Using social media as a positive tool",
    ],
    content: [
      {
        topic: "Screen time balance: knowing when to log off",
        paragraphs: [
          "Your brain needs variety to stay healthy and happy. It needs movement, face-to-face conversations with people you care about, enough sleep, and time spent outdoors. Social media can be part of your day, but it should not take over your day. Setting specific times for social media — and sticking to them — is one of the best habits you can build.",
          "Pay attention to how you feel after spending time scrolling. Do you feel tired, anxious, bored, or down? Those feelings are your body and mind sending you signals that it is time to take a break. On the other hand, if you feel inspired or connected, that is great — but even positive experiences benefit from balance.",
          "Try the 20-20-20 rule: every 20 minutes of screen time, look at something 20 feet away for 20 seconds. This gives your eyes a rest and helps you check in with yourself. Small breaks like this can make a big difference in how you feel at the end of the day.",
        ],
      },
      {
        topic: "How social media is designed to keep you scrolling",
        paragraphs: [
          "Here is something important to understand: social media apps are designed to be as hard to put down as possible. Companies hire entire teams of engineers and psychologists whose job is to figure out how to keep you on the app longer. The more time you spend scrolling, the more ads you see, and the more money the company makes. It is not an accident that these apps feel so addictive.",
          "Some of the tricks they use include infinite scroll (there is no natural stopping point, so you just keep going), autoplay (videos start playing automatically so you do not have to make a choice), notifications that pull you back in, and streaks that make you feel like you will lose something if you do not check in every day. These features are carefully designed to create habits.",
          "Understanding these tricks gives you power over them. When you know that the app is designed to keep you hooked, you can make more intentional choices about how you use it. You are not weak for finding it hard to stop scrolling — the app was built to make it hard on purpose. But now that you know how it works, you can set boundaries that work for you.",
        ],
      },
      {
        topic: "Comparing yourself to others: filters, highlight reels, and reality",
        paragraphs: [
          "When you scroll through social media, it can feel like everyone else has a more exciting, more beautiful, more perfect life than you do. But here is the truth: what you are seeing is not real life. People post their best moments — the fun vacation photo, the perfect outfit, the celebration — but they do not post the struggles, the bad days, or the ordinary moments that make up most of life.",
          "Filters and editing tools change how people look in photos and videos. Skin gets smoothed, features get altered, and lighting gets adjusted until the image barely resembles reality. Influencers and content creators often spend hours setting up and editing a single post to make it look effortless. What you see in two seconds of scrolling may have taken someone two hours to create.",
          "Comparing your real life to someone else's curated feed is like comparing your behind-the-scenes footage to their highlight reel. It is not a fair comparison, and it will almost always make you feel worse. Instead, focus on your own journey, celebrate your own progress, and remember that everyone — even the people with the most polished feeds — has struggles they do not show online.",
        ],
      },
      {
        topic: "Using social media as a positive tool",
        paragraphs: [
          "Social media is not all bad — far from it. When used thoughtfully, it can be a powerful tool for good. It can connect you with people around the world who share your interests, whether that is coding, drawing, playing an instrument, or caring about the environment. It can help you learn new skills through tutorials and educational content. And it can give you a platform to amplify your voice for causes you care about.",
          "The key is being intentional about what you consume. Follow accounts that make you feel inspired, informed, or happy. If an account consistently makes you feel bad about yourself, anxious, or angry, unfollow or mute it — there is no obligation to keep following anyone. You have the power to curate your own feed and shape your own online experience.",
          "Think of social media as a tool in your toolbox. Like any tool, it can be used well or poorly. When you use it to learn, create, connect with supportive communities, and share things you are genuinely proud of, social media becomes something that adds value to your life rather than taking away from it.",
        ],
      },
    ],
  },
];

const parentModules: ParentModule[] = [
  {
    id: "digital-world",
    icon: MonitorSmartphone,
    title: "Understanding Your Child's Digital World",
    description: "Get a clear picture of the platforms your child uses, why they love them, and what to watch for at every age.",
    topics: [
      "What platforms kids actually use and how they work",
      "The appeal: why kids love social media",
      "Age-appropriate expectations by grade band (3-5, 6-8, 9-12)",
      "Warning signs that something isn't right",
    ],
    content: [
      {
        topic: "What platforms kids actually use and how they work",
        paragraphs: [
          "The digital landscape changes quickly, and the platforms your child uses may be very different from the ones you are familiar with. For younger children (roughly ages 8-10), common platforms include YouTube Kids, Roblox chat, and gaming platforms like Minecraft and Fortnite that have built-in communication features. These may seem like games, but they often include social elements where kids interact with strangers.",
          "Tweens (ages 11-13) are typically drawn to TikTok, Snapchat, and Discord. TikTok is a short-video platform driven by a powerful algorithm that serves content based on viewing habits. Snapchat is popular for its disappearing messages and stories. Discord is a chat platform organized around servers (group communities) that is popular in gaming but extends to many other interests.",
          "Teens (ages 14-18) often use Instagram, X (formerly Twitter), BeReal, and Reddit in addition to the platforms listed above. Each platform has its own culture, norms, and risks. It is also important to know that many children use platforms before they meet the minimum age requirement (usually 13), so do not assume your younger child is not already on these apps.",
        ],
      },
      {
        topic: "The appeal: why kids love social media",
        paragraphs: [
          "It can be easy to dismiss social media as a waste of time, but understanding why it appeals to your child is essential for having productive conversations about it. Social media meets real developmental needs that are especially strong during childhood and adolescence: the need to connect with peers, explore and express identity, engage in creative expression, and feel part of something bigger than themselves.",
          "For many kids, social media is where their social life happens. It is where they share jokes with friends, discover new music, follow creators they admire, and find communities of people who share their interests. Dismissing these experiences can make your child feel like you do not understand their world, which can shut down communication.",
          "Rather than viewing social media as the enemy, try to understand what your child gets from it. When you acknowledge that their online experiences are real and meaningful to them, you build trust. That trust makes it much easier to set boundaries that make sense to your child and to have honest conversations about the risks and challenges they may encounter.",
        ],
      },
      {
        topic: "Age-appropriate expectations by grade band (3-5, 6-8, 9-12)",
        paragraphs: [
          "Grades 3-5 (ages 8-11): Most children in this age group should have very limited or no independent social media access. Their brains are still developing the ability to think critically about what they see online and to understand the long-term consequences of their actions. Focus on supervised, educational digital experiences. If they do use any platforms, sit with them and explore together.",
          "Grades 6-8 (ages 11-14): This is the age when most kids begin encountering social media, either on their own devices or through friends. It is a critical time to establish clear boundaries and expectations. Consider using parental controls as guardrails, but pair them with ongoing, open dialogue about what they are seeing and experiencing online. This is also the age when peer pressure around social media intensifies.",
          "Grades 9-12 (ages 14-18): Teenagers need increasing autonomy, and overly strict controls can backfire by driving social media use underground or damaging trust. At this stage, focus on building critical thinking skills rather than imposing rigid rules. Help your teen evaluate the content they consume, understand how algorithms work, and recognize when social media is negatively affecting their mood or well-being. Keep the conversation going — they still need your guidance, even when they say they do not.",
        ],
      },
      {
        topic: "Warning signs that something isn't right",
        paragraphs: [
          "As a parent, you know your child best, and you are often the first to notice when something feels off. While not every behavioral change is related to social media, there are some warning signs that are worth paying attention to: sudden changes in mood or behavior, increased secrecy about online activities (quickly closing screens, being defensive when asked about their phone), and emotional distress during or after using devices.",
          "Other signs to watch for include withdrawal from family and friends, changes in sleep patterns (especially staying up late on devices), declining grades or loss of interest in activities they used to enjoy, and receiving messages or notifications that seem to upset them. Physical symptoms like headaches or stomachaches can also sometimes be related to online stress.",
          "If you notice these signs, approach the conversation with curiosity and care, not accusation. Saying something like \"I have noticed you seem a little down lately, and I want to make sure you are okay\" is much more effective than \"What are you looking at on your phone?\" Not every change means something is seriously wrong, but these observations are always worth a gentle, supportive conversation.",
        ],
      },
    ],
  },
  {
    id: "setting-boundaries",
    icon: Lock,
    title: "Setting Boundaries That Actually Work",
    description: "Practical strategies for creating rules your family can live with, plus tools that genuinely help.",
    topics: [
      "Parental controls: what's available and what actually helps",
      "Having open conversations about online experiences",
      "Family media agreements that kids will actually follow",
      "Privacy settings walkthrough for popular platforms",
    ],
    content: [
      {
        topic: "Parental controls: what's available and what actually helps",
        paragraphs: [
          "There are several built-in tools available to help you manage your child's device use. On iPhones and iPads, Screen Time lets you set daily time limits for specific apps, restrict certain content, and see detailed reports of how your child spends their screen time. On Android devices, Google Family Link offers similar features, including app approval, screen time limits, and location tracking.",
          "Beyond device-level controls, you can also use router-level filtering (through your internet provider or third-party services) to block inappropriate content on your home network, and many individual apps have their own parental or privacy settings. These tools can be helpful, especially for younger children who need more structured boundaries.",
          "However, it is important to be realistic: no parental control tool is a complete solution. For younger children, controls work well as guardrails. For teenagers, they work best when framed as agreed-upon tools rather than surveillance. If a teen feels like they are being spied on, they will find ways around the controls, and trust will be damaged in the process. The most effective parental control is always open, ongoing communication.",
        ],
      },
      {
        topic: "Having open conversations about online experiences",
        paragraphs: [
          "The way you ask about your child's online life matters just as much as what you ask. Questions that feel like interrogation — \"What were you looking at?\" or \"Who are you talking to?\" — tend to make kids shut down. Instead, try approaching with genuine curiosity: \"What is the funniest thing you saw online today?\" or \"Is there anything cool you have discovered on the internet lately?\" These types of questions invite sharing rather than defensiveness.",
          "Share your own online experiences too. Tell your child about an interesting article you read, a funny video you saw, or even a time when you fell for misinformation before checking the facts. When you model openness about your own digital life, you normalize talking about the internet the same way you talk about school, friends, or weekend plans.",
          "Make these conversations a regular, low-pressure part of your routine — not something that only happens when there is a problem. When talking about social media is normal and comfortable, your child is much more likely to come to you when they encounter something confusing, upsetting, or unsafe. The goal is to be a trusted resource, not a judge.",
        ],
      },
      {
        topic: "Family media agreements that kids will actually follow",
        paragraphs: [
          "The most effective family media rules are the ones that kids help create. When children and teens are involved in making the rules, they are far more likely to understand the reasoning behind them and follow them willingly. Sit down as a family and have an honest conversation about what feels fair and reasonable for everyone.",
          "A good family media agreement might include: device-free times and spaces (such as during meals and at bedtime), which apps and platforms are okay to use, what to do if something uncomfortable or scary happens online, and what the consequences are for breaking the agreement. Keep it simple, clear, and written down somewhere everyone can see it.",
          "Revisit and update the agreement regularly as your children grow. What makes sense for a 10-year-old will not work for a 15-year-old. As kids demonstrate responsibility, they earn more freedom — and that progression should be part of the agreement. Frame it as a living document that grows with your family, not a rigid set of rules carved in stone.",
        ],
      },
      {
        topic: "Privacy settings walkthrough for popular platforms",
        paragraphs: [
          "Most social media platforms default to settings that share more information than you might expect. This is by design — platforms benefit when more content is visible to more people. That is why it is important to actively review and adjust privacy settings rather than relying on the defaults.",
          "Make it a family activity: sit with your child and go through the settings together. Key areas to check include account visibility (public vs. private), who can send direct messages, who can comment on posts, location sharing (strongly recommend turning this off), and what personal information is visible in their profile. This is a learning experience for both of you and shows your child that privacy is something you take seriously together.",
          "Set a reminder to check these settings quarterly, as platforms frequently update their privacy options and sometimes reset preferences during updates. Instagram, TikTok, Snapchat, and other popular platforms regularly change their settings menus, so what you set up three months ago may look different today. Staying on top of these changes is an ongoing process, not a one-time task.",
        ],
      },
    ],
  },
  {
    id: "digital-role-model",
    icon: UserCheck,
    title: "Being a Digital Role Model",
    description: "Your own relationship with technology shapes your child's habits more than you might think.",
    topics: [
      "How your own social media use affects your kids",
      "Sharing photos of your children: risks and considerations",
      "Building a family culture of thoughtful technology use",
      "Resources for ongoing learning and community support",
    ],
    content: [
      {
        topic: "How your own social media use affects your kids",
        paragraphs: [
          "Children are always watching, and they learn far more from what you do than from what you say. When you check your phone at the dinner table, scroll through social media while they are trying to talk to you, or get visibly upset about something you read online, your child notices. These moments teach them what \"normal\" technology use looks like — whether you intend them to or not.",
          "This is not about being perfect. Everyone checks their phone too often sometimes, and it is okay to be honest about that. But being intentional about your own device use — putting your phone away during family time, not reaching for it first thing in the morning, and being present during conversations — sends a powerful message to your child about what healthy technology habits look like.",
          "Being mindful of your own use also gives you credibility when you set boundaries for your child. If you ask them to put their phone away at dinner but your own phone is sitting next to your plate, the message falls flat. Leading by example is one of the most effective things you can do as a parent in the digital age.",
        ],
      },
      {
        topic: "Sharing photos of your children: risks and considerations",
        paragraphs: [
          "\"Sharenting\" — the practice of parents sharing photos and information about their children on social media — has become incredibly common, but it comes with risks worth considering. Every photo you post of your child contributes to a digital footprint that they did not create and did not consent to. That digital footprint can follow them for years.",
          "Before sharing a photo of your child, consider a few questions: Would your child be embarrassed by this photo in 10 years? Could the information in the photo or caption (school uniforms, location tags, team names) be used to identify where your child goes to school or where they spend time? Are you sharing something that should be private, like a vulnerable moment or a medical situation?",
          "Some families handle this by establishing a rule: always ask the child's permission before posting photos of them, especially as they get older. Even young children can begin to understand the concept of consent when it comes to their own image. Whatever approach your family takes, the key is being thoughtful and intentional rather than sharing on autopilot.",
        ],
      },
      {
        topic: "Building a family culture of thoughtful technology use",
        paragraphs: [
          "Technology is not inherently good or bad — it is a tool, and like any tool, its value depends on how you use it. The goal is not to eliminate technology from your family's life, but to develop a healthy, intentional relationship with it. This starts with creating a family culture where technology is discussed openly and used thoughtfully.",
          "Practical steps include creating device-free spaces in your home (like the dining room or bedrooms), having regular family conversations about what everyone is seeing and doing online, celebrating offline activities and hobbies, and being honest about your own struggles with screen time. When the whole family works on healthy tech habits together, it feels less like punishment and more like a shared value.",
          "Remember that balance looks different for every family, and it will change as your children grow. What matters most is that technology serves your family rather than controlling it. Keep the conversation going, stay curious about your children's digital lives, and be willing to adjust your approach as the digital landscape evolves.",
        ],
      },
      {
        topic: "Resources for ongoing learning and community support",
        paragraphs: [
          "Learning about social media and digital safety is not a one-time conversation — it is an ongoing process that evolves as technology changes and your children grow. Staying informed does not require you to become a tech expert. It just means staying curious and checking in regularly with trusted sources of information.",
          "Common Sense Media (commonsensemedia.org) is an excellent resource for age-appropriate reviews of apps, games, movies, and more. They also offer guides specifically for parents on topics like screen time, social media, and digital citizenship. Your child's school may also offer digital literacy resources or parent education events — take advantage of these when they are available.",
          "Learning Academy is always here to support your family's digital literacy journey. Whether you have questions about a specific platform, need advice on setting up parental controls, or just want to talk through a situation your child is dealing with online, do not hesitate to reach out. Contact our tech support team at sisnett.meredith@gmail.com or mr.terryflood@gmail.com — we are here to help.",
        ],
      },
    ],
  },
];

export default function SocialMediaLiteracyPage() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-social-media-literacy">
            <Smartphone className="mr-1 h-3 w-3" /> Social Media Literacy
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" data-testid="text-hero-title">
            Social Media<br />Literacy
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Teaching social media the way we teach AI — with curiosity, critical thinking, and care.
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Three focused modules for students and three for parents, building the skills every family needs to navigate social media thoughtfully.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#students">
              <Button size="lg" className="bg-white text-teal-700 border-white/80" data-testid="button-explore-student-modules">
                <BookOpen className="mr-2 h-5 w-5" />
                Student Modules
              </Button>
            </Link>
            <Link href="#parents">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-explore-parent-modules">
                Parent Modules
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="students" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="mr-1 h-3 w-3" /> For Students
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-students-heading">
              For Students
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three modules designed to help kids in grades 3-12 understand, question, and take control of their social media experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentModules.map((mod) => {
              const isExpanded = expandedModules.has(mod.id);
              return (
                <Card
                  key={mod.id}
                  className={`p-6 cursor-pointer hover-elevate ${isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}`}
                  data-testid={`card-student-module-${mod.id}`}
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                          <mod.icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline" data-testid={`badge-grades-${mod.id}`}>
                          {mod.grades}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" data-testid={`icon-collapse-${mod.id}`} />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" data-testid={`icon-expand-${mod.id}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1" data-testid={`text-student-module-${mod.id}`}>
                        {mod.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                    </div>
                    {!isExpanded && (
                      <ul className="space-y-2">
                        {mod.topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {isExpanded && (
                      <div className="space-y-6 mt-2" data-testid={`content-student-module-${mod.id}`}>
                        {mod.content.map((section, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                              <h4 className="font-semibold text-sm">{section.topic}</h4>
                            </div>
                            <div className="pl-7 space-y-3">
                              {section.paragraphs.map((p, j) => (
                                <p key={j} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="parents" className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> For Parents & Guardians
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-parents-heading">
              For Parents & Guardians
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three modules to help you understand your child's online world, set meaningful boundaries, and lead by example.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentModules.map((mod) => {
              const isExpanded = expandedModules.has(mod.id);
              return (
                <Card
                  key={mod.id}
                  className={`p-6 cursor-pointer hover-elevate ${isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}`}
                  data-testid={`card-parent-module-${mod.id}`}
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                          <mod.icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" data-testid={`icon-collapse-${mod.id}`} />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" data-testid={`icon-expand-${mod.id}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1" data-testid={`text-parent-module-${mod.id}`}>
                        {mod.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                    </div>
                    {!isExpanded && (
                      <ul className="space-y-2">
                        {mod.topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {isExpanded && (
                      <div className="space-y-6 mt-2" data-testid={`content-parent-module-${mod.id}`}>
                        {mod.content.map((section, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                              <h4 className="font-semibold text-sm">{section.topic}</h4>
                            </div>
                            <div className="pl-7 space-y-3">
                              {section.paragraphs.map((p, j) => (
                                <p key={j} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-cyan-600 to-teal-700 border-none text-white">
            <div className="text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-cta-heading">
                Part of a Bigger Picture
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
                Social media literacy is one piece of the digital skills puzzle. Explore our full AI curriculum to see how students learn to think critically about all kinds of technology — with Spark, their AI learning companion, guiding the way.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/curriculum">
                  <Button size="lg" className="bg-white text-teal-700 border-white/80" data-testid="button-explore-curriculum">
                    <Brain className="mr-2 h-5 w-5" />
                    Explore AI Curriculum
                  </Button>
                </Link>
                <Link href="/ai-companion">
                  <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-meet-spark">
                    Meet Spark
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-need-help">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-semibold mb-0.5" data-testid="text-need-help-heading">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Have questions about social media literacy or need tech support? Reach out to us at{" "}
                  <a
                    href="mailto:sisnett.meredith@gmail.com"
                    className="text-primary underline underline-offset-2"
                    data-testid="link-support-email-cta"
                    onClick={(e) => e.stopPropagation()}
                  >
                    sisnett.meredith@gmail.com
                  </a>{" | "}
                  <a
                    href="mailto:mr.terryflood@gmail.com"
                    className="text-primary underline underline-offset-2"
                    data-testid="link-support-email-cta-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    mr.terryflood@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="py-10 px-6 border-t">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Learning Academy</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span data-testid="text-footer-email">
              Need help? Contact us at{" "}
              <a
                href="mailto:sisnett.meredith@gmail.com"
                className="text-primary underline underline-offset-2"
                data-testid="link-support-email-footer"
              >
                sisnett.meredith@gmail.com
              </a>{" | "}
              <a
                href="mailto:mr.terryflood@gmail.com"
                className="text-primary underline underline-offset-2"
                data-testid="link-support-email-footer-2"
              >
                mr.terryflood@gmail.com
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
