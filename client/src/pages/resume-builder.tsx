import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileText, User, GraduationCap, Briefcase, Award, Star,
  Download, Share2, Save, CheckCircle2, ChevronRight, ChevronDown,
  Mail, Phone, MapPin, Globe, Linkedin, Target, Sparkles, Eye,
} from "lucide-react";

interface ResumeData {
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    linkedin: string;
    portfolio: string;
  };
  objective: string;
  education: Array<{
    school: string;
    degree: string;
    graduationDate: string;
    gpa: string;
    relevantCourses: string;
    honors: string;
  }>;
  skills: {
    hard: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    impact: string;
  }>;
  volunteer: Array<{
    role: string;
    organization: string;
    description: string;
  }>;
  references: Array<{
    name: string;
    title: string;
    relationship: string;
    phone: string;
    email: string;
  }>;
}

const EMPTY_RESUME: ResumeData = {
  contactInfo: { fullName: "", email: "", phone: "", city: "", state: "", linkedin: "", portfolio: "" },
  objective: "",
  education: [{ school: "", degree: "", graduationDate: "", gpa: "", relevantCourses: "", honors: "" }],
  skills: { hard: [], soft: [], languages: [], certifications: [] },
  experience: [{ title: "", company: "", startDate: "", endDate: "", current: false, bullets: [""] }],
  projects: [{ name: "", description: "", impact: "" }],
  volunteer: [{ role: "", organization: "", description: "" }],
  references: [{ name: "", title: "", relationship: "", phone: "", email: "" }],
};

const MODULES = [
  {
    id: 1,
    title: "Professional Presence",
    section: "Contact Info, Objective & Education",
    fields: ["contactInfo", "objective", "education"],
    color: "bg-blue-500",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    tips: [
      "Your name goes at the top, larger and bold",
      "Use a professional email (firstname.lastname@gmail.com)",
      "City and state only — no full address needed",
      "Objective: 1-2 sentences about the role you want and what you bring",
    ],
  },
  {
    id: 2,
    title: "Workplace Rights",
    section: "Skills Section",
    fields: ["skills"],
    color: "bg-purple-500",
    borderColor: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    tips: [
      "Hard skills = things you can DO (Excel, cooking, coding, driving)",
      "Soft skills = HOW you work (communication, teamwork, problem-solving)",
      "Translate your real experience: babysitting = childcare management",
      "Include languages you speak — that's a professional skill",
    ],
  },
  {
    id: 3,
    title: "Workplace Safety",
    section: "Certifications & Training",
    fields: ["certifications"],
    color: "bg-orange-500",
    borderColor: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    tips: [
      "Include any certifications even if not finished yet (write 'In Progress')",
      "Free certs count: Google Digital Garage, OSHA 10-Hour, Food Handler",
      "CPR/First Aid, driver's license, any training at work — list it all",
      "These show employers you're serious about professional development",
    ],
  },
  {
    id: 4,
    title: "Time Management",
    section: "Projects & Accomplishments",
    fields: ["projects"],
    color: "bg-green-500",
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    tips: [
      "Use Google's XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]",
      "School projects, community work, personal initiatives all count",
      "Quantify when possible: 'organized event for 50+ attendees'",
      "Show IMPACT, not just activity",
    ],
  },
  {
    id: 5,
    title: "Work Ethic & Leadership",
    section: "Experience, Volunteering, References & Final Polish",
    fields: ["experience", "volunteer", "references"],
    color: "bg-indigo-500",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    tips: [
      "Most recent experience first (reverse chronological)",
      "Use action verbs: managed, organized, trained, created, resolved",
      "Volunteer work IS work experience — list it proudly",
      "References: teachers, coaches, church leaders, supervisors, mentors",
    ],
  },
];

const SKILL_TRANSLATIONS: Record<string, string> = {
  "Babysitting": "Childcare Management",
  "Church volunteering": "Event Coordination & Community Service",
  "Helping at family business": "Customer Service & Operations",
  "Translating for family": "Bilingual Communication",
  "Managing group chats": "Digital Communication & Coordination",
  "Planning hangouts": "Event Planning & Logistics",
  "Tutoring siblings": "Peer Education & Mentorship",
  "Social media management": "Digital Marketing & Content Creation",
  "Gaming team leader": "Team Leadership & Strategic Planning",
  "Mowing lawns": "Small Business Operations & Client Relations",
};

function SkillTranslator() {
  const [input, setInput] = useState("");
  const matchedSkill = Object.entries(SKILL_TRANSLATIONS).find(
    ([key]) => input.toLowerCase().includes(key.toLowerCase())
  );

  return (
    <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30" data-testid="skill-translator">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Skill Translator</span>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
        Type what you do and see how it translates to professional language
      </p>
      <Input
        placeholder="e.g., babysitting, church volunteering, translating for family..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="text-sm"
        data-testid="input-skill-translator"
      />
      {matchedSkill && (
        <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30">
          <span className="text-xs text-amber-600 dark:text-amber-400">Professional version:</span>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{matchedSkill[1]}</p>
        </div>
      )}
    </Card>
  );
}

function ResumePreview({ data }: { data: ResumeData }) {
  const ci = data.contactInfo;
  const hasContent = ci.fullName || data.objective || data.education[0]?.school;

  if (!hasContent) {
    return (
      <Card className="p-8 text-center border-dashed" data-testid="resume-preview-empty">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Your resume preview will appear here as you fill in each section.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-950 border shadow-sm font-serif" data-testid="resume-preview">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          {ci.fullName || "Your Name"}
        </h2>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
          {ci.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ci.email}</span>}
          {ci.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{ci.phone}</span>}
          {ci.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ci.city}{ci.state ? `, ${ci.state}` : ""}</span>}
          {ci.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{ci.linkedin}</span>}
        </div>
      </div>

      {data.objective && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Objective</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300">{data.objective}</p>
        </div>
      )}

      {data.education.some(e => e.school) && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Education</h3>
          {data.education.filter(e => e.school).map((edu, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{edu.school}</span>
                <span className="text-xs text-gray-500">{edu.graduationDate}</span>
              </div>
              {edu.degree && <p className="text-xs text-gray-600 dark:text-gray-400 italic">{edu.degree}</p>}
              {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
              {edu.honors && <p className="text-xs text-gray-500">Honors: {edu.honors}</p>}
            </div>
          ))}
        </div>
      )}

      {(data.skills.hard.length > 0 || data.skills.soft.length > 0) && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Skills</h3>
          {data.skills.hard.length > 0 && (
            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Technical:</strong> {data.skills.hard.join(", ")}</p>
          )}
          {data.skills.soft.length > 0 && (
            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Professional:</strong> {data.skills.soft.join(", ")}</p>
          )}
          {data.skills.languages.length > 0 && (
            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Languages:</strong> {data.skills.languages.join(", ")}</p>
          )}
          {data.skills.certifications.length > 0 && (
            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Certifications:</strong> {data.skills.certifications.join(", ")}</p>
          )}
        </div>
      )}

      {data.experience.some(e => e.title) && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Experience</h3>
          {data.experience.filter(e => e.title).map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{exp.title}</span>
                <span className="text-xs text-gray-500">{exp.startDate}{exp.endDate ? ` — ${exp.current ? "Present" : exp.endDate}` : ""}</span>
              </div>
              {exp.company && <p className="text-xs text-gray-600 dark:text-gray-400 italic">{exp.company}</p>}
              {exp.bullets.filter(b => b).length > 0 && (
                <ul className="list-disc ml-4 mt-0.5">
                  {exp.bullets.filter(b => b).map((b, j) => (
                    <li key={j} className="text-xs text-gray-700 dark:text-gray-300">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {data.projects.some(p => p.name) && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Projects & Accomplishments</h3>
          {data.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} className="mb-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{proj.name}</span>
              {proj.description && <p className="text-xs text-gray-600 dark:text-gray-400">{proj.description}</p>}
              {proj.impact && <p className="text-xs text-gray-500 italic">Impact: {proj.impact}</p>}
            </div>
          ))}
        </div>
      )}

      {data.volunteer.some(v => v.role) && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">Volunteer Experience</h3>
          {data.volunteer.filter(v => v.role).map((vol, i) => (
            <div key={i} className="mb-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{vol.role}</span>
              {vol.organization && <span className="text-xs text-gray-500"> — {vol.organization}</span>}
              {vol.description && <p className="text-xs text-gray-600 dark:text-gray-400">{vol.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.references.some(r => r.name) && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 pb-1 mb-1">References</h3>
          {data.references.filter(r => r.name).map((ref, i) => (
            <div key={i} className="mb-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ref.name}</span>
              {ref.title && <span className="text-xs text-gray-500"> — {ref.title}</span>}
              {ref.relationship && <span className="text-xs text-gray-400"> ({ref.relationship})</span>}
              <div className="text-xs text-gray-500">
                {ref.phone && <span>{ref.phone}</span>}
                {ref.phone && ref.email && <span> | </span>}
                {ref.email && <span>{ref.email}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function ResumeBuilderPage() {
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [resume, setResume] = useState<ResumeData>(EMPTY_RESUME);
  const [skillInput, setSkillInput] = useState({ hard: "", soft: "", language: "", cert: "" });

  const { data: savedResume } = useQuery<{ resumeData: ResumeData }>({
    queryKey: ["/api/resume-builder"],
  });

  useEffect(() => {
    if (savedResume?.resumeData) {
      setResume(savedResume.resumeData);
    }
  }, [savedResume]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/resume-builder", { resumeData: resume });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume-builder"] });
      toast({ title: "Resume saved", description: "Your progress has been saved." });
    },
  });

  const completionPercent = (() => {
    let filled = 0;
    let total = 7;
    if (resume.contactInfo.fullName) filled++;
    if (resume.objective) filled++;
    if (resume.education[0]?.school) filled++;
    if (resume.skills.hard.length > 0 || resume.skills.soft.length > 0) filled++;
    if (resume.experience[0]?.title) filled++;
    if (resume.projects[0]?.name) filled++;
    if (resume.references[0]?.name) filled++;
    return Math.round((filled / total) * 100);
  })();

  const addSkill = (type: "hard" | "soft" | "languages" | "certifications", inputKey: keyof typeof skillInput) => {
    const val = skillInput[inputKey].trim();
    if (!val) return;
    setResume(prev => ({
      ...prev,
      skills: { ...prev.skills, [type]: [...prev.skills[type], val] },
    }));
    setSkillInput(prev => ({ ...prev, [inputKey]: "" }));
  };

  const removeSkill = (type: "hard" | "soft" | "languages" | "certifications", index: number) => {
    setResume(prev => ({
      ...prev,
      skills: { ...prev.skills, [type]: prev.skills[type].filter((_, i) => i !== index) },
    }));
  };

  const updateContact = (field: keyof ResumeData["contactInfo"], value: string) => {
    setResume(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, [field]: value } }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResume(prev => {
      const edu = [...prev.education];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    setResume(prev => {
      const exp = [...prev.experience];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, experience: exp };
    });
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    setResume(prev => {
      const exp = [...prev.experience];
      const bullets = [...exp[expIndex].bullets];
      bullets[bulletIndex] = value;
      exp[expIndex] = { ...exp[expIndex], bullets };
      return { ...prev, experience: exp };
    });
  };

  const addBullet = (expIndex: number) => {
    setResume(prev => {
      const exp = [...prev.experience];
      exp[expIndex] = { ...exp[expIndex], bullets: [...exp[expIndex].bullets, ""] };
      return { ...prev, experience: exp };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-green-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 mb-2">
              Progressive Resume Builder
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Build Your Resume
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              One section per module. By Module 5, you have a complete, professional resume.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} data-testid="button-toggle-preview">
              <Eye className="w-4 h-4 mr-2" />{showPreview ? "Hide" : "Show"} Preview
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-resume">
              <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Progress value={completionPercent} className="flex-1 h-3" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="text-completion-percent">{completionPercent}% Complete</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeModule === mod.id
                  ? `${mod.bgColor} ${mod.borderColor} border-2 shadow-sm`
                  : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              data-testid={`button-module-${mod.id}`}
            >
              <div className={`w-6 h-6 rounded-full ${mod.color} text-white flex items-center justify-center text-xs font-bold`}>
                {mod.id}
              </div>
              <span className="hidden sm:inline">{mod.section.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <div className={`grid gap-6 ${showPreview ? "md:grid-cols-2" : "grid-cols-1 max-w-3xl"}`}>
          <div className="space-y-4">
            {MODULES.filter(m => m.id === activeModule).map(mod => (
              <div key={mod.id}>
                <Card className={`p-5 ${mod.borderColor} border-2 ${mod.bgColor}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${mod.color} text-white flex items-center justify-center font-bold`}>
                      {mod.id}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">Module {mod.id}: {mod.title}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mod.section}</p>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tips for this section:</p>
                    <ul className="space-y-1">
                      {mod.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {mod.id === 1 && (
                  <div className="space-y-4 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" /> Contact Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input placeholder="Full Name" value={resume.contactInfo.fullName} onChange={e => updateContact("fullName", e.target.value)} data-testid="input-fullname" />
                        <Input placeholder="Email" type="email" value={resume.contactInfo.email} onChange={e => updateContact("email", e.target.value)} data-testid="input-email" />
                        <Input placeholder="Phone" value={resume.contactInfo.phone} onChange={e => updateContact("phone", e.target.value)} data-testid="input-phone" />
                        <Input placeholder="City" value={resume.contactInfo.city} onChange={e => updateContact("city", e.target.value)} data-testid="input-city" />
                        <Input placeholder="State" value={resume.contactInfo.state} onChange={e => updateContact("state", e.target.value)} data-testid="input-state" />
                        <Input placeholder="LinkedIn URL (optional)" value={resume.contactInfo.linkedin} onChange={e => updateContact("linkedin", e.target.value)} data-testid="input-linkedin" />
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" /> Objective Statement
                      </h3>
                      <Textarea
                        placeholder="Example: Motivated high school junior seeking a part-time position where I can apply my strong communication skills, reliability, and customer service experience while gaining hands-on professional development."
                        value={resume.objective}
                        onChange={e => setResume(prev => ({ ...prev, objective: e.target.value }))}
                        rows={3}
                        data-testid="input-objective"
                      />
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-500" /> Education
                      </h3>
                      {resume.education.map((edu, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input placeholder="School Name" value={edu.school} onChange={e => updateEducation(i, "school", e.target.value)} data-testid={`input-school-${i}`} />
                          <Input placeholder="Expected Graduation (e.g., May 2027)" value={edu.graduationDate} onChange={e => updateEducation(i, "graduationDate", e.target.value)} data-testid={`input-grad-${i}`} />
                          <Input placeholder="Degree/Program (e.g., High School Diploma)" value={edu.degree} onChange={e => updateEducation(i, "degree", e.target.value)} data-testid={`input-degree-${i}`} />
                          <Input placeholder="GPA (optional)" value={edu.gpa} onChange={e => updateEducation(i, "gpa", e.target.value)} data-testid={`input-gpa-${i}`} />
                          <Input placeholder="Relevant Courses (optional)" value={edu.relevantCourses} onChange={e => updateEducation(i, "relevantCourses", e.target.value)} className="sm:col-span-2" data-testid={`input-courses-${i}`} />
                          <Input placeholder="Honors/Awards (optional)" value={edu.honors} onChange={e => updateEducation(i, "honors", e.target.value)} className="sm:col-span-2" data-testid={`input-honors-${i}`} />
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                {mod.id === 2 && (
                  <div className="space-y-4 mt-4">
                    <SkillTranslator />
                    {(["hard", "soft", "languages", "certifications"] as const).map(type => {
                      const labels: Record<string, { title: string; placeholder: string; inputKey: keyof typeof skillInput }> = {
                        hard: { title: "Technical / Hard Skills", placeholder: "e.g., Microsoft Excel, cash register, cooking...", inputKey: "hard" },
                        soft: { title: "Professional / Soft Skills", placeholder: "e.g., communication, teamwork, problem-solving...", inputKey: "soft" },
                        languages: { title: "Languages", placeholder: "e.g., English, Spanish, ASL...", inputKey: "language" },
                        certifications: { title: "Certifications & Training", placeholder: "e.g., Food Handler, CPR, Google Digital Garage...", inputKey: "cert" },
                      };
                      const config = labels[type];
                      return (
                        <Card key={type} className="p-4">
                          <h3 className="font-semibold text-sm mb-2">{config.title}</h3>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder={config.placeholder}
                              value={skillInput[config.inputKey]}
                              onChange={e => setSkillInput(prev => ({ ...prev, [config.inputKey]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") addSkill(type, config.inputKey); }}
                              data-testid={`input-skill-${type}`}
                            />
                            <Button size="sm" onClick={() => addSkill(type, config.inputKey)} data-testid={`button-add-${type}`}>Add</Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.skills[type].map((s, i) => (
                              <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => removeSkill(type, i)}>
                                {s} &times;
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {mod.id === 3 && (
                  <div className="space-y-4 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" /> Certifications & Training
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Add certifications from Module 2 Skills section above, or add new ones here.
                        Include certifications in progress — write "(In Progress)" after the name.
                      </p>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="e.g., OSHA 10-Hour (In Progress), Texas Food Handler..."
                          value={skillInput.cert}
                          onChange={e => setSkillInput(prev => ({ ...prev, cert: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") addSkill("certifications", "cert"); }}
                          data-testid="input-cert-m3"
                        />
                        <Button size="sm" onClick={() => addSkill("certifications", "cert")} data-testid="button-add-cert-m3">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.certifications.map((c, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => removeSkill("certifications", i)}>
                            {c} &times;
                          </Badge>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Free certifications to consider: OSHA 10-Hour General Industry, Texas Food Handler, Google Digital Garage, 
                        CPR/First Aid (Red Cross), Microsoft Office Specialist, HubSpot Marketing, Google Analytics
                      </p>
                    </Card>
                  </div>
                )}

                {mod.id === 4 && (
                  <div className="space-y-4 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-500" /> Projects & Accomplishments
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Use Google's XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"
                      </p>
                      {resume.projects.map((proj, i) => (
                        <div key={i} className="space-y-2 mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <Input placeholder="Project/Accomplishment Name" value={proj.name} onChange={e => {
                            const p = [...resume.projects]; p[i] = { ...p[i], name: e.target.value }; setResume(prev => ({ ...prev, projects: p }));
                          }} data-testid={`input-project-name-${i}`} />
                          <Textarea placeholder="What you did and how" value={proj.description} onChange={e => {
                            const p = [...resume.projects]; p[i] = { ...p[i], description: e.target.value }; setResume(prev => ({ ...prev, projects: p }));
                          }} rows={2} data-testid={`input-project-desc-${i}`} />
                          <Input placeholder="Impact (quantify if possible)" value={proj.impact} onChange={e => {
                            const p = [...resume.projects]; p[i] = { ...p[i], impact: e.target.value }; setResume(prev => ({ ...prev, projects: p }));
                          }} data-testid={`input-project-impact-${i}`} />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setResume(prev => ({ ...prev, projects: [...prev.projects, { name: "", description: "", impact: "" }] }))} data-testid="button-add-project">
                        Add Another Project
                      </Button>
                    </Card>
                  </div>
                )}

                {mod.id === 5 && (
                  <div className="space-y-4 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" /> Work & Volunteer Experience
                      </h3>
                      {resume.experience.map((exp, i) => (
                        <div key={i} className="space-y-2 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="Job Title / Role" value={exp.title} onChange={e => updateExperience(i, "title", e.target.value)} data-testid={`input-exp-title-${i}`} />
                            <Input placeholder="Company / Organization" value={exp.company} onChange={e => updateExperience(i, "company", e.target.value)} data-testid={`input-exp-company-${i}`} />
                            <Input placeholder="Start Date (e.g., June 2025)" value={exp.startDate} onChange={e => updateExperience(i, "startDate", e.target.value)} data-testid={`input-exp-start-${i}`} />
                            <Input placeholder="End Date (or leave blank if current)" value={exp.endDate} onChange={e => updateExperience(i, "endDate", e.target.value)} data-testid={`input-exp-end-${i}`} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Bullet points (use action verbs: managed, organized, trained, created):</p>
                          {exp.bullets.map((b, j) => (
                            <Input key={j} placeholder={`Bullet ${j + 1}: e.g., Trained 3 new team members on POS system`} value={b} onChange={e => updateBullet(i, j, e.target.value)} data-testid={`input-exp-bullet-${i}-${j}`} />
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => addBullet(i)} data-testid={`button-add-bullet-${i}`}>+ Add bullet</Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setResume(prev => ({
                        ...prev, experience: [...prev.experience, { title: "", company: "", startDate: "", endDate: "", current: false, bullets: [""] }]
                      }))} data-testid="button-add-experience">Add Another Position</Button>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3">Volunteer Experience</h3>
                      {resume.volunteer.map((vol, i) => (
                        <div key={i} className="space-y-2 mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <Input placeholder="Role (e.g., Youth Mentor)" value={vol.role} onChange={e => {
                            const v = [...resume.volunteer]; v[i] = { ...v[i], role: e.target.value }; setResume(prev => ({ ...prev, volunteer: v }));
                          }} data-testid={`input-vol-role-${i}`} />
                          <Input placeholder="Organization" value={vol.organization} onChange={e => {
                            const v = [...resume.volunteer]; v[i] = { ...v[i], organization: e.target.value }; setResume(prev => ({ ...prev, volunteer: v }));
                          }} data-testid={`input-vol-org-${i}`} />
                          <Textarea placeholder="What you did" value={vol.description} onChange={e => {
                            const v = [...resume.volunteer]; v[i] = { ...v[i], description: e.target.value }; setResume(prev => ({ ...prev, volunteer: v }));
                          }} rows={2} data-testid={`input-vol-desc-${i}`} />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setResume(prev => ({ ...prev, volunteer: [...prev.volunteer, { role: "", organization: "", description: "" }] }))} data-testid="button-add-volunteer">
                        Add Volunteer Experience
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold text-sm mb-3">References</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Teachers, coaches, church leaders, supervisors, family friends who know your character and work ethic.
                      </p>
                      {resume.references.map((ref, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <Input placeholder="Name" value={ref.name} onChange={e => {
                            const r = [...resume.references]; r[i] = { ...r[i], name: e.target.value }; setResume(prev => ({ ...prev, references: r }));
                          }} data-testid={`input-ref-name-${i}`} />
                          <Input placeholder="Title (e.g., Teacher, Pastor)" value={ref.title} onChange={e => {
                            const r = [...resume.references]; r[i] = { ...r[i], title: e.target.value }; setResume(prev => ({ ...prev, references: r }));
                          }} data-testid={`input-ref-title-${i}`} />
                          <Input placeholder="Relationship (e.g., Teacher, Coach)" value={ref.relationship} onChange={e => {
                            const r = [...resume.references]; r[i] = { ...r[i], relationship: e.target.value }; setResume(prev => ({ ...prev, references: r }));
                          }} data-testid={`input-ref-rel-${i}`} />
                          <Input placeholder="Phone" value={ref.phone} onChange={e => {
                            const r = [...resume.references]; r[i] = { ...r[i], phone: e.target.value }; setResume(prev => ({ ...prev, references: r }));
                          }} data-testid={`input-ref-phone-${i}`} />
                          <Input placeholder="Email" value={ref.email} onChange={e => {
                            const r = [...resume.references]; r[i] = { ...r[i], email: e.target.value }; setResume(prev => ({ ...prev, references: r }));
                          }} className="sm:col-span-2" data-testid={`input-ref-email-${i}`} />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setResume(prev => ({
                        ...prev, references: [...prev.references, { name: "", title: "", relationship: "", phone: "", email: "" }]
                      }))} data-testid="button-add-reference">Add Reference</Button>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showPreview && (
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Live Preview</h3>
                <Button variant="ghost" size="sm" data-testid="button-download-resume">
                  <Download className="w-4 h-4 mr-1" /> Download PDF
                </Button>
              </div>
              <ResumePreview data={resume} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
