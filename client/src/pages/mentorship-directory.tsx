import { useState, useMemo } from "react";
import { MapPin, Users, Heart, Briefcase, Shield, Scale, Brain, Paintbrush, Rocket, Search, Phone, Globe, Star, ChevronDown, ChevronUp, Loader2, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { mentorshipPrograms, type MentorshipProgram, type ProgramCategory } from "@/data/mentorship-programs";

const categoryConfig: Record<ProgramCategory, { label: string; color: string; icon: React.ReactNode }> = {
  youth: { label: "Youth Mentoring", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <Users className="w-5 h-5" /> },
  men: { label: "Men & Boys", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: <Shield className="w-5 h-5" /> },
  women: { label: "Women & Girls", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", icon: <Heart className="w-5 h-5" /> },
  stem: { label: "STEM & Technology", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", icon: <Brain className="w-5 h-5" /> },
  veteran: { label: "Veterans", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <Shield className="w-5 h-5" /> },
  reentry: { label: "Reentry & Justice", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: <Scale className="w-5 h-5" /> },
  business: { label: "Business & Entrepreneurship", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: <Briefcase className="w-5 h-5" /> },
  health: { label: "Health & Wellness", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200", icon: <Heart className="w-5 h-5" /> },
  fatherhood: { label: "Fatherhood", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200", icon: <Users className="w-5 h-5" /> },
  disability: { label: "Disability Services", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", icon: <Heart className="w-5 h-5" /> },
  arts: { label: "Arts & Creative", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: <Paintbrush className="w-5 h-5" /> },
  faith: { label: "Faith-Based", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: <Star className="w-5 h-5" /> },
};

const austinZipCodes = [...new Set(mentorshipPrograms.flatMap(p => p.zipCodes))].sort();

const austinMetroZips = new Set([
  "78660", "78664", "78665", "78681", "78717", "78728", "78729", "78750", "78753", "78758",
  "78759", "78613", "78626", "78628", "78633", "78634", "78641", "78642", "78645", "78646",
  "78652", "78653", "78654", "78669", "78610", "78612", "78615", "78616", "78617", "78619",
  "78621", "78640", "78644", "78648", "78656", "78659", "78662", "78666", "78667", "78676",
  "78680", "78682", "78683", "78691",
  ...austinZipCodes,
]);

function isAustinMetro(zip: string): boolean {
  return austinMetroZips.has(zip);
}

export default function MentorshipDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedZip, setSelectedZip] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [zipSearch, setZipSearch] = useState("");
  const [aiResults, setAiResults] = useState<MentorshipProgram[]>([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchedZip, setAiSearchedZip] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "austin">("search");
  const { toast } = useToast();

  const handleNationwideSearch = async () => {
    if (!zipSearch || !/^\d{5}$/.test(zipSearch)) {
      toast({ title: "Enter a valid 5-digit zip code", variant: "destructive" });
      return;
    }
    setAiSearching(true);
    setAiResults([]);
    setAiSearchedZip(zipSearch);
    setActiveTab("search");
    try {
      const res = await apiRequest("POST", "/api/mentorship/search", {
        zipCode: zipSearch,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        query: searchQuery || undefined,
      });
      const data = await res.json();
      if (data.programs && Array.isArray(data.programs)) {
        const aiPrograms = data.programs as MentorshipProgram[];

        if (isAustinMetro(zipSearch)) {
          const aiNames = new Set(aiPrograms.map((p: MentorshipProgram) => p.name.toLowerCase()));
          const curatedToMerge = mentorshipPrograms.filter(
            (cp) => !aiNames.has(cp.name.toLowerCase())
          ).map(cp => ({ ...cp, ecosystemConnection: (cp.ecosystemConnection || "") + " [Curated Austin Program]" }));
          setAiResults([...curatedToMerge, ...aiPrograms]);
        } else {
          setAiResults(aiPrograms);
        }

        if (aiPrograms.length === 0 && !isAustinMetro(zipSearch)) {
          toast({ title: "No programs found for this area. Try a nearby zip code." });
        }
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setAiSearching(false);
    }
  };

  const displayPrograms = activeTab === "austin" ? mentorshipPrograms : aiResults;

  const filteredPrograms = useMemo(() => {
    return displayPrograms.filter(program => {
      const matchesSearch = searchQuery === "" ||
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.programs.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || program.categories.includes(selectedCategory as ProgramCategory);
      const matchesZip = activeTab === "search" || selectedZip === "all" || program.zipCodes.includes(selectedZip);
      return matchesSearch && matchesCategory && matchesZip;
    });
  }, [searchQuery, selectedCategory, selectedZip, displayPrograms, activeTab]);

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = activeTab === "austin" ? mentorshipPrograms : aiResults;
    for (const cat of Object.keys(categoryConfig)) {
      counts[cat] = source.filter(p => p.categories.includes(cat as ProgramCategory)).length;
    }
    return counts;
  }, [activeTab, aiResults]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Nationwide Mentorship Directory
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto" data-testid="text-page-subtitle">
            Find real mentorship programs anywhere in the United States. Enter your zip code and we'll search for programs near you.
            These are not our programs — these are community partners we connect you to.
          </p>
        </div>

        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI-Powered Mentorship Search</h3>
              <Badge variant="secondary" className="text-[10px]">Powered by Perplexity</Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Enter any US zip code (e.g. 90210, 10001, 78702)"
                  value={zipSearch}
                  onChange={(e) => setZipSearch(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="pl-10 text-lg h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleNationwideSearch()}
                  data-testid="input-zip-search"
                />
              </div>
              <Button
                onClick={handleNationwideSearch}
                disabled={aiSearching || zipSearch.length !== 5}
                className="h-12 px-8 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                data-testid="button-search-nationwide"
              >
                {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {aiSearching ? "Searching..." : "Find Programs"}
              </Button>
            </div>
            {aiSearchedZip && !aiSearching && aiResults.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {aiResults.length} mentorship programs near <strong>{aiSearchedZip}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            onClick={() => setActiveTab("search")}
            className="gap-2"
            data-testid="tab-search-results"
          >
            <Sparkles className="w-4 h-4" />
            Search Results
            {aiResults.length > 0 && <Badge variant="secondary" className="ml-1">{aiResults.length}</Badge>}
          </Button>
          <Button
            variant={activeTab === "austin" ? "default" : "outline"}
            onClick={() => setActiveTab("austin")}
            className="gap-2"
            data-testid="tab-austin-curated"
          >
            <Zap className="w-4 h-4" />
            Austin Curated ({mentorshipPrograms.length})
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === key
                  ? "ring-2 ring-primary shadow-md scale-105 " + config.color
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
              data-testid={`filter-category-${key}`}
            >
              {config.icon}
              <span className="truncate">{config.label}</span>
              {categoryCounts[key] > 0 && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{categoryCounts[key]}</Badge>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Filter by name, skill, population..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          {activeTab === "austin" && (
            <Select value={selectedZip} onValueChange={setSelectedZip}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-zip-code">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <SelectValue placeholder="All Zip Codes" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zip Codes</SelectItem>
                {austinZipCodes.map(zip => (
                  <SelectItem key={zip} value={zip}>{zip}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(selectedCategory !== "all" || selectedZip !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => { setSelectedCategory("all"); setSelectedZip("all"); setSearchQuery(""); }}
              className="text-sm"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground" data-testid="text-result-count">
            {activeTab === "search" && !aiSearchedZip
              ? "Enter a zip code above to search for mentorship programs nationwide"
              : `Showing ${filteredPrograms.length} programs${activeTab === "search" && aiSearchedZip ? ` near ${aiSearchedZip}` : " (Austin curated)"}`
            }
          </p>
          {selectedZip !== "all" && activeTab === "austin" && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" /> {selectedZip}
            </Badge>
          )}
        </div>

        {aiSearching && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Searching for mentorship programs near {zipSearch}...</h3>
            <p className="text-muted-foreground">Powered by Perplexity AI — finding real, verified programs in your area.</p>
          </div>
        )}

        {activeTab === "search" && !aiSearchedZip && !aiSearching && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Any Zip Code in the U.S.</h3>
            <p className="text-muted-foreground mb-4">Enter a zip code above to discover mentorship programs near that location.</p>
            <p className="text-sm text-muted-foreground">Or switch to the <strong>Austin Curated</strong> tab to browse our {mentorshipPrograms.length} hand-verified Austin programs.</p>
          </div>
        )}

        <div className="grid gap-4">
          {!aiSearching && (activeTab === "austin" || (activeTab === "search" && aiSearchedZip)) && filteredPrograms.map((program) => {
            const isExpanded = expandedCards.has(program.id);
            const primaryCat = categoryConfig[program.category];
            return (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-program-${program.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={primaryCat.color + " text-xs"}>
                          {primaryCat.label}
                        </Badge>
                        {program.categories.filter(c => c !== program.category).map(cat => (
                          <Badge key={cat} variant="outline" className="text-[10px]">
                            {categoryConfig[cat].label}
                          </Badge>
                        ))}
                        {program.cost === "Free" && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]">Free</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight" data-testid={`text-program-name-${program.id}`}>
                        {program.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{program.organization}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {program.url && (
                        <a href={program.url} target="_blank" rel="noopener noreferrer" data-testid={`link-website-${program.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Website
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-foreground/80 mb-3" data-testid={`text-description-${program.id}`}>{program.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {program.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">{badge}</Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                    {program.agesServed && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {program.agesServed}
                      </span>
                    )}
                    {program.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {program.phone}
                      </span>
                    )}
                    {program.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {program.address}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {program.zipCodes.slice(0, isExpanded ? undefined : 5).map(zip => (
                      <Badge
                        key={zip}
                        variant="outline"
                        className={`text-[10px] cursor-pointer hover:bg-primary/10 ${selectedZip === zip ? "border-primary bg-primary/10" : ""}`}
                        onClick={() => {
                          if (activeTab === "austin") setSelectedZip(selectedZip === zip ? "all" : zip);
                        }}
                        data-testid={`badge-zip-${program.id}-${zip}`}
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" /> {zip}
                      </Badge>
                    ))}
                    {!isExpanded && program.zipCodes.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{program.zipCodes.length - 5} more</Badge>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1.5">Programs & Services</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {program.programs.map((p, i) => (
                            <Badge key={i} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[11px]">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      {program.impact && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Impact</h4>
                          <p className="text-sm text-muted-foreground">{program.impact}</p>
                        </div>
                      )}
                      {program.ecosystemConnection && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">ThriveUp Ecosystem Connection</h4>
                          <p className="text-sm text-muted-foreground italic">{program.ecosystemConnection}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(program.id)}
                    className="mt-2 text-xs gap-1"
                    data-testid={`button-expand-${program.id}`}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? "Show Less" : "Show Programs & Impact"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!aiSearching && activeTab === "search" && aiSearchedZip && filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs found near {aiSearchedZip}</h3>
            <p className="text-muted-foreground">Try a nearby zip code or adjust your category filter.</p>
          </div>
        )}
        {activeTab === "austin" && filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Austin programs match your filter</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}

        <Card className="mt-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2" data-testid="text-ecosystem-note-title">How ThriveUp Connects You</h3>
            <p className="text-sm text-muted-foreground mb-3">
              ThriveUp does not run these mentorship programs. We are the connective tissue — our 15-service-platform ecosystem routes you to the right program based on your zip code, needs, and goals. When you engage with any of our platforms (LifeBridge, Whole-Person Health, ISSS, TheHealthyBlkMan, etc.), we identify mentorship needs and connect you directly to these community partners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Rocket className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span><strong>Youth & Education:</strong> ISSS routes students to school-based mentors, after-school programs, and college readiness partners.</span>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                <span><strong>Workforce & Reentry:</strong> TWC grant pipeline connects to SCORE, Goodwill, T.O.R.I., and Travis County programs.</span>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                <span><strong>Health & Family:</strong> Health Network platforms route to MHEC, Black Mamas ATX, SAFE Fatherhood, and doula services.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Austin curated data compiled from public sources. AI search results powered by Perplexity. Programs, availability, and eligibility may change.</p>
          <p className="mt-1">Know a mentorship program we should feature? Contact us through the Collaboration Hub.</p>
        </div>
      </div>
    </div>
  );
}
