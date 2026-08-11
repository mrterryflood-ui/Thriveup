import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ChevronLeft, Phone, Globe, MapPin, Clock, Users, AlertTriangle, Search, ExternalLink, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

function QuickExit() {
  return (
    <button onClick={() => window.location.replace("https://www.weather.com")}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5"
      data-testid="button-quick-exit">
      <AlertTriangle className="h-3.5 w-3.5" />Quick Exit
    </button>
  );
}

const ALWAYS_ON = [
  { name: "SAFE Alliance — Emergency Shelter", phone: "512-267-7233", url: "https://safeaustin.org", detail: "Austin's primary DV/SA shelter — call 24/7 for availability and intake", county: "Travis", available: true },
  { name: "LifeWorks Austin", phone: "512-735-2400", url: "https://lifeworksaustin.org", detail: "Youth and family transitional housing — Austin", county: "Travis", available: true },
  { name: "Salvation Army Austin", phone: "512-476-1111", url: "https://salvationarmyaustin.org/texas-austin/", detail: "Emergency shelter and transitional housing for families", county: "Travis", available: true },
  { name: "Front Steps Austin", phone: "512-305-4100", url: "https://frontsteps.org", detail: "Emergency shelter and housing navigation for individuals experiencing homelessness", county: "Travis", available: true },
];

interface Listing {
  id: string; partnerOrgName: string; name: string; address: string; county: string;
  type: string; beds: number; childrenAllowed: boolean; maxChildAge: number | null;
  petsAllowed: boolean; wheelchairAccessible: boolean; deafAccessible: boolean;
  languages: string[]; maxMonths: number; onSiteServices: string[];
  available: boolean; availableDate: string | null; phone: string; applyUrl: string | null; notes: string;
}

export default function HousingFinderPage() {
  const [county, setCounty] = useState("");
  const [children, setChildren] = useState(false);
  const [pets, setPets] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [months, setMonths] = useState<string>("any");
  const [searched, setSearched] = useState(false);

  const params = new URLSearchParams();
  if (county) params.set("county", county);
  if (children) params.set("children", "true");
  if (pets) params.set("pets", "true");
  if (accessible) params.set("accessible", "true");
  if (months && months !== "any") params.set("maxMonths", months);

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/safe-passage/listings", county, children, pets, accessible, months],
    queryFn: () => fetch(`/api/safe-passage/listings?${params}`).then(r => r.json()),
    enabled: searched,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-950 dark:to-blue-950/10">
      <QuickExit />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Find Transitional Housing</h1>
            <p className="text-xs text-slate-500">Search available units — filter by what matters to you</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-5">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">County or city</Label>
                <Input placeholder="e.g. Travis, Austin, Williamson" value={county} onChange={e => setCounty(e.target.value)}
                  className="text-sm" data-testid="input-county" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum length of stay needed</Label>
                <Select value={months} onValueChange={setMonths}>
                  <SelectTrigger className="text-sm" data-testid="select-months">
                    <SelectValue placeholder="Any length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any length</SelectItem>
                    <SelectItem value="6">At least 6 months</SelectItem>
                    <SelectItem value="12">At least 12 months</SelectItem>
                    <SelectItem value="18">At least 18 months</SelectItem>
                    <SelectItem value="24">24 months (maximum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Children allowed", state: children, set: setChildren, id: "children" }, { label: "Pets allowed", state: pets, set: setPets, id: "pets" }, { label: "Wheelchair accessible", state: accessible, set: setAccessible, id: "accessible" }].map(f => (
                <div key={f.id} className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <Label htmlFor={f.id} className="text-xs cursor-pointer">{f.label}</Label>
                  <Switch id={f.id} checked={f.state} onCheckedChange={f.set} data-testid={`switch-${f.id}`} />
                </div>
              ))}
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSearched(true)} data-testid="button-search">
              <Search className="h-4 w-4 mr-2" /> Search Available Units
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="mb-5">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Searching...</div>
            ) : listings.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">{listings.length} unit{listings.length !== 1 ? "s" : ""} found</p>
                {listings.map(l => (
                  <Card key={l.id} className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{l.name}</p>
                          <p className="text-xs text-slate-500">{l.partnerOrgName}</p>
                        </div>
                        <Badge className={l.available ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}>
                          {l.available ? "Available" : "Waitlist"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{l.county} county</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />Up to {l.maxMonths} months</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="h-3 w-3" />{l.beds} bed{l.beds !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-slate-500">{l.type}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {l.childrenAllowed && <Badge variant="outline" className="text-[10px]">Children welcome</Badge>}
                        {l.petsAllowed && <Badge variant="outline" className="text-[10px]">Pets OK</Badge>}
                        {l.wheelchairAccessible && <Badge variant="outline" className="text-[10px]">Wheelchair accessible</Badge>}
                        {l.deafAccessible && <Badge variant="outline" className="text-[10px]">Deaf accessible</Badge>}
                        {l.languages?.map(lang => <Badge key={lang} variant="outline" className="text-[10px]">{lang}</Badge>)}
                      </div>
                      {l.notes && <p className="text-xs text-slate-500 mb-3 italic">{l.notes}</p>}
                      <div className="flex gap-2">
                        <a href={`tel:${l.phone.replace(/[^0-9]/g,"")}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                          <Phone className="h-3 w-3" /> Call to apply
                        </a>
                        {l.applyUrl && <a href={l.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                          <Globe className="h-3 w-3" /> Apply online
                        </a>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-5 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-3 text-amber-400 opacity-60" />
                  <p className="font-medium text-slate-700 dark:text-slate-300 text-sm mb-1">No partner listings match your filters right now</p>
                  <p className="text-xs text-slate-500 mb-4">Call the organizations below directly — they often have availability that isn't listed online.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Always-on resources */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Always call these first:</h2>
          </div>
          <div className="space-y-2">
            {ALWAYS_ON.map(org => (
              <div key={org.name} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{org.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{org.detail}</p>
                    <div className="flex gap-2">
                      <a href={`tel:${org.phone.replace(/[^0-9]/g,"")}`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <Phone className="h-3 w-3" />{org.phone}
                      </a>
                      <a href={org.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <ExternalLink className="h-3 w-3" />Website
                      </a>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">24/7</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">You are a partner organization with housing units to list?</p>
          <Link href="/safe-passage/partner-portal"><span className="text-xs text-blue-600 dark:text-blue-400 underline cursor-pointer">Submit your listings in the Partner Portal →</span></Link>
        </div>
      </div>
    </div>
  );
}
