import { useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, ExternalLink, Search, MapPin, Phone, Globe, Heart,
  Scale, Users, Building2, BookOpen, Briefcase, GraduationCap,
  Church, HandHeart, Baby, Flag, AlertTriangle, Stethoscope,
  Home, ChevronDown, ChevronUp, ArrowRight, Star, Filter,
  Megaphone, Gavel, Award, Landmark, Layers, Loader2,
  MessageCircle, Send, Navigation, X, FileCheck, DollarSign,
  Handshake, ClipboardList, Store, MapPinned
} from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/data/resource-directory";

const CATEGORY_FILTER_ALL = "all";

const US_STATES_LIST = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","DC"
];

export default function CommunityResourceDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_FILTER_ALL);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["civil-rights", "ecosystem"]));
  const [selectedState, setSelectedState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [showAI, setShowAI] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const aiQuery = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ecosystem-ai/query", { query: question });
      return res.json();
    },
    onSuccess: (data: { answer: string }) => {
      setAiAnswer(data.answer);
    },
  });

  const handleAiSubmit = () => {
    if (!aiQuestion.trim()) return;
    let q = aiQuestion;
    if (zipCode) q += ` (near zip code ${zipCode})`;
    if (selectedState) q += ` (in ${selectedState})`;
    aiQuery.mutate(q);
  };

  const toggleOrg = (key: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    let cats = RESOURCE_CATEGORIES;
    if (selectedCategory !== CATEGORY_FILTER_ALL) {
      cats = cats.filter(c => c.id === selectedCategory);
    }
    if (selectedState) {
      cats = cats.map(cat => ({
        ...cat,
        organizations: cat.organizations.filter(org => {
          if (org.national && org.stateCount && org.stateCount >= 36) return true;
          if (org.national && org.chapterFinder) return true;
          if (!org.national && org.description.toLowerCase().includes(selectedState.toLowerCase())) return true;
          if (!org.national && selectedState === "Texas" && org.description.toLowerCase().includes("austin")) return true;
          return org.national;
        }),
      })).filter(cat => cat.organizations.length > 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.map(cat => ({
        ...cat,
        organizations: cat.organizations.filter(org =>
          org.name.toLowerCase().includes(q) ||
          org.description.toLowerCase().includes(q) ||
          org.focus.some(f => f.toLowerCase().includes(q))
        ),
      })).filter(cat => cat.organizations.length > 0);
    }
    return cats;
  }, [searchQuery, selectedCategory, selectedState]);

  const totalOrgs = RESOURCE_CATEGORIES.reduce((sum, c) => sum + c.organizations.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-r from-slate-900 via-amber-900/30 to-slate-900 border-b border-slate-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-600/20 rounded-xl border border-amber-500/30">
              <HandHeart className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="page-title">
                National Advocacy & Resource Directory
              </h1>
              <p className="text-sm text-amber-300">
                Every organization, every resource, every link — for every community that needs it
              </p>
            </div>
          </div>

          <Card className="p-4 bg-slate-800/60 border-amber-700/30 mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Great products do nothing if people can't use them. This directory puts{" "}
              <strong className="text-amber-300">{totalOrgs} organizations</strong> across{" "}
              <strong className="text-amber-300">{RESOURCE_CATEGORIES.length} categories</strong> at your fingertips — civil rights organizations like the ACLU and NAACP, chambers of commerce,
              faith-based organizations, veteran services, legal aid, and the full ThriveUp ACOS ecosystem. Every entry has a real website link, phone number where available,
              and chapter/location finders so you can connect with help in your community today.
            </p>
          </Card>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> All 50 States + DC</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalOrgs} Organizations</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {RESOURCE_CATEGORIES.length} Categories</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> The Collaborative Advocate Foundation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Card className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Ask the AI Assistant</h3>
            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">Natural Language</Badge>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Ask anything: "Find NAACP chapters in Texas" or "What legal aid is near 78660" or "Where can veterans get mental health help" — the AI knows every organization in this directory and the full ThriveUp ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <Input
                ref={aiInputRef}
                placeholder="Ask a question in plain English..."
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAiSubmit()}
                className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-ai-question"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Zip code"
                value={zipCode}
                onChange={e => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="w-24 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 text-xs"
                data-testid="input-zip"
              />
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="bg-slate-800/60 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5 min-w-[100px]"
                data-testid="select-state"
              >
                <option value="">All States</option>
                {US_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button size="sm" onClick={handleAiSubmit} disabled={aiQuery.isPending || !aiQuestion.trim()} data-testid="button-ai-ask">
                {aiQuery.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {(selectedState || zipCode) && (
            <div className="flex items-center gap-2 mt-2">
              <Navigation className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">
                Location filter active: {selectedState && `${selectedState}`}{selectedState && zipCode && ", "}{zipCode && `ZIP ${zipCode}`}
              </span>
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1 text-slate-400" onClick={() => { setSelectedState(""); setZipCode(""); }} data-testid="button-clear-location">
                <X className="w-3 h-3" /> Clear
              </Button>
            </div>
          )}
          {aiAnswer && (
            <Card className="mt-3 p-4 bg-slate-800/80 border-blue-700/30">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-400 mb-1">AI Response</p>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed" data-testid="text-ai-answer">{aiAnswer}</div>
                </div>
              </div>
            </Card>
          )}
          {aiQuery.isError && (
            <p className="text-xs text-red-400 mt-2">Could not get an AI response. Try a simpler question or check your connection.</p>
          )}
        </Card>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search organizations, services, or topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="input-search"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === CATEGORY_FILTER_ALL ? "default" : "outline"}
              onClick={() => setSelectedCategory(CATEGORY_FILTER_ALL)}
              className="text-xs"
              data-testid="filter-all"
            >
              <Filter className="w-3 h-3 mr-1" /> All
            </Button>
            {RESOURCE_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="text-xs"
                data-testid={`filter-${cat.id}`}
              >
                <cat.icon className="w-3 h-3 mr-1" /> {cat.label.split("&")[0].trim()}
              </Button>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 && (
          <Card className="p-8 bg-slate-800/60 border-slate-700 text-center">
            <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No organizations found matching "{searchQuery}"</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => { setSearchQuery(""); setSelectedCategory(CATEGORY_FILTER_ALL); }} data-testid="button-clear-search">
              Clear Search
            </Button>
          </Card>
        )}

        <div className="space-y-6">
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full p-5 rounded-lg border ${cat.borderColor} ${cat.bgColor} flex items-center justify-between text-left hover:opacity-90 transition-all`}
                data-testid={`category-${cat.id}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-slate-800/50 rounded-lg">
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {cat.label}
                      <Badge variant="outline" className="text-xs">{cat.organizations.length} orgs</Badge>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
                  </div>
                </div>
                {expandedCategories.has(cat.id) ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
              </button>

              {expandedCategories.has(cat.id) && (
                <div className="mt-3 space-y-3 pl-2">
                  <p className="text-sm text-slate-400 px-2">{cat.description}</p>
                  {cat.organizations.map((org, i) => {
                    const key = `${cat.id}-${i}`;
                    const isExpanded = expandedOrgs.has(key);
                    const isEcosystem = cat.id === "ecosystem";
                    return (
                      <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`org-${cat.id}-${i}`}>
                        <button
                          onClick={() => toggleOrg(key)}
                          className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-700/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white">{org.name}</h3>
                              {org.national && <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">National</Badge>}
                              {org.stateCount && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">{org.stateCount} states</Badge>}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{org.description}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                            <p className="text-xs text-slate-300 leading-relaxed">{org.description}</p>

                            <div className="flex flex-wrap gap-1">
                              {org.focus.map((f, j) => (
                                <Badge key={j} className="text-xs bg-slate-700/50 text-slate-300">{f}</Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {org.website && (isEcosystem ? (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <Link href={org.website}>
                                    <ArrowRight className="w-3 h-3 mr-1" /> Go to Platform
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={org.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-3 h-3 mr-1" /> Visit Website
                                  </a>
                                </Button>
                              ))}
                              {org.chapterFinder && (
                                <Button size="sm" variant={selectedState ? "default" : "outline"} className={`text-xs ${selectedState ? "bg-green-600 hover:bg-green-700" : ""}`} asChild>
                                  <a href={org.chapterFinder} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="w-3 h-3 mr-1" /> {selectedState ? `Find in ${selectedState}` : "Find Local Chapter"}
                                  </a>
                                </Button>
                              )}
                              {org.phone && (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={`tel:${org.phone.replace(/[^0-9+]/g, "")}`}>
                                    <Phone className="w-3 h-3 mr-1" /> {org.phone}
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-br from-cyan-900/20 to-slate-800/60 border-cyan-700/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-600/20 rounded-lg shrink-0">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Connected to the ThriveUp ACOS Ecosystem</h3>
              <p className="text-sm text-slate-300 mb-3">
                Every resource on this page connects back to the 15-service-platform ACOS ecosystem. When someone finds the NAACP, they can also find a mentor through M2C. When they find legal aid, they can find housing through LifeBridge. When they find a church, they can find education through ThriveUp Academy. No dead ends. Just doors.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/ecosystem"><Layers className="w-3 h-3 mr-1" /> Ecosystem Connector</Link>
                </Button>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/ecosystem"><ArrowRight className="w-3 h-3 mr-1" /> Ecosystem Hub</Link>
                </Button>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/justice-command-center"><Shield className="w-3 h-3 mr-1" /> Justice Command Center</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500 pb-8">
          <p>The Collaborative Advocate Foundation (501(c)(3)) | EIN: 41-3618003 | Dr. Terry Flood, Founder</p>
          <p className="mt-1">Veteran-founded. Black-led. Community-driven. 17912 Stefano Drive, Pflugerville, TX 78660</p>
        </div>
      </div>
    </div>
  );
}
