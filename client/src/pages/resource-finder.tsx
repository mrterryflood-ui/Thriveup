import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, MapPin, Briefcase, GraduationCap, Home, Heart, Scale, Users,
  DollarSign, Laptop, Bus, Apple, ChevronRight, ChevronLeft, ExternalLink,
  BookmarkPlus, Bookmark, Phone, Sparkles, ArrowRight, Globe, Shield,
  Star, Filter, X, RefreshCw, MessageCircle, Loader2, CheckCircle2,
} from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { TrainingGuideButton } from "@/components/training-guide";
import type { SavedResource } from "@shared/schema";

interface StateOption {
  code: string;
  name: string;
}

interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
}

interface ResourceResult {
  state: string;
  stateCode: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  url: string;
  phone?: string;
  address?: string;
  eligibility?: string;
  ageRange?: string;
  tags: string[];
}

const CATEGORY_ICONS: Record<string, any> = {
  workforce: Briefcase, education: GraduationCap, housing: Home,
  food: Apple, healthcare: Heart, legal: Scale, youth: Users,
  financial: DollarSign, technology: Laptop, transportation: Bus,
};

const CATEGORY_COLORS: Record<string, string> = {
  workforce: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  education: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  housing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  food: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  legal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  youth: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  financial: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  technology: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  transportation: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

export default function ResourceFinderPage() {
  useEffect(() => { document.title = "Resource Finder | ThriveUp Academy"; }, []);

  const { toast } = useToast();
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [aiSituation, setAiSituation] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiResponseRef = useRef<HTMLDivElement>(null);

  const { data: states, isLoading: statesLoading, error: statesError, refetch: refetchStates } = useQuery<StateOption[]>({
    queryKey: ["/api/resources/states"],
  });

  const { data: categories, isLoading: catsLoading } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/resources/categories"],
  });

  const searchParams = new URLSearchParams();
  if (selectedState) searchParams.set("state", selectedState);
  if (selectedCategories.length) searchParams.set("categories", selectedCategories.join(","));
  if (searchQuery) searchParams.set("q", searchQuery);
  if (ageFilter) searchParams.set("age", ageFilter);

  const { data: results, isLoading: resultsLoading, refetch: refetchResults } = useQuery<ResourceResult[]>({
    queryKey: ["/api/resources/search", selectedState, selectedCategories.join(","), searchQuery, ageFilter],
    queryFn: async () => {
      const res = await fetch(`/api/resources/search?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: showResults,
  });

  const { data: savedResources } = useQuery<SavedResource[]>({
    queryKey: ["/api/resources/saved"],
  });

  const saveMutation = useMutation({
    mutationFn: (resource: ResourceResult) =>
      apiRequest("POST", "/api/resources/save", {
        resourceName: resource.name,
        resourceUrl: resource.url,
        category: resource.category,
        subcategory: resource.subcategory,
        stateCode: resource.stateCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/saved"] });
      toast({ title: "Resource saved", description: "You can find it in your Saved Resources tab." });
    },
  });

  const removeSavedMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/resources/saved/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/saved"] });
      toast({ title: "Resource removed" });
    },
  });

  const isResourceSaved = (url: string) =>
    savedResources?.some(s => s.resourceUrl === url) || false;

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSearch = () => {
    setShowResults(true);
    setWizardStep(4);
    refetchResults();
  };

  const handleAIGuide = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/resources/ai-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: selectedState,
          categories: selectedCategories,
          age: ageFilter,
          situation: aiSituation,
        }),
      });

      if (!response.ok) throw new Error("AI guide failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullText += parsed.content;
                  setAiResponse(fullText);
                }
              } catch {
                fullText += data;
                setAiResponse(fullText);
              }
            }
          }
        }
      }
    } catch (error) {
      toast({ title: "AI Guide unavailable", description: "Please try again or browse resources manually.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const groupedResults = results?.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, ResourceResult[]>);

  const totalResults = results?.length || 0;
  const stateResults = results?.filter(r => r.stateCode !== "US").length || 0;
  const federalResults = results?.filter(r => r.stateCode === "US").length || 0;

  if (statesLoading || catsLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="resource-finder-loading">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (statesError) {
    return <div className="p-6"><ErrorRetry message="Failed to load resource finder data." onRetry={refetchStates} /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6" data-testid="resource-finder-page">
      <PageHeader
        title="Community Resource Finder"
        description="Find real government and community resources across all 50 states, DC, and U.S. territories"
        breadcrumbs={[{label:"Resource Finder"}]}
        actions={<TrainingGuideButton moduleId="resource-finder" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="resource-tabs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="h-4 w-4 mr-2" />
            Find Resources
          </TabsTrigger>
          <TabsTrigger value="ai-guide" data-testid="tab-ai-guide">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Resource Guide
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved ({savedResources?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-4">
          {!showResults ? (
            <WizardSteps
              step={wizardStep}
              setStep={setWizardStep}
              states={states || []}
              categories={categories || []}
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              ageFilter={ageFilter}
              setAgeFilter={setAgeFilter}
              onSearch={handleSearch}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => { setShowResults(false); setWizardStep(1); }} data-testid="button-new-search">
                  <ChevronLeft className="h-4 w-4 mr-1" /> New Search
                </Button>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedState && (
                    <Badge variant="secondary" data-testid="badge-state-filter">
                      <MapPin className="h-3 w-3 mr-1" />
                      {states?.find(s => s.code === selectedState)?.name || selectedState}
                    </Badge>
                  )}
                  {selectedCategories.map(cat => (
                    <Badge key={cat} variant="secondary" className={CATEGORY_COLORS[cat]} data-testid={`badge-category-filter-${cat}`}>
                      {categories?.find(c => c.id === cat)?.name || cat}
                      <button onClick={() => toggleCategory(cat)} className="ml-1" data-testid={`button-remove-category-${cat}`} aria-label={`Remove ${cat} filter`}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {searchQuery && (
                    <Badge variant="secondary" data-testid="badge-query-filter">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery("")} className="ml-1" data-testid="button-clear-query" aria-label="Clear search query"><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Input
                    placeholder="Filter results..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-48"
                    data-testid="input-filter-results"
                  />
                  <Button variant="outline" size="icon" onClick={() => refetchResults()} data-testid="button-refresh" aria-label="Refresh results">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-total-results">{totalResults}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Resources</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300" data-testid="text-state-results">{stateResults}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">State Programs</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-federal-results">{federalResults}</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Federal Programs</p>
                  </CardContent>
                </Card>
              </div>

              {resultsLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : groupedResults && Object.keys(groupedResults).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedResults).map(([catId, catResults]) => {
                    const catInfo = categories?.find(c => c.id === catId);
                    const IconComponent = CATEGORY_ICONS[catId] || Globe;
                    return (
                      <div key={catId} className="space-y-3" data-testid={`section-category-${catId}`}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{catInfo?.name || catId}</h3>
                          <Badge variant="outline">{catResults.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {catResults.map((resource, idx) => (
                            <ResourceCard
                              key={`${resource.url}-${idx}`}
                              resource={resource}
                              isSaved={isResourceSaved(resource.url)}
                              onSave={() => saveMutation.mutate(resource)}
                              onRemove={() => {
                                const saved = savedResources?.find(s => s.resourceUrl === resource.url);
                                if (saved) removeSavedMutation.mutate(saved.id);
                              }}
                              saving={saveMutation.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                  <p className="text-muted-foreground mb-4">Try broadening your search by selecting more categories or removing filters.</p>
                  <Button onClick={() => { setShowResults(false); setWizardStep(1); }} data-testid="button-try-again">
                    Start New Search
                  </Button>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-guide" className="space-y-6 mt-4">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>AI Resource Guide</CardTitle>
                  <CardDescription>Get personalized guidance on finding the right resources for your situation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your State</label>
                  <Select value={selectedState} onValueChange={setSelectedState} data-testid="select-ai-state">
                    <SelectTrigger data-testid="trigger-ai-state">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Age (optional)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 17"
                    value={ageFilter}
                    onChange={e => setAgeFilter(e.target.value)}
                    min={10}
                    max={30}
                    data-testid="input-ai-age"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">What kind of help are you looking for?</label>
                <div className="flex flex-wrap gap-2">
                  {categories?.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    const IconComponent = CATEGORY_ICONS[cat.id] || Globe;
                    return (
                      <Button
                        key={cat.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(cat.id)}
                        data-testid={`button-ai-category-${cat.id}`}
                      >
                        <IconComponent className="h-3 w-3 mr-1" />
                        {cat.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tell us about your situation (optional - helps us give better guidance)</label>
                <Textarea
                  placeholder="Example: I'm 16 and looking for a summer job program. My family could also use help with food and housing..."
                  value={aiSituation}
                  onChange={e => setAiSituation(e.target.value)}
                  rows={3}
                  data-testid="textarea-ai-situation"
                />
              </div>

              <Button
                onClick={handleAIGuide}
                disabled={aiLoading || (!selectedState && selectedCategories.length === 0)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                data-testid="button-ai-guide"
              >
                {aiLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating your personalized guide...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Get AI Resource Guide</>
                )}
              </Button>

              {aiResponse && (
                <div ref={aiResponseRef} className="mt-4 p-4 rounded-lg bg-muted/50 border" data-testid="ai-response-container">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">AI Resource Guide</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" data-testid="text-ai-response">
                    {aiResponse}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-4">
          {savedResources && savedResources.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg" data-testid="text-saved-title">
                Your Saved Resources ({savedResources.length})
              </h3>
              {savedResources.map(resource => (
                <Card key={resource.id} className="p-4" data-testid={`card-saved-${resource.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{resource.resourceName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={CATEGORY_COLORS[resource.category] || ""}>
                          {resource.category}
                        </Badge>
                        {resource.stateCode && (
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {resource.stateCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild data-testid={`button-visit-saved-${resource.id}`}>
                        <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> Visit
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSavedMutation.mutate(resource.id)}
                        data-testid={`button-remove-saved-${resource.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved resources yet</h3>
              <p className="text-muted-foreground mb-4">Search for resources and save the ones that matter to you.</p>
              <Button onClick={() => setActiveTab("search")} data-testid="button-start-searching">
                <Search className="h-4 w-4 mr-2" /> Start Searching
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WizardSteps({
  step, setStep, states, categories, selectedState, setSelectedState,
  selectedCategories, toggleCategory, searchQuery, setSearchQuery,
  ageFilter, setAgeFilter, onSearch,
}: {
  step: number;
  setStep: (s: number) => void;
  states: StateOption[];
  categories: ResourceCategory[];
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  ageFilter: string;
  setAgeFilter: (a: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6" data-testid="wizard-progress">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step ? "bg-primary text-primary-foreground scale-110" :
                s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}
              data-testid={`button-step-${s}`}
            >
              {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
            </button>
            {s < 3 && <div className={`w-16 md:w-24 h-1 rounded ${s < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-2" data-testid="wizard-step-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Step 1: Select Your Location
            </CardTitle>
            <CardDescription>Choose your state to find local government and community resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedState} onValueChange={setSelectedState} data-testid="select-state">
              <SelectTrigger className="w-full text-base py-6" data-testid="trigger-select-state">
                <SelectValue placeholder="Choose your state or territory..." />
              </SelectTrigger>
              <SelectContent>
                {states.map(s => (
                  <SelectItem key={s.code} value={s.code} data-testid={`option-state-${s.code}`}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mt-4">
              {states.map(s => (
                <Button
                  key={s.code}
                  variant={selectedState === s.code ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedState(s.code)}
                  data-testid={`button-state-${s.code}`}
                >
                  {s.code}
                </Button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setStep(2)} disabled={!selectedState} size="lg" data-testid="button-next-step-1">
                Next: Choose Categories <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-2" data-testid="wizard-step-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Step 2: What Do You Need Help With?
            </CardTitle>
            <CardDescription>Select one or more categories to find relevant resources (or skip to see all)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                const IconComponent = CATEGORY_ICONS[cat.id] || Globe;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{cat.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cat.subcategories.slice(0, 3).map(sub => (
                          <Badge key={sub} variant="outline" className="text-[10px] px-1 py-0">{sub}</Badge>
                        ))}
                        {cat.subcategories.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">+{cat.subcategories.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} size="lg" data-testid="button-next-step-2">
                Next: Refine Search <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-2" data-testid="wizard-step-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Step 3: Refine Your Search
            </CardTitle>
            <CardDescription>Add keywords or filters to narrow your results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Keywords (optional)</label>
                <Input
                  placeholder="e.g., summer job, scholarship, GED..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  data-testid="input-search-query"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Age (optional)</label>
                <Input
                  type="number"
                  placeholder="e.g., 17"
                  value={ageFilter}
                  onChange={e => setAgeFilter(e.target.value)}
                  min={10}
                  max={30}
                  data-testid="input-age-filter"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Your Search Summary:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {states.find(s => s.code === selectedState)?.name || "All States"}
                </Badge>
                {selectedCategories.length > 0 ? (
                  selectedCategories.map(cat => (
                    <Badge key={cat} className={CATEGORY_COLORS[cat]}>
                      {categories.find(c => c.id === cat)?.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">All Categories</Badge>
                )}
                {searchQuery && <Badge variant="secondary">"{searchQuery}"</Badge>}
                {ageFilter && <Badge variant="secondary">Age: {ageFilter}</Badge>}
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step-3">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={onSearch} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600" data-testid="button-search">
                <Search className="h-4 w-4 mr-2" /> Find Resources <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResourceCard({
  resource, isSaved, onSave, onRemove, saving,
}: {
  resource: ResourceResult;
  isSaved: boolean;
  onSave: () => void;
  onRemove: () => void;
  saving: boolean;
}) {
  const IconComponent = CATEGORY_ICONS[resource.category] || Globe;
  const colorClass = CATEGORY_COLORS[resource.category] || "";

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-resource-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${colorClass}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{resource.name}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px]">{resource.subcategory}</Badge>
                {resource.stateCode === "US" ? (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Federal
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    <MapPin className="h-2.5 w-2.5 mr-0.5" /> {resource.state}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={isSaved ? onRemove : onSave}
            disabled={saving}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            aria-label={isSaved ? "Remove from saved" : "Save resource"}
            data-testid={`button-save-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {isSaved ? (
              <Bookmark className="h-4 w-4 text-primary fill-primary" />
            ) : (
              <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3">{resource.description}</p>

        {(resource.eligibility || resource.ageRange) && (
          <div className="flex flex-wrap gap-1.5">
            {resource.eligibility && (
              <Badge variant="outline" className="text-[10px]">
                <Star className="h-2.5 w-2.5 mr-0.5" /> {resource.eligibility}
              </Badge>
            )}
            {resource.ageRange && resource.ageRange !== "All ages" && (
              <Badge variant="outline" className="text-[10px]">Ages {resource.ageRange}</Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button variant="default" size="sm" className="flex-1" asChild data-testid={`button-visit-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Visit Website
            </a>
          </Button>
          {resource.phone && (
            <Button variant="outline" size="sm" asChild data-testid={`button-call-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}>
              <a href={`tel:${resource.phone}`}>
                <Phone className="h-3 w-3 mr-1" /> {resource.phone}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
