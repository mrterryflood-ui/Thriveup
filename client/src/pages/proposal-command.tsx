import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Zap, FileText, Target, DollarSign, Shield,
  Download, Copy, RefreshCw, CheckCircle2, AlertTriangle,
  Loader2, BarChart3, Clock, Send, Building2, User,
  ChevronRight, Briefcase
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

interface DocumentIntel {
  solicitationType?: string;
  estimatedBudgetRange?: { low: number; high: number };
  deadlines?: Array<{ item: string; date: string }>;
  requiredDocuments?: string[];
  evaluationCriteria?: Array<{ criterion: string; weight: string; description?: string }>;
  insuranceRequirements?: Array<{ type: string; amount?: string; minimumCoverage?: string }>;
  certificationPreferences?: string[];
  scope?: string;
  scopeDetails?: string[];
  pageLimits?: Array<{ section: string; maxPages: string }>;
  contactInfo?: { name?: string; email?: string; phone?: string; address?: string };
  contractPeriod?: { start?: string; end?: string; duration?: string; renewals?: string };
  budgetScale?: string;
  responseSize?: string;
  complexity?: string;
  keyFacts?: string[];
  confidenceLevel?: string;
  error?: string;
}

interface CompanyProfile {
  companyName: string;
  companyType: string;
  ein: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  capabilities: string;
  certifications: string;
  pastPerformance: string;
  keyPersonnel: string;
  yearsInBusiness: string;
  uei: string;
}

const EMPTY_PROFILE: CompanyProfile = {
  companyName: "", companyType: "", ein: "", address: "",
  contactName: "", phone: "", email: "", capabilities: "",
  certifications: "", pastPerformance: "", keyPersonnel: "",
  yearsInBusiness: "", uei: "",
};

const STORAGE_KEY = "proposal-command-profile";

function loadSavedProfile(): CompanyProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...EMPTY_PROFILE, ...JSON.parse(saved) };
  } catch {}
  return { ...EMPTY_PROFILE };
}

export default function ProposalCommandPage() {
  const { toast } = useToast();

  const [solicitation, setSolicitation] = useState("");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(loadSavedProfile);
  const [additionalContext, setAdditionalContext] = useState("");
  const [proposalType, setProposalType] = useState("auto");

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [intelData, setIntelData] = useState<DocumentIntel | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [generationComplete, setGenerationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("solicitation");

  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [unknownAnswers, setUnknownAnswers] = useState<Record<string, string>>({});

  const proposalRef = useRef<HTMLDivElement>(null);

  const unknowns: string[] = [];
  const unknownRegex = /\{\{NEEDS_INPUT:\s*([^}]+)\}\}/g;
  let m;
  const searchText = proposalText;
  while ((m = unknownRegex.exec(searchText)) !== null) {
    const val = m[1].trim();
    if (!unknowns.includes(val)) unknowns.push(val);
  }

  useEffect(() => {
    if (proposalRef.current && isGenerating) {
      proposalRef.current.scrollTop = proposalRef.current.scrollHeight;
    }
  }, [proposalText, isGenerating]);

  const updateProfile = (field: keyof CompanyProfile, value: string) => {
    setCompanyProfile(prev => {
      const updated = { ...prev, [field]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const generate = async () => {
    if (solicitation.length < 50) {
      toast({ title: "Paste the full solicitation", description: "We need at least the scope of work.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setStatusMessages([]);
    setIntelData(null);
    setProposalText("");
    setGenerationComplete(false);
    setActiveTab("progress");

    try {
      const body: Record<string, unknown> = {
        solicitation,
        additionalContext,
        proposalType,
      };

      const hasAnyProfileData = Object.values(companyProfile).some(v => v.trim().length > 0);
      if (hasAnyProfileData) {
        body.companyProfile = companyProfile;
      }

      const resp = await fetch("/api/proposal-command/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "status") {
              setStatusMessages(prev => [...prev, evt.message]);
            } else if (evt.type === "data" && evt.section === "intel") {
              const { type: _t, section: _s, ...rest } = evt;
              setIntelData(rest as DocumentIntel);
            } else if (evt.type === "chunk") {
              setProposalText(prev => prev + evt.content);
              if (activeTab !== "proposal") setActiveTab("proposal");
            } else if (evt.type === "done") {
              setGenerationComplete(true);
            } else if (evt.type === "error") {
              toast({ title: "Generation Error", description: evt.message, variant: "destructive" });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to generate proposal", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const refine = async () => {
    if (!refineFeedback && Object.keys(unknownAnswers).length === 0) {
      toast({ title: "Provide feedback or fill in unknowns", variant: "destructive" });
      return;
    }

    const currentProposal = proposalText;
    setIsRefining(true);
    setProposalText("");
    setActiveTab("proposal");

    try {
      const resp = await fetch("/api/proposal-command/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: currentProposal, feedback: refineFeedback, unknownAnswers }),
      });

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "chunk") setProposalText(prev => prev + evt.content);
            else if (evt.type === "error") {
              toast({ title: "Refinement Error", description: evt.message, variant: "destructive" });
            } else if (evt.type === "done") {
              setRefineFeedback("");
              setUnknownAnswers({});
              toast({ title: "Proposal refined successfully" });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: "Refinement failed", description: e.message, variant: "destructive" });
      setProposalText(currentProposal);
    } finally {
      setIsRefining(false);
    }
  };

  const downloadProposal = () => {
    const blob = new Blob([proposalText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${companyProfile.companyName || "draft"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyProposal = () => {
    navigator.clipboard.writeText(proposalText);
    toast({ title: "Copied to clipboard" });
  };

  const profileFilled = companyProfile.companyName.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Proposal Command Center</h1>
            <p className="text-sm text-muted-foreground">Paste any solicitation. Get a complete, submission-ready proposal.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: FileText, label: "Paste & Generate", color: "amber", testId: "text-feature-paste" },
            { icon: BarChart3, label: "Past Winner Intel", color: "blue", testId: "text-feature-intel" },
            { icon: DollarSign, label: "Pricing Strategy", color: "green", testId: "text-feature-pricing" },
            { icon: Shield, label: "Compliance Matrix", color: "violet", testId: "text-feature-compliance" },
          ].map(f => (
            <Card key={f.label} className={`border-${f.color}-200 dark:border-${f.color}-800`}>
              <CardContent className="p-3 text-center">
                <f.icon className={`h-5 w-5 mx-auto mb-1 text-${f.color}-500`} />
                <div className="text-xs font-medium" data-testid={f.testId}>{f.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="solicitation" data-testid="tab-solicitation">
              <FileText className="h-4 w-4 mr-1.5 hidden sm:block" /> Solicitation
            </TabsTrigger>
            <TabsTrigger value="company" data-testid="tab-company">
              <Building2 className="h-4 w-4 mr-1.5 hidden sm:block" /> Your Company
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress" disabled={statusMessages.length === 0}>
              <Clock className="h-4 w-4 mr-1.5 hidden sm:block" /> Intel
            </TabsTrigger>
            <TabsTrigger value="proposal" data-testid="tab-proposal" disabled={!proposalText}>
              <Target className="h-4 w-4 mr-1.5 hidden sm:block" /> Proposal
            </TabsTrigger>
            <TabsTrigger value="refine" data-testid="tab-refine" disabled={!generationComplete}>
              <RefreshCw className="h-4 w-4 mr-1.5 hidden sm:block" /> Refine
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solicitation" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Paste the Solicitation
                </CardTitle>
                <CardDescription>
                  RFP, RFQ, grant announcement, LOI call, contract opportunity — paste the full document.
                  The AI extracts every requirement, deadline, and evaluation criterion automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Solicitation Text</Label>
                  <Textarea
                    value={solicitation}
                    onChange={e => setSolicitation(e.target.value)}
                    placeholder="Paste the complete RFP, RFQ, grant announcement, or solicitation here. Include scope of work, evaluation criteria, insurance requirements, deadlines — everything you have..."
                    className="min-h-[220px] font-mono text-sm"
                    data-testid="input-solicitation"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {solicitation.length.toLocaleString()} characters
                    {solicitation.length > 0 && solicitation.length < 50 && " — need at least 50"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proposal Type</Label>
                    <Select value={proposalType} onValueChange={setProposalType}>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-Detect from Text</SelectItem>
                        <SelectItem value="rfp">RFP Response</SelectItem>
                        <SelectItem value="rfq">RFQ / Quick Quote</SelectItem>
                        <SelectItem value="grant">Grant Application</SelectItem>
                        <SelectItem value="loi">Letter of Intent / LOI</SelectItem>
                        <SelectItem value="capability">Capability Statement</SelectItem>
                        <SelectItem value="partnership">Partnership Proposal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Instructions (Optional)</Label>
                    <Textarea
                      value={additionalContext}
                      onChange={e => setAdditionalContext(e.target.value)}
                      placeholder="Pricing guidance, teaming partners, specific points to emphasize, tone preferences..."
                      className="min-h-[38px] text-sm"
                      data-testid="input-context"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    onClick={generate}
                    disabled={isGenerating || solicitation.length < 50}
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                    ) : (
                      <><Zap className="mr-2 h-5 w-5" /> Generate Proposal {profileFilled ? `for ${companyProfile.companyName}` : "(Template)"}</>
                    )}
                  </Button>
                  {!profileFilled && (
                    <Button variant="outline" size="lg" onClick={() => setActiveTab("company")} data-testid="button-add-company">
                      <Building2 className="mr-2 h-4 w-4" /> Add Your Company First
                    </Button>
                  )}
                </div>

                {!profileFilled && (
                  <p className="text-xs text-muted-foreground text-center">
                    No company profile? No problem — we generate a professional template you fill in after.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Your Company Profile
                </CardTitle>
                <CardDescription>
                  Tell us about your organization. This information gets woven into the proposal automatically.
                  Saved locally — fill it once, use it for every proposal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company / Organization Name</Label>
                    <Input value={companyProfile.companyName} onChange={e => updateProfile("companyName", e.target.value)} placeholder="Your business name" data-testid="input-company-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select value={companyProfile.companyType} onValueChange={v => updateProfile("companyType", v)}>
                      <SelectTrigger data-testid="select-company-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="nonprofit-501c3">501(c)(3) Nonprofit</SelectItem>
                        <SelectItem value="nonprofit-other">Other Nonprofit</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="s-corp">S-Corp</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>EIN / Tax ID</Label>
                    <Input value={companyProfile.ein} onChange={e => updateProfile("ein", e.target.value)} placeholder="XX-XXXXXXX" data-testid="input-ein" />
                  </div>
                  <div className="space-y-2">
                    <Label>UEI Number (Federal contracts)</Label>
                    <Input value={companyProfile.uei} onChange={e => updateProfile("uei", e.target.value)} placeholder="Your SAM.gov UEI" data-testid="input-uei" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Business Address</Label>
                    <Input value={companyProfile.address} onChange={e => updateProfile("address", e.target.value)} placeholder="Full address" data-testid="input-address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Contact Name & Title</Label>
                    <Input value={companyProfile.contactName} onChange={e => updateProfile("contactName", e.target.value)} placeholder="Jane Smith, CEO" data-testid="input-contact" />
                  </div>
                  <div className="space-y-2">
                    <Label>Years in Business</Label>
                    <Input value={companyProfile.yearsInBusiness} onChange={e => updateProfile("yearsInBusiness", e.target.value)} placeholder="e.g. 12" data-testid="input-years" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={companyProfile.phone} onChange={e => updateProfile("phone", e.target.value)} placeholder="(512) 555-0100" data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={companyProfile.email} onChange={e => updateProfile("email", e.target.value)} placeholder="contact@company.com" data-testid="input-email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Capabilities & Services</Label>
                  <Textarea value={companyProfile.capabilities} onChange={e => updateProfile("capabilities", e.target.value)} placeholder="What does your company do? Core services, specializations, industries served..." className="min-h-[80px]" data-testid="input-capabilities" />
                </div>

                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <Textarea value={companyProfile.certifications} onChange={e => updateProfile("certifications", e.target.value)} placeholder="8(a), HUBZone, SDVOSB, MBE, WBE, DBE, ISO, CMMI, etc." className="min-h-[60px]" data-testid="input-certifications" />
                </div>

                <div className="space-y-2">
                  <Label>Past Performance (2-3 relevant contracts or projects)</Label>
                  <Textarea value={companyProfile.pastPerformance} onChange={e => updateProfile("pastPerformance", e.target.value)} placeholder="Contract name, client, value, dates, and outcomes achieved..." className="min-h-[80px]" data-testid="input-past-performance" />
                </div>

                <div className="space-y-2">
                  <Label>Key Personnel</Label>
                  <Textarea value={companyProfile.keyPersonnel} onChange={e => updateProfile("keyPersonnel", e.target.value)} placeholder="Name, title, qualifications, years experience for key team members..." className="min-h-[80px]" data-testid="input-key-personnel" />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => setActiveTab("solicitation")}
                    data-testid="button-back-to-solicitation"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" /> Profile Saved — Go to Solicitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setCompanyProfile({ ...EMPTY_PROFILE }); localStorage.removeItem(STORAGE_KEY); toast({ title: "Profile cleared" }); }}
                    data-testid="button-clear-profile"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statusMessages.map((msg, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-status-${i}`}>
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{msg}</span>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Working...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {intelData && !intelData.error && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" /> Document Reading
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {intelData.solicitationType && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" data-testid="badge-sol-type">
                            {intelData.solicitationType}
                          </Badge>
                        )}
                        {intelData.budgetScale && (
                          <Badge variant="outline" data-testid="badge-scale">
                            {(intelData.budgetScale as string).replace(/_/g, " ")}
                          </Badge>
                        )}
                        {intelData.complexity && (
                          <Badge variant="outline" data-testid="badge-complexity">
                            {intelData.complexity} complexity
                          </Badge>
                        )}
                        {intelData.responseSize && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="badge-response-size">
                            Response: {intelData.responseSize}
                          </Badge>
                        )}
                      </div>
                      {intelData.scope && (
                        <div className="text-sm p-2 bg-muted/50 rounded" data-testid="text-scope">
                          <span className="font-medium">Scope: </span>{intelData.scope}
                        </div>
                      )}
                      {intelData.estimatedBudgetRange && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg" data-testid="text-budget-range">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">Budget (from document)</div>
                          <div className="text-xl font-bold text-green-600">
                            ${intelData.estimatedBudgetRange.low?.toLocaleString()} — ${intelData.estimatedBudgetRange.high?.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {intelData.contactInfo && (intelData.contactInfo.name || intelData.contactInfo.email) && (
                        <div className="text-sm">
                          <div className="text-xs font-medium text-muted-foreground mb-1">SUBMIT TO</div>
                          <div>{intelData.contactInfo.name}</div>
                          {intelData.contactInfo.email && <div className="text-muted-foreground">{intelData.contactInfo.email}</div>}
                          {intelData.contactInfo.phone && <div className="text-muted-foreground">{intelData.contactInfo.phone}</div>}
                        </div>
                      )}
                      {intelData.contractPeriod && (intelData.contractPeriod.duration || intelData.contractPeriod.start) && (
                        <div className="text-sm">
                          <div className="text-xs font-medium text-muted-foreground mb-1">CONTRACT PERIOD</div>
                          <div>{intelData.contractPeriod.duration || `${intelData.contractPeriod.start} to ${intelData.contractPeriod.end}`}</div>
                          {intelData.contractPeriod.renewals && <div className="text-muted-foreground text-xs">{intelData.contractPeriod.renewals}</div>}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-orange-500" /> Evaluation & Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {intelData.evaluationCriteria && intelData.evaluationCriteria.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">EVALUATION CRITERIA (from document)</div>
                          {intelData.evaluationCriteria.map((c, i) => (
                            <div key={i} className="flex justify-between text-sm border-b border-muted py-1">
                              <span>{c.criterion}</span>
                              <span className="text-muted-foreground font-medium">{c.weight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {intelData.deadlines && intelData.deadlines.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">DEADLINES (from document)</div>
                          {intelData.deadlines.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm py-0.5">
                              <span>{d.item}</span>
                              <Badge variant="outline" className="text-xs">{d.date}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      {intelData.scopeDetails && intelData.scopeDetails.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">SCOPE ITEMS (from document)</div>
                          {intelData.scopeDetails.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm py-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-500" /> Required Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {intelData.requiredDocuments && intelData.requiredDocuments.length > 0 && (
                        <div>
                          {intelData.requiredDocuments.map((doc, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm py-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {intelData.pageLimits && intelData.pageLimits.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1 mt-2">PAGE LIMITS</div>
                          {intelData.pageLimits.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm py-0.5">
                              <span>{p.section}</span>
                              <Badge variant="secondary" className="text-xs">{p.maxPages} pages</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      {intelData.certificationPreferences && intelData.certificationPreferences.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1 mt-2">PREFERRED CERTIFICATIONS</div>
                          <div className="flex flex-wrap gap-1">
                            {intelData.certificationPreferences.map((cert, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {intelData.insuranceRequirements && intelData.insuranceRequirements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-violet-500" /> Insurance & Compliance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {intelData.insuranceRequirements.map((ins, i) => (
                          <div key={i} className="flex justify-between text-sm border-b border-muted py-1.5">
                            <span>{ins.type}</span>
                            <Badge variant="secondary" className="text-xs">{ins.amount || ins.minimumCoverage}</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {intelData.keyFacts && intelData.keyFacts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" /> Key Facts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {intelData.keyFacts.map((fact, i) => (
                          <div key={i} className="text-sm py-0.5">{fact}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="proposal" className="space-y-4 mt-4">
            {generationComplete && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium" data-testid="text-generation-complete">
                    Proposal generated{companyProfile.companyName ? ` for ${companyProfile.companyName}` : " — fill in company details on Refine tab"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyProposal} data-testid="button-copy">
                    <Copy className="h-4 w-4 mr-1.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadProposal} data-testid="button-download">
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                </div>
              </div>
            )}

            {unknowns.length > 0 && (
              <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium" data-testid="text-unknowns-count">{unknowns.length} item{unknowns.length > 1 ? "s" : ""} need your input</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unknowns.map((u, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-amber-400" data-testid={`badge-unknown-${i}`}>{u}</Badge>
                    ))}
                  </div>
                  <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-amber-600" onClick={() => setActiveTab("refine")}>
                    Go to Refine tab to fill these in <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div
                  ref={proposalRef}
                  className="p-6 max-h-[70vh] overflow-y-auto prose prose-sm dark:prose-invert max-w-none font-mono text-sm whitespace-pre-wrap"
                  data-testid="text-proposal-output"
                >
                  {proposalText || (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refine" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  Refine Your Proposal
                </CardTitle>
                <CardDescription>
                  Fill in any unknowns, adjust pricing, change tone, add details.
                  The AI rewrites the entire document with your changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {unknowns.length > 0 && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Fill In the Unknowns ({unknowns.length})
                    </Label>
                    {unknowns.map((u, i) => (
                      <div key={i} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{u}</Label>
                        <Input
                          value={unknownAnswers[u] || ""}
                          onChange={e => setUnknownAnswers(prev => ({ ...prev, [u]: e.target.value }))}
                          placeholder={`Enter: ${u}`}
                          data-testid={`input-unknown-${i}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Additional Changes or Feedback</Label>
                  <Textarea
                    value={refineFeedback}
                    onChange={e => setRefineFeedback(e.target.value)}
                    placeholder="Examples: 'Increase pricing by 15%', 'Add more emphasis on our veteran credentials', 'Change timeline to 90 days', 'Make the tone more formal', 'Add a section about our safety record'..."
                    className="min-h-[100px]"
                    data-testid="input-refine-feedback"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={refine}
                  disabled={isRefining}
                  data-testid="button-refine"
                >
                  {isRefining ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Update Proposal</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">How it works — One and Done</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-amber-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold shrink-0">1</span>
                    Paste any solicitation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold shrink-0">2</span>
                    AI analyzes + prices
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold shrink-0">3</span>
                    Complete proposal ready
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-violet-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold shrink-0">4</span>
                    Fill unknowns + submit
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <BackToTop />
    </div>
  );
}
