import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Clock, Film, Copy, Check,
  Shield, Users, BookOpen, BarChart3, Brain,
  Gamepad2, AlertTriangle, GraduationCap, Calendar,
  Megaphone, ClipboardList, Globe, Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";

const WEBSITE_URL = "https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev";

const VIDEO_SCRIPT = {
  title: "The Command Center Behind the Culture",
  subtitle: "A 3-Minute Tour of the ThriveUp Academy Admin Suite",
  totalDuration: "3:00",
  sections: [
    {
      id: "opening",
      timestamp: "0:00 - 0:20",
      duration: "20 sec",
      label: "OPENING",
      direction: "FADE IN from black. Soft ambient music builds. Animated particles converge to form the ThriveUp Academy Panther silhouette.",
      voiceover: "Every great learning community has something invisible powering it. Behind every student breakthrough, every parent sigh of relief, every teacher celebration... there is a system. A command center. Built not just for managing students, but for believing in them.",
      visualNotes: "Slow zoom into the Panther Village campus. Golden hour lighting. Subtle animated sparkles around buildings. Text appears: 'ThriveUp Academy'. Then fades to: 'The Admin Suite'.",
      icon: Sparkles,
    },
    {
      id: "admin-dashboard",
      timestamp: "0:20 - 0:45",
      duration: "25 sec",
      label: "ADMIN COMMAND CENTER",
      direction: "QUICK CUT to the Admin Dashboard. Camera sweeps across metrics cards, student leaderboard, activity feed, and wallet overview.",
      voiceover: "The Admin Dashboard gives you a bird's-eye view of your entire academy. Total students enrolled. Wallet balances flowing through the Panther Economy. Merit events recognizing character. Real-time activity feeds showing who is learning, building, and growing right now. Not spreadsheets. Not guesswork. Living data.",
      visualNotes: `Animate metric counters ticking up. Highlight the top students leaderboard. Show activity feed items appearing one by one. URL callout: ${WEBSITE_URL}/academy/admin`,
      icon: Shield,
    },
    {
      id: "course-creator",
      timestamp: "0:45 - 1:10",
      duration: "25 sec",
      label: "LMS COURSE CREATOR",
      direction: "SMOOTH TRANSITION to the Course Creator. Show the 3-step wizard animation: category cards appearing, form fields filling in, confirmation checkmark.",
      voiceover: "Need to launch a new academy? The Course Creator lets you build full curricula in minutes. Choose from ten categories, from Coaching to Technology, Finance to Fitness. Add modules. Add lessons. Text, video, quizzes, interactive content. Set difficulty levels. Track enrollments. This is not a tool. This is a publishing platform for your educational vision.",
      visualNotes: `Animate the wizard stepping through categories. Show module/lesson cards stacking. Enrollment table populating. URL callout: ${WEBSITE_URL}/academy/course-creator`,
      icon: BookOpen,
    },
    {
      id: "thrive-system",
      timestamp: "1:10 - 1:35",
      duration: "25 sec",
      label: "THRIVE ANALYTICS & EARLY WARNING",
      direction: "TRANSITION with a pulsing radar animation. Show the six-domain Thrive wheel spinning, then zoom into the Early Warning flags.",
      voiceover: "The Thrive system scores every student across six dimensions: academics, social-emotional health, engagement, life skills, community, and self-advocacy. But here is where it gets powerful. The Early Warning System watches for students slipping through the cracks. Declining scores trigger intervention playbooks. Not punishment. Support. Because the goal is never to catch students failing. It is to catch them before they fall.",
      visualNotes: `Animate the Thrive hexagon filling with scores. Show warning flags appearing with amber/red indicators. Intervention playbook cards fanning out. URL callout: ${WEBSITE_URL}/academy/thrive`,
      icon: Brain,
    },
    {
      id: "risk-and-tools",
      timestamp: "1:35 - 1:55",
      duration: "20 sec",
      label: "RISK MONITOR & TEACHER TOOLS",
      direction: "SPLIT SCREEN: Risk Decision Tracker on the left, Teacher Dashboard on the right. Both animate simultaneously.",
      voiceover: "The Risk Decision Tracker monitors financial decisions with configurable thresholds, turning every transaction into a teaching moment. Meanwhile, teachers have their own command center: classroom management, attendance tracking, progress reports, and student announcements. All connected. All in real time.",
      visualNotes: `Risk cards with severity badges animating. Teacher dashboard showing classroom overview, attendance dots filling in green. URL callouts: ${WEBSITE_URL}/academy/risk-monitor and ${WEBSITE_URL}/teacher-dashboard`,
      icon: AlertTriangle,
    },
    {
      id: "games-and-integration",
      timestamp: "1:55 - 2:20",
      duration: "25 sec",
      label: "GAME PLATFORM, CALENDAR & CROSS-PLATFORM",
      direction: "DYNAMIC MONTAGE: Quick cuts between Game Lobby, Calendar events, Announcements board, and the ISSS integration panel.",
      voiceover: "Students learn through play in the Panther Game Room with ELO-rated competitions. Admins manage the full academy calendar, push announcements that reach every student, and connect to external systems through the cross-platform integration hub. And for districts planning rollout? A complete implementation guide walks you through grade-by-grade deployment, pre-rollout checklists, and cost comparison calculators.",
      visualNotes: `Dominoes game board animating a move. Calendar filling with colorful events. Announcement cards sliding in. Integration API diagram pulsing. URL callout: ${WEBSITE_URL}/implementation`,
      icon: Gamepad2,
    },
    {
      id: "accessibility",
      timestamp: "2:20 - 2:35",
      duration: "15 sec",
      label: "ACCESSIBILITY & INCLUSION",
      direction: "GENTLE TRANSITION. Show the accessibility panel toggling features: dyslexia fonts activating, high contrast mode switching, Spanish language toggle.",
      voiceover: "Every feature you have seen works in English and Spanish. Every screen supports dyslexia-optimized fonts, high contrast mode, large text, reduced motion, and screen reader optimization. WCAG 2.1 AA compliant. Because if it is not accessible to everyone, it is not good enough for anyone.",
      visualNotes: "Side-by-side: same page in English then Spanish. Dyslexia font toggling on. High contrast mode activating. Accessibility badge glowing.",
      icon: Globe,
    },
    {
      id: "closing",
      timestamp: "2:35 - 3:00",
      duration: "25 sec",
      label: "CLOSING",
      direction: "PULL BACK to a wide shot of the Panther Village campus at sunset. Music reaches its peak. All feature icons orbit the campus like a constellation.",
      voiceover: "This is not just software. This is infrastructure for belief. Every dashboard, every alert, every course you create, every student you track... it all adds up to one thing: a community that refuses to let any child be invisible. The ThriveUp Academy Admin Suite. Built by educators. For educators. See it live.",
      visualNotes: `Feature icons (shield, book, brain, gamepad, globe) orbit and merge into the Panther logo. Final frame: '${WEBSITE_URL}' with the tagline 'Infrastructure for Belief.' Fade to black.`,
      icon: GraduationCap,
    },
  ],
  productionNotes: [
    "Total runtime: 3 minutes flat",
    "Music: Inspirational ambient, building to an emotional peak at the close. Suggest royalty-free tracks from Epidemic Sound or Artlist.",
    "Animation style: Clean motion graphics with the ThriveUp Academy maroon (#7A1F3E) and silver palette. Smooth transitions, no jarring cuts.",
    "Voice talent: Warm, confident, measured pace. Not a sales pitch. A story.",
    "Screen recordings: Capture live from the platform at each URL listed. Use slight zoom and pan effects over the UI.",
    `Website URL for end card and watermark: ${WEBSITE_URL}`,
    "Suggested tools for production: Canva Pro, After Effects, or Animoto for the animated segments. Loom or OBS for screen captures.",
    "Aspect ratio: 16:9 for presentations, 9:16 vertical cut for social media distribution.",
  ],
  adminPagesShowcased: [
    { name: "Admin Dashboard", path: "/academy/admin", description: "Central command center with metrics, leaderboard, and activity feed" },
    { name: "Course Creator", path: "/academy/course-creator", description: "LMS with wizard, modules, lessons, and enrollment tracking" },
    { name: "Thrive Analytics", path: "/academy/thrive", description: "Six-domain scoring engine with early warning system" },
    { name: "Risk Decision Monitor", path: "/academy/risk-monitor", description: "Financial decision tracking with configurable thresholds" },
    { name: "Teacher Dashboard", path: "/teacher-dashboard", description: "Classroom management, student oversight, and progress" },
    { name: "Attendance Tracker", path: "/academy/attendance", description: "Real-time attendance logging and reporting" },
    { name: "Progress Reports", path: "/academy/progress-report", description: "Student progress analytics and summaries" },
    { name: "Announcements", path: "/academy/announcements", description: "Platform-wide communication to all students" },
    { name: "Academy Calendar", path: "/academy/calendar", description: "Event management and scheduling" },
    { name: "Cross-Platform Integration", path: "/academy/integration", description: "ISSS and external system connectivity" },
    { name: "Game Platform Admin", path: "/academy/games", description: "Game lobby with ELO ratings and play session monitoring" },
    { name: "Implementation Guide", path: "/implementation", description: "District rollout planning with checklists and cost calculators" },
    { name: "Admin Tutorial", path: "/academy/admin-tutorial", description: "Guided walkthrough for new administrators" },
  ],
};

export default function AdminVideoScriptPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyFullScript = () => {
    const fullText = VIDEO_SCRIPT.sections
      .map(s => `[${s.timestamp}] ${s.label}\n\nDIRECTION: ${s.direction}\n\nVOICEOVER:\n"${s.voiceover}"\n\nVISUAL NOTES: ${s.visualNotes}`)
      .join("\n\n---\n\n");
    const productionNotes = VIDEO_SCRIPT.productionNotes.join("\n- ");
    const adminPages = VIDEO_SCRIPT.adminPagesShowcased.map(p => `- ${p.name}: ${WEBSITE_URL}${p.path} - ${p.description}`).join("\n");

    const fullScript = `${VIDEO_SCRIPT.title}\n${VIDEO_SCRIPT.subtitle}\nTotal Duration: ${VIDEO_SCRIPT.totalDuration}\n\n${"=".repeat(60)}\n\n${fullText}\n\n${"=".repeat(60)}\n\nPRODUCTION NOTES:\n- ${productionNotes}\n\nADMIN PAGES SHOWCASED:\n${adminPages}\n\nWEBSITE: ${WEBSITE_URL}`;

    navigator.clipboard.writeText(fullScript);
    toast({ title: "Full script copied to clipboard" });
  };


  useEffect(() => { document.title = "Video Script | ThriveUp Academy"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <PageHeader
          title="Video Script Generator"
          description={VIDEO_SCRIPT.subtitle}
          breadcrumbs={[{ label: "Admin", href: "/academy/admin" }, { label: "Video Script" }]}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {VIDEO_SCRIPT.totalDuration}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Film className="w-3 h-3" />
                {VIDEO_SCRIPT.sections.length} Scenes
              </Badge>
              <Button onClick={copyFullScript} data-testid="button-copy-full-script">
                <Copy className="w-4 h-4 mr-2" />
                Copy Full Script
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Website URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="flex-1 bg-muted px-4 py-2 rounded-md text-sm font-mono break-all" data-testid="text-website-url">
                {WEBSITE_URL}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(WEBSITE_URL, "url")}
                data-testid="button-copy-url"
                aria-label="Copy URL"
              >
                {copiedSection === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Scene-by-Scene Script</h2>
          {VIDEO_SCRIPT.sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="hover-elevate" data-testid={`card-scene-${section.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">Scene {index + 1}</Badge>
                        <span className="font-semibold">{section.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {section.timestamp}
                        <span className="text-xs">({section.duration})</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(
                      `[${section.timestamp}] ${section.label}\n\nDIRECTION: ${section.direction}\n\nVOICEOVER:\n"${section.voiceover}"\n\nVISUAL NOTES: ${section.visualNotes}`,
                      section.id
                    )}
                    data-testid={`button-copy-scene-${section.id}`}
                    aria-label={`Copy scene ${index + 1}`}
                  >
                    {copiedSection === section.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Direction</p>
                    <p className="text-sm italic">{section.direction}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-md p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Voiceover</p>
                    <p className="text-sm leading-relaxed">"{section.voiceover}"</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Visual Notes</p>
                    <p className="text-sm text-muted-foreground">{section.visualNotes}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Production Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {VIDEO_SCRIPT.productionNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Play className="w-3 h-3 mt-1 shrink-0 text-primary" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Pages Showcased ({VIDEO_SCRIPT.adminPagesShowcased.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {VIDEO_SCRIPT.adminPagesShowcased.map((page) => (
                <div
                  key={page.path}
                  className="flex items-start gap-3 p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                  onClick={() => navigate(page.path)}
                  data-testid={`link-admin-page-${page.path.replace(/\//g, "-")}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.description}</p>
                    <code className="text-xs text-primary mt-1 block">{page.path}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
