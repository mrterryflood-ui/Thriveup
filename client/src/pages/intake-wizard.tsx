import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User, MapPin, Briefcase, GraduationCap, Scale, Heart,
  Users, Target, FileCheck, CheckCircle2, ChevronLeft, ChevronRight,
  ClipboardList, Shield
} from "lucide-react";
import { TrainingGuideButton } from "@/components/training-guide";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: ClipboardList },
  { key: "personal", label: "About You", icon: User },
  { key: "contact", label: "Contact & Housing", icon: MapPin },
  { key: "background", label: "Background", icon: Briefcase },
  { key: "justice", label: "Justice History", icon: Scale },
  { key: "health", label: "Health & Wellbeing", icon: Heart },
  { key: "family", label: "Family & Support", icon: Users },
  { key: "goals", label: "Goals & Needs", icon: Target },
  { key: "referral", label: "Referral Info", icon: Shield },
  { key: "consent", label: "Consent", icon: FileCheck },
  { key: "review", label: "Review & Submit", icon: CheckCircle2 },
];

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Transgender Male", "Transgender Female", "Other", "Prefer not to say"];
const RACE_OPTIONS = ["American Indian/Alaska Native", "Asian", "Black/African American", "Hispanic/Latino", "Native Hawaiian/Pacific Islander", "White", "Two or More Races", "Other", "Prefer not to say"];
const HOUSING_OPTIONS = ["Stable housing", "Transitional housing", "Shelter", "Homeless", "Living with family/friends", "Incarcerated", "Other"];
const EMPLOYMENT_OPTIONS = ["Full-time employed", "Part-time employed", "Self-employed", "Unemployed - seeking", "Unemployed - not seeking", "Student", "Retired", "Unable to work"];
const EDUCATION_OPTIONS = ["No formal education", "Some high school", "GED/HSE", "High school diploma", "Some college", "Associate degree", "Bachelor's degree", "Graduate degree", "Trade/vocational certificate"];
const REFERRAL_SOURCES = ["Court/Probation", "Community organization", "Self-referral", "Church/Faith organization", "Law enforcement", "School/Education", "Family member", "Social services", "Healthcare provider", "Other"];
const SERVICE_NEEDS = ["Housing assistance", "Employment support", "Education/GED", "Mental health services", "Substance abuse treatment", "Legal aid", "Transportation", "Childcare", "Food assistance", "Financial coaching", "Mentoring", "Healthcare", "ID/Document recovery", "Family reunification"];
const HEALTH_NEEDS_OPTIONS = ["Physical health concerns", "Mental health needs", "Substance use concerns", "Dental needs", "Vision needs", "Medication management", "Chronic condition management", "None"];
const DISABILITY_OPTIONS = ["None", "Physical", "Cognitive/Intellectual", "Mental health", "Sensory (vision/hearing)", "Multiple", "Prefer not to say"];

const CONSENT_TYPES = [
  { type: "data_collection", label: "Data Collection & Use", description: "I understand that my information will be collected to help connect me with appropriate services and track progress toward my goals. My data will be used for program improvement and reporting to funding organizations. Personal identifiers will be protected." },
  { type: "service_participation", label: "Voluntary Participation", description: "I understand that my participation in all services is voluntary. I may decline any service at any time without penalty. I can request changes to my service plan at any point." },
  { type: "information_sharing", label: "Information Sharing", description: "I authorize the sharing of my non-identifying information with partner organizations for the purpose of coordinating my services. I understand I can revoke this consent at any time by notifying my case manager." },
  { type: "emergency_contact", label: "Emergency Contact Authorization", description: "In the event of an emergency, I authorize program staff to contact my designated emergency contact and/or emergency services on my behalf." },
];

interface FormData {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  genderOther: string;
  raceEthnicity: string[];
  veteranStatus: boolean;
  disabilityStatus: string;
  disabilityDetails: string;
  primaryLanguage: string;
  needsInterpreter: boolean;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  housingStatus: string;
  housingDetails: string;
  employmentStatus: string;
  employmentHistory: string;
  educationLevel: string;
  educationDetails: string;
  justiceInvolved: boolean;
  justiceDetails: {
    offenseType?: string;
    incarcerationLength?: string;
    releaseType?: string;
    priorConvictions?: number;
  };
  releaseDate: string;
  supervisionStatus: string;
  healthNeeds: string[];
  mentalHealthNeeds: string;
  substanceUseHistory: string;
  familySituation: string;
  dependents: number;
  immediateNeeds: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  referralSource: string;
  referralSourceDetail: string;
  referredBy: string;
  notes: string;
  consents: Record<string, boolean>;
  digitalSignature: string;
}

const initialFormData: FormData = {
  firstName: "", lastName: "", preferredName: "", dateOfBirth: "", gender: "", genderOther: "",
  raceEthnicity: [], veteranStatus: false, disabilityStatus: "", disabilityDetails: "",
  primaryLanguage: "English", needsInterpreter: false,
  phone: "", email: "", address: "", city: "", state: "", zipCode: "",
  housingStatus: "", housingDetails: "",
  employmentStatus: "", employmentHistory: "", educationLevel: "", educationDetails: "",
  justiceInvolved: false, justiceDetails: {}, releaseDate: "", supervisionStatus: "",
  healthNeeds: [], mentalHealthNeeds: "", substanceUseHistory: "",
  familySituation: "", dependents: 0,
  immediateNeeds: [], shortTermGoals: [], longTermGoals: [],
  referralSource: "", referralSourceDetail: "", referredBy: "", notes: "",
  consents: {}, digitalSignature: "",
};

function CheckboxGroup({ options, selected, onChange, testIdPrefix }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; testIdPrefix: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])}
            data-testid={`${testIdPrefix}-${opt.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function GoalInput({ goals, onChange, placeholder, testId }: {
  goals: string[]; onChange: (v: string[]) => void; placeholder: string; testId: string;
}) {
  const [inputVal, setInputVal] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder={placeholder}
          data-testid={`${testId}-input`}
          onKeyDown={e => {
            if (e.key === "Enter" && inputVal.trim()) {
              e.preventDefault();
              onChange([...goals, inputVal.trim()]);
              setInputVal("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { if (inputVal.trim()) { onChange([...goals, inputVal.trim()]); setInputVal(""); } }}
          data-testid={`${testId}-add`}
        >Add</Button>
      </div>
      {goals.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {goals.map((g, i) => (
            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => onChange(goals.filter((_, idx) => idx !== i))} data-testid={`${testId}-tag-${i}`}>
              {g} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntakeWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const profilePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        preferredName: form.preferredName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        age: form.dateOfBirth ? Math.floor((Date.now() - new Date(form.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        gender: form.gender || undefined,
        genderOther: form.genderOther || undefined,
        raceEthnicity: form.raceEthnicity.length > 0 ? form.raceEthnicity : undefined,
        veteranStatus: form.veteranStatus,
        disabilityStatus: form.disabilityStatus || undefined,
        disabilityDetails: form.disabilityDetails || undefined,
        primaryLanguage: form.primaryLanguage,
        needsInterpreter: form.needsInterpreter,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        housingStatus: form.housingStatus || undefined,
        housingDetails: form.housingDetails || undefined,
        employmentStatus: form.employmentStatus || undefined,
        employmentHistory: form.employmentHistory || undefined,
        educationLevel: form.educationLevel || undefined,
        educationDetails: form.educationDetails || undefined,
        justiceInvolved: form.justiceInvolved,
        justiceDetails: form.justiceInvolved ? form.justiceDetails : undefined,
        releaseDate: form.releaseDate || undefined,
        supervisionStatus: form.supervisionStatus || undefined,
        healthNeeds: form.healthNeeds.length > 0 ? form.healthNeeds : undefined,
        mentalHealthNeeds: form.mentalHealthNeeds || undefined,
        substanceUseHistory: form.substanceUseHistory || undefined,
        familySituation: form.familySituation || undefined,
        dependents: form.dependents,
        immediateNeeds: form.immediateNeeds.length > 0 ? form.immediateNeeds : undefined,
        shortTermGoals: form.shortTermGoals.length > 0 ? form.shortTermGoals : undefined,
        longTermGoals: form.longTermGoals.length > 0 ? form.longTermGoals : undefined,
        referralSource: form.referralSource || undefined,
        referralSourceDetail: form.referralSourceDetail || undefined,
        referredBy: form.referredBy || undefined,
        notes: form.notes || undefined,
        intakeCompletedAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", "/api/intake/participants", profilePayload);
      const participant = await res.json();

      for (const ct of CONSENT_TYPES) {
        if (form.consents[ct.type]) {
          await apiRequest("POST", "/api/intake/consent", {
            participantId: participant.id,
            consentType: ct.type,
            consentDescription: ct.description,
            acknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            digitalSignature: form.digitalSignature,
          });
        }
      }
      return participant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake/participants"] });
      toast({ title: "Intake Complete", description: "Welcome! Your information has been securely saved." });
      setStep(STEPS.length - 1);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const canProceed = () => {
    switch (STEPS[step].key) {
      case "personal": return !!form.firstName && !!form.lastName;
      case "consent": return Object.values(form.consents).some(v => v) && !!form.digitalSignature;
      default: return true;
    }
  };

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-intake-title">Intake Assessment</h1>
          <TrainingGuideButton moduleId="intake-wizard" />
        </div>
        <p className="text-muted-foreground mt-1">Let's get to know you so we can connect you with the right support.</p>
      </div>

      <div className="space-y-2" data-testid="progress-bar">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}: {STEPS[step].label}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-1 overflow-x-auto py-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
                }`}
                disabled={i > step}
                data-testid={`step-${s.key}`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-6">
        {STEPS[step].key === "welcome" && (
          <div className="space-y-4 text-center" data-testid="step-welcome-content">
            <ClipboardList className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Welcome to Your Intake Assessment</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              This form helps us understand your situation and goals so we can connect you with the services and support you need.
              Everything you share is confidential and will only be used to help you succeed.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left max-w-md mx-auto space-y-2">
              <p className="font-medium">What to expect:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>About 10-15 minutes to complete</li>
                <li>You can skip questions you're not comfortable answering</li>
                <li>Your answers are saved securely</li>
                <li>A case manager will review your intake and reach out</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "Every journey begins with a single step. We're here to walk with you."
            </p>
          </div>
        )}

        {STEPS[step].key === "personal" && (
          <div className="space-y-4" data-testid="step-personal-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> Tell Us About Yourself</h2>
            <p className="text-sm text-muted-foreground">This information helps us serve you better. Required fields are marked with *.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input value={form.firstName} onChange={e => update("firstName", e.target.value)} data-testid="input-first-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input value={form.lastName} onChange={e => update("lastName", e.target.value)} data-testid="input-last-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Preferred Name</label>
                <Input value={form.preferredName} onChange={e => update("preferredName", e.target.value)} placeholder="What would you like us to call you?" data-testid="input-preferred-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} data-testid="input-dob" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => update("gender", e.target.value)} data-testid="select-gender">
                <option value="">Select...</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {form.gender === "Other" && (
                <Input className="mt-2" value={form.genderOther} onChange={e => update("genderOther", e.target.value)} placeholder="Please specify" data-testid="input-gender-other" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Race/Ethnicity (select all that apply)</label>
              <CheckboxGroup options={RACE_OPTIONS} selected={form.raceEthnicity} onChange={v => update("raceEthnicity", v)} testIdPrefix="checkbox-race" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 p-3 rounded border cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={form.veteranStatus} onChange={e => update("veteranStatus", e.target.checked)} data-testid="checkbox-veteran" />
                <span className="text-sm">U.S. Military Veteran</span>
              </label>
              <div>
                <label className="text-sm font-medium">Disability Status</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.disabilityStatus} onChange={e => update("disabilityStatus", e.target.value)} data-testid="select-disability">
                  <option value="">Select...</option>
                  {DISABILITY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Primary Language</label>
                <Input value={form.primaryLanguage} onChange={e => update("primaryLanguage", e.target.value)} data-testid="input-language" />
              </div>
              <label className="flex items-center gap-2 p-3 rounded border cursor-pointer hover:bg-muted/50 self-end">
                <input type="checkbox" checked={form.needsInterpreter} onChange={e => update("needsInterpreter", e.target.checked)} data-testid="checkbox-interpreter" />
                <span className="text-sm">Needs interpreter services</span>
              </label>
            </div>
          </div>
        )}

        {STEPS[step].key === "contact" && (
          <div className="space-y-4" data-testid="step-contact-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5" /> Contact & Housing</h2>
            <p className="text-sm text-muted-foreground">How can we reach you, and where are you staying?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" data-testid="input-phone" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" data-testid="input-email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Street address" data-testid="input-address" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">City</label>
                <Input value={form.city} onChange={e => update("city", e.target.value)} data-testid="input-city" />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input value={form.state} onChange={e => update("state", e.target.value)} maxLength={2} data-testid="input-state" />
              </div>
              <div>
                <label className="text-sm font-medium">ZIP</label>
                <Input value={form.zipCode} onChange={e => update("zipCode", e.target.value)} data-testid="input-zip" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Current Housing Situation</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.housingStatus} onChange={e => update("housingStatus", e.target.value)} data-testid="select-housing">
                <option value="">Select...</option>
                {HOUSING_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {(form.housingStatus === "Homeless" || form.housingStatus === "Shelter" || form.housingStatus === "Other") && (
              <div>
                <label className="text-sm font-medium">Housing Details</label>
                <Textarea value={form.housingDetails} onChange={e => update("housingDetails", e.target.value)} placeholder="Tell us more about your housing situation so we can help..." rows={2} data-testid="input-housing-details" />
              </div>
            )}
          </div>
        )}

        {STEPS[step].key === "background" && (
          <div className="space-y-4" data-testid="step-background-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5" /> Education & Employment</h2>
            <p className="text-sm text-muted-foreground">Understanding your background helps us match you with the right opportunities.</p>
            <div>
              <label className="text-sm font-medium">Highest Education Level</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.educationLevel} onChange={e => update("educationLevel", e.target.value)} data-testid="select-education">
                <option value="">Select...</option>
                {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Education Details</label>
              <Textarea value={form.educationDetails} onChange={e => update("educationDetails", e.target.value)} placeholder="Any certifications, training, or courses you've completed..." rows={2} data-testid="input-education-details" />
            </div>
            <div>
              <label className="text-sm font-medium">Current Employment Status</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.employmentStatus} onChange={e => update("employmentStatus", e.target.value)} data-testid="select-employment">
                <option value="">Select...</option>
                {EMPLOYMENT_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Employment History</label>
              <Textarea value={form.employmentHistory} onChange={e => update("employmentHistory", e.target.value)} placeholder="Recent jobs, skills, or work experience..." rows={2} data-testid="input-employment-history" />
            </div>
          </div>
        )}

        {STEPS[step].key === "justice" && (
          <div className="space-y-4" data-testid="step-justice-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Scale className="h-5 w-5" /> Justice Involvement</h2>
            <p className="text-sm text-muted-foreground">This information is kept confidential and helps us provide appropriate support. You are not defined by your past.</p>
            <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={form.justiceInvolved} onChange={e => update("justiceInvolved", e.target.checked)} data-testid="checkbox-justice-involved" />
              <div>
                <span className="text-sm font-medium">I have been involved with the justice system</span>
                <p className="text-xs text-muted-foreground">Including juvenile justice, adult criminal justice, or civil matters</p>
              </div>
            </label>
            {form.justiceInvolved && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                <div>
                  <label className="text-sm font-medium">Type of Involvement</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.justiceDetails.offenseType || ""} onChange={e => update("justiceDetails", { ...form.justiceDetails, offenseType: e.target.value })} data-testid="select-offense-type">
                    <option value="">Select...</option>
                    <option value="juvenile">Juvenile justice</option>
                    <option value="misdemeanor">Misdemeanor</option>
                    <option value="felony">Felony</option>
                    <option value="civil">Civil matter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Length of Incarceration</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.justiceDetails.incarcerationLength || ""} onChange={e => update("justiceDetails", { ...form.justiceDetails, incarcerationLength: e.target.value })} data-testid="select-incarceration-length">
                    <option value="">Select...</option>
                    <option value="none">No incarceration</option>
                    <option value="under_6mo">Under 6 months</option>
                    <option value="6mo_1yr">6 months - 1 year</option>
                    <option value="1_3yr">1 - 3 years</option>
                    <option value="3_5yr">3 - 5 years</option>
                    <option value="5_10yr">5 - 10 years</option>
                    <option value="over_10yr">Over 10 years</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Release Date (if applicable)</label>
                  <Input type="date" value={form.releaseDate} onChange={e => update("releaseDate", e.target.value)} data-testid="input-release-date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Current Supervision Status</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.supervisionStatus} onChange={e => update("supervisionStatus", e.target.value)} data-testid="select-supervision">
                    <option value="">Select...</option>
                    <option value="none">No supervision</option>
                    <option value="probation">Probation</option>
                    <option value="parole">Parole</option>
                    <option value="community_supervision">Community supervision</option>
                    <option value="electronic_monitoring">Electronic monitoring</option>
                    <option value="pre_trial">Pre-trial supervision</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {STEPS[step].key === "health" && (
          <div className="space-y-4" data-testid="step-health-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Heart className="h-5 w-5" /> Health & Wellbeing</h2>
            <p className="text-sm text-muted-foreground">Your health matters. This helps us connect you with the right care. All information is confidential.</p>
            <div>
              <label className="text-sm font-medium">Health Needs (select all that apply)</label>
              <CheckboxGroup options={HEALTH_NEEDS_OPTIONS} selected={form.healthNeeds} onChange={v => update("healthNeeds", v)} testIdPrefix="checkbox-health" />
            </div>
            <div>
              <label className="text-sm font-medium">Mental Health</label>
              <Textarea value={form.mentalHealthNeeds} onChange={e => update("mentalHealthNeeds", e.target.value)} placeholder="Any mental health concerns, past diagnoses, or current treatment..." rows={2} data-testid="input-mental-health" />
            </div>
            <div>
              <label className="text-sm font-medium">Substance Use History</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.substanceUseHistory} onChange={e => update("substanceUseHistory", e.target.value)} data-testid="select-substance">
                <option value="">Select...</option>
                <option value="none">No history</option>
                <option value="past">Past use, currently in recovery</option>
                <option value="current_treatment">Currently in treatment</option>
                <option value="seeking_treatment">Seeking treatment</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {STEPS[step].key === "family" && (
          <div className="space-y-4" data-testid="step-family-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Family & Support</h2>
            <p className="text-sm text-muted-foreground">Understanding your support system helps us serve your whole family.</p>
            <div>
              <label className="text-sm font-medium">Family Situation</label>
              <Textarea value={form.familySituation} onChange={e => update("familySituation", e.target.value)} placeholder="Marital status, family relationships, children, living situation..." rows={3} data-testid="input-family-situation" />
            </div>
            <div>
              <label className="text-sm font-medium">Number of Dependents</label>
              <Input type="number" min={0} value={form.dependents} onChange={e => update("dependents", parseInt(e.target.value) || 0)} data-testid="input-dependents" />
            </div>
          </div>
        )}

        {STEPS[step].key === "goals" && (
          <div className="space-y-4" data-testid="step-goals-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5" /> Goals & Immediate Needs</h2>
            <p className="text-sm text-muted-foreground">What do you need right now, and where do you want to be? Your goals guide our work together.</p>
            <div>
              <label className="text-sm font-medium">Immediate Needs (select all that apply)</label>
              <CheckboxGroup options={SERVICE_NEEDS} selected={form.immediateNeeds} onChange={v => update("immediateNeeds", v)} testIdPrefix="checkbox-needs" />
            </div>
            <div>
              <label className="text-sm font-medium">Short-Term Goals (next 3-6 months)</label>
              <GoalInput goals={form.shortTermGoals} onChange={v => update("shortTermGoals", v)} placeholder="e.g., Get my GED, Find stable housing..." testId="short-term-goals" />
            </div>
            <div>
              <label className="text-sm font-medium">Long-Term Goals (1+ years)</label>
              <GoalInput goals={form.longTermGoals} onChange={v => update("longTermGoals", v)} placeholder="e.g., Start my own business, Complete college..." testId="long-term-goals" />
            </div>
          </div>
        )}

        {STEPS[step].key === "referral" && (
          <div className="space-y-4" data-testid="step-referral-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5" /> Referral Information</h2>
            <p className="text-sm text-muted-foreground">How did you hear about us?</p>
            <div>
              <label className="text-sm font-medium">Referral Source</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.referralSource} onChange={e => update("referralSource", e.target.value)} data-testid="select-referral-source">
                <option value="">Select...</option>
                {REFERRAL_SOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.referralSource && form.referralSource !== "Self-referral" && (
              <>
                <div>
                  <label className="text-sm font-medium">Referring Organization/Person</label>
                  <Input value={form.referredBy} onChange={e => update("referredBy", e.target.value)} placeholder="Name of person or organization" data-testid="input-referred-by" />
                </div>
                <div>
                  <label className="text-sm font-medium">Additional Referral Details</label>
                  <Textarea value={form.referralSourceDetail} onChange={e => update("referralSourceDetail", e.target.value)} placeholder="Case number, court order details, or other referral information..." rows={2} data-testid="input-referral-detail" />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Anything else you'd like us to know..." rows={3} data-testid="input-additional-notes" />
            </div>
          </div>
        )}

        {STEPS[step].key === "consent" && (
          <div className="space-y-4" data-testid="step-consent-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><FileCheck className="h-5 w-5" /> Consent & Acknowledgment</h2>
            <p className="text-sm text-muted-foreground">Please review and acknowledge the following consents. Your participation is always voluntary.</p>
            {CONSENT_TYPES.map(ct => (
              <div key={ct.type} className="border rounded-lg p-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!form.consents[ct.type]}
                    onChange={e => update("consents", { ...form.consents, [ct.type]: e.target.checked })}
                    data-testid={`checkbox-consent-${ct.type}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{ct.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ct.description}</p>
                  </div>
                </label>
              </div>
            ))}
            <div className="border-t pt-4">
              <label className="text-sm font-medium">Digital Signature (Type your full name) *</label>
              <Input
                value={form.digitalSignature}
                onChange={e => update("digitalSignature", e.target.value)}
                placeholder="Type your full legal name"
                className="font-serif italic text-lg"
                data-testid="input-digital-signature"
              />
              <p className="text-xs text-muted-foreground mt-1">By typing your name, you acknowledge that you have read and agree to the consents checked above.</p>
            </div>
          </div>
        )}

        {STEPS[step].key === "review" && (
          <div className="space-y-4" data-testid="step-review-content">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Review Your Information</h2>
            <p className="text-sm text-muted-foreground">Please review your information before submitting.</p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">NAME</p>
                <p className="font-medium" data-testid="review-name">{form.firstName} {form.lastName}{form.preferredName ? ` (${form.preferredName})` : ""}</p>
              </div>
              {form.phone && <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs font-medium text-muted-foreground mb-1">CONTACT</p><p className="text-sm">{form.phone}{form.email ? ` | ${form.email}` : ""}</p></div>}
              {form.housingStatus && <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs font-medium text-muted-foreground mb-1">HOUSING</p><p className="text-sm">{form.housingStatus}</p></div>}
              {form.educationLevel && <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs font-medium text-muted-foreground mb-1">EDUCATION</p><p className="text-sm">{form.educationLevel}</p></div>}
              {form.employmentStatus && <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs font-medium text-muted-foreground mb-1">EMPLOYMENT</p><p className="text-sm">{form.employmentStatus}</p></div>}
              {form.referralSource && <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs font-medium text-muted-foreground mb-1">REFERRAL</p><p className="text-sm">{form.referralSource}{form.referredBy ? ` - ${form.referredBy}` : ""}</p></div>}
              {form.immediateNeeds.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">IMMEDIATE NEEDS</p>
                  <div className="flex flex-wrap gap-1">{form.immediateNeeds.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}</div>
                </div>
              )}
              {form.shortTermGoals.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">SHORT-TERM GOALS</p>
                  <ul className="list-disc list-inside text-sm">{form.shortTermGoals.map((g, i) => <li key={i}>{g}</li>)}</ul>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">CONSENTS</p>
                <p className="text-sm">{Object.entries(form.consents).filter(([, v]) => v).length} of {CONSENT_TYPES.length} acknowledged</p>
                <p className="text-sm">Signed: <span className="font-serif italic">{form.digitalSignature}</span></p>
              </div>
            </div>

            {submitMutation.isSuccess ? (
              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg" data-testid="submission-success">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600 mb-3" />
                <h3 className="text-lg font-semibold">Intake Complete!</h3>
                <p className="text-muted-foreground mt-2">A case manager will review your information and reach out to you soon. Welcome to the program.</p>
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                data-testid="button-submit-intake"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Intake"}
              </Button>
            )}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="button-prev-step"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            disabled={!canProceed()}
            data-testid="button-next-step"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
