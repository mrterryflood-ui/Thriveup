import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle, Heart, Home, Users, Phone, ExternalLink,
  TrendingDown, ShieldCheck, Apple, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActionItem {
  program: string;
  gapEstimate: number | null;
  gapLabel: string;
  callToAction: string;
  url: string;
  phone?: string;
}

interface CountyEquityData {
  countyFips: string;
  countyName: string;
  population: number;
  povertyCount: number;
  povertyRate: number;
  snapEligibleEstimate: number;
  medicaidEligibleEstimate: number;
  uninsuredCount: number;
  uninsuredRate: number;
  medianHouseholdIncome: number;
  primaryLanguageNotEnglish: number;
  actionItems: ActionItem[];
}

interface PlacesSummary {
  [fips: string]: {
    county: string;
    fips: string;
    measures: Record<string, number>;
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000).toLocaleString()}K`;
  return n.toLocaleString();
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

const PROGRAM_ICONS: Record<string, typeof Heart> = {
  "SNAP (Food Stamps)": Apple,
  "Medicaid & CHIP": ShieldCheck,
  "Health Insurance": Activity,
  "Emergency Rental Assistance": Home,
};

export default function ResidentEquityDashboard() {
  const [selectedFips, setSelectedFips] = useState<string>("48453"); // Travis default

  const { data: equityData, isLoading: equityLoading } = useQuery<CountyEquityData[]>({
    queryKey: ["/api/equity/resident-equity-data"],
  });

  const { data: placesSummary, isLoading: placesLoading } = useQuery<PlacesSummary>({
    queryKey: ["/api/equity/places-summary"],
  });

  const county = equityData?.find(c => c.countyFips === selectedFips);
  const places = placesSummary?.[selectedFips];

  const loading = equityLoading || placesLoading;

  const healthHighlights = places ? [
    { label: "Uninsured", key: "Current lack of health insurance", icon: "🏥", color: "text-red-600" },
    { label: "Depression", key: "Depression", icon: "🧠", color: "text-purple-600" },
    { label: "Diabetes", key: "Diabetes", icon: "💉", color: "text-orange-600" },
    { label: "High blood pressure", key: "High blood pressure", icon: "❤️", color: "text-red-500" },
    { label: "No routine checkup", key: "Routine checkup within past year", icon: "🩺", color: "text-blue-600", invert: true },
    { label: "Mental health struggles", key: "Mental health not good for ≥14 days", icon: "🌱", color: "text-green-600" },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                What's Happening in Your County
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real numbers, plain language, and steps you can take today
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* County picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">I live in:</span>
          <Select value={selectedFips} onValueChange={setSelectedFips}>
            <SelectTrigger data-testid="select-county" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="48453">Travis County</SelectItem>
              <SelectItem value="48491">Williamson County</SelectItem>
              <SelectItem value="48209">Hays County</SelectItem>
              <SelectItem value="48021">Bastrop County</SelectItem>
              <SelectItem value="48055">Caldwell County</SelectItem>
              <SelectItem value="48031">Blanco County</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        )}

        {county && !loading && (
          <>
            {/* Population snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-population">
                    {fmt(county.population)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">people in {county.countyName} County</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400" data-testid="stat-poverty">
                    {fmt(county.povertyCount)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">people below poverty line ({pct(county.povertyRate)})</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="stat-uninsured">
                    {fmt(county.uninsuredCount)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">without health insurance ({pct(county.uninsuredRate)})</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="stat-income">
                    ${Math.round(county.medianHouseholdIncome / 1000)}K
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">median household income</p>
                </CardContent>
              </Card>
            </div>

            {/* Action items — the core of the dashboard */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Help that may be available to you
              </h2>
              <div className="space-y-3">
                {county.actionItems.map((item, i) => {
                  const Icon = PROGRAM_ICONS[item.program] || Heart;
                  return (
                    <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                                {item.program}
                              </h3>
                              {item.gapEstimate && item.gapEstimate > 100 && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs" data-testid={`badge-gap-${i}`}>
                                  ~{fmt(item.gapEstimate)} {item.gapLabel}
                                </Badge>
                              )}
                            </div>
                            {!item.gapEstimate && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.gapLabel}</p>
                            )}
                            <p className="text-sm font-medium text-green-700 dark:text-green-400 mt-1">
                              {item.callToAction}
                            </p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                data-testid={`btn-apply-${i}`}
                                onClick={() => window.open(item.url, "_blank")}
                              >
                                <ExternalLink className="w-3 h-3 mr-1.5" />
                                Get started
                              </Button>
                              {item.phone && (
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Phone className="w-3 h-3" />
                                  Call {item.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* CDC PLACES health snapshot */}
            {places && Object.keys(places.measures).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Health in {county.countyName} County
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  CDC PLACES data — percentage of adults affected
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {healthHighlights.map(({ label, key, icon, color, invert }) => {
                    const val = places.measures[key];
                    if (val == null) return null;
                    const displayVal = invert ? (100 - val) : val;
                    return (
                      <Card key={key} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardContent className="pt-3 pb-3 text-center">
                          <span className="text-2xl">{icon}</span>
                          <p className={`text-xl font-bold mt-1 ${color}`} data-testid={`health-${label.replace(/\s/g, '-').toLowerCase()}`}>
                            {pct(displayVal)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                            {invert ? `no ${label.toLowerCase()}` : label.toLowerCase()}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }).filter(Boolean)}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Source: CDC PLACES 2023 · {county.countyName} County, TX
                </p>
              </div>
            )}

            {/* Language note */}
            {county.primaryLanguageNotEnglish > 500 && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Language access is available
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                        About {fmt(county.primaryLanguageNotEnglish)} people in {county.countyName} County speak a language other than English at home.
                        All programs listed above offer interpretation services — ask for a Spanish, Arabic, or other language interpreter.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!county && !loading && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <TrendingDown className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Select your county above to see local data.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
