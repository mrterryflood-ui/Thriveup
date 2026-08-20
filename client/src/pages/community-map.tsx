import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, RefreshCw, Download, Layers, Activity, Heart,
  Shield, Home, Apple, GraduationCap, Briefcase, AlertTriangle,
  BarChart3, FileText, ArrowLeftRight, Globe, Search, Loader2, Info, ChevronRight,
} from "lucide-react";
import type { GisContextData } from "@shared/schema";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";
import { TrainingGuideButton } from "@/components/training-guide";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
];

interface DataLayer {
  id: string;
  label: string;
  icon: typeof MapPin;
  color: string;
  field: keyof GisContextData;
  description: string;
}

const DATA_LAYERS: DataLayer[] = [
  { id: "poverty", label: "Poverty Rate", icon: AlertTriangle, color: "#ef4444", field: "povertyRate", description: "Percentage of population below poverty line" },
  { id: "health", label: "Health Burden", icon: Heart, color: "#f97316", field: "healthBurdenComposite", description: "Composite health risk indicators from CDC PLACES" },
  { id: "crime", label: "Crime Rate", icon: Shield, color: "#8b5cf6", field: "crimeTrendPercentile", description: "Crime trend percentile from FBI data" },
  { id: "food", label: "Food Deserts", icon: Apple, color: "#22c55e", field: "foodDesertIndicator", description: "Limited access to healthy food options" },
  { id: "housing", label: "Housing Instability", icon: Home, color: "#3b82f6", field: "housingInstabilityIndex", description: "Housing cost burden and instability index" },
  { id: "education", label: "Education", icon: GraduationCap, color: "#06b6d4", field: "educationAttainmentRate", description: "Percentage with bachelor's degree or higher" },
  { id: "employment", label: "Unemployment", icon: Briefcase, color: "#eab308", field: "unemploymentRate", description: "Local unemployment rate" },
  { id: "substance", label: "Substance Abuse", icon: Activity, color: "#ec4899", field: "substanceAbuseRate", description: "Substance abuse treatment need indicators" },
];

function getContextLoadColor(value: number): string {
  if (value >= 70) return "#ef4444";
  if (value >= 50) return "#f97316";
  if (value >= 30) return "#eab308";
  return "#22c55e";
}

function getContextLoadLabel(value: number): string {
  if (value >= 70) return "Critical";
  if (value >= 50) return "High";
  if (value >= 30) return "Moderate";
  return "Low";
}

function getLayerColor(value: number, layerColor: string): string {
  if (value > 50) return "#ef4444";
  if (value > 30) return "#f97316";
  if (value > 15) return "#eab308";
  return layerColor;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function ContextLoadGauge({ value }: { value: number }) {
  const color = getContextLoadColor(value);
  const label = getContextLoadLabel(value);

  return (
    <div className="flex flex-col items-center gap-2" data-testid="gauge-context-load">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(value / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{value.toFixed(0)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge variant="outline" style={{ borderColor: color, color }} data-testid="badge-context-level">
        {label} Risk
      </Badge>
    </div>
  );
}

interface RecordWithNarrative extends GisContextData {
  narrative?: string;
}

function CommunityProfileCard({ record, narrative }: { record: RecordWithNarrative; narrative?: string }) {
  const displayNarrative = narrative || record.narrative;

  return (
    <Card data-testid={`card-community-${record.geographyKey}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{record.locationName || record.geographyKey}</CardTitle>
            <CardDescription>{record.geographyType} · {record.stateCode || "US"}</CardDescription>
          </div>
          {record.contextLoadIndex !== null && record.contextLoadIndex !== undefined && (
            <ContextLoadGauge value={record.contextLoadIndex} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayNarrative && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed" data-testid="text-narrative">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p>{displayNarrative}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <MetricItem label="Poverty Rate" value={record.povertyRate} suffix="%" icon={AlertTriangle} color="#ef4444" />
          <MetricItem label="Unemployment" value={record.unemploymentRate} suffix="%" icon={Briefcase} color="#eab308" />
          <MetricItem label="Median Income" value={record.medianIncome} prefix="$" icon={BarChart3} color="#22c55e" format="currency" />
          <MetricItem label="Population" value={record.totalPopulation} icon={Globe} color="#3b82f6" format="number" />
          <MetricItem label="Health Burden" value={record.healthBurdenComposite} suffix="%" icon={Heart} color="#f97316" />
          <MetricItem label="Food Desert" value={record.foodDesertIndicator} suffix="%" icon={Apple} color="#22c55e" />
          <MetricItem label="Housing Risk" value={record.housingInstabilityIndex} icon={Home} color="#3b82f6" />
          <MetricItem label="Education" value={record.educationAttainmentRate} suffix="%" icon={GraduationCap} color="#06b6d4" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Sources: {record.dataSource || "Pending"} · Year: {record.dataYear || "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricItem({ label, value, suffix, prefix, icon: Icon, color, format }: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  prefix?: string;
  icon: typeof MapPin;
  color: string;
  format?: "currency" | "number";
}) {
  const displayValue = value !== null && value !== undefined
    ? format === "currency"
      ? `${prefix || ""}${Math.round(value).toLocaleString()}`
      : format === "number"
        ? value.toLocaleString()
        : `${prefix || ""}${value.toFixed(1)}${suffix || ""}`
    : "N/A";

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold">{displayValue}</p>
      </div>
    </div>
  );
}

function ComparisonView({ record1, record2 }: {
  record1: RecordWithNarrative;
  record2: RecordWithNarrative;
}) {
  const metrics = [
    { label: "Context Load Index", field: "contextLoadIndex" as keyof GisContextData, higherIsWorse: true },
    { label: "Poverty Rate", field: "povertyRate" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
    { label: "Unemployment", field: "unemploymentRate" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
    { label: "Median Income", field: "medianIncome" as keyof GisContextData, higherIsWorse: false, prefix: "$" },
    { label: "Health Burden", field: "healthBurdenComposite" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
    { label: "Crime Trend", field: "crimeTrendPercentile" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
    { label: "Food Desert", field: "foodDesertIndicator" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
    { label: "Housing Risk", field: "housingInstabilityIndex" as keyof GisContextData, higherIsWorse: true },
    { label: "Education", field: "educationAttainmentRate" as keyof GisContextData, higherIsWorse: false, suffix: "%" },
    { label: "Substance Abuse", field: "substanceAbuseRate" as keyof GisContextData, higherIsWorse: true, suffix: "%" },
  ];

  return (
    <div className="space-y-3" data-testid="comparison-view">
      <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold pb-2 border-b">
        <span className="text-left">{record1.locationName || record1.geographyKey}</span>
        <span>Metric</span>
        <span className="text-right">{record2.locationName || record2.geographyKey}</span>
      </div>
      {metrics.map(({ label, field, higherIsWorse, suffix, prefix }) => {
        const v1 = record1[field] as number | null;
        const v2 = record2[field] as number | null;
        const fmt = (v: number | null) => {
          if (v === null || v === undefined) return "N/A";
          if (prefix === "$") return `$${Math.round(v).toLocaleString()}`;
          return `${v.toFixed(1)}${suffix || ""}`;
        };
        const better1 = v1 !== null && v2 !== null
          ? higherIsWorse ? v1 < v2 : v1 > v2
          : false;
        const better2 = v1 !== null && v2 !== null
          ? higherIsWorse ? v2 < v1 : v2 > v1
          : false;

        return (
          <div key={field} className="grid grid-cols-3 gap-2 items-center text-sm py-1">
            <span className={`text-left ${better1 ? "text-green-600 font-semibold" : ""}`}>{fmt(v1)}</span>
            <span className="text-center text-muted-foreground text-xs">{label}</span>
            <span className={`text-right ${better2 ? "text-green-600 font-semibold" : ""}`}>{fmt(v2)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ResourcePanel({ stateCode }: { stateCode: string }) {
  const { data, isLoading } = useQuery<{
    resources: Array<{
      id: string;
      name: string;
      category: string;
      subcategory: string;
      url: string;
      phone: string | null;
      verificationStatus: string;
      availabilityStatus: string;
      freshness: string;
      source: { label: string };
    }>;
    disclosures: string[];
  }>({
    queryKey: ["/api/community-map/resource-graph", stateCode],
    enabled: !!stateCode,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!data?.resources?.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">No resources found for this state.</p>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 pr-4">
        {data.resources.map((resource, i) => (
          <div key={resource.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`card-resource-${i}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{resource.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{resource.category}</Badge>
                  <Badge variant="outline" className="text-xs">{resource.verificationStatus}</Badge>
                </div>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex-shrink-0"
                data-testid={`link-resource-${i}`}
              >
                Visit <ChevronRight className="h-3 w-3 inline" />
              </a>
            </div>
            {resource.phone && (
              <p className="text-xs text-muted-foreground mt-1">{resource.phone}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Availability: {resource.availabilityStatus} · Freshness: {resource.freshness}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{resource.source.label}</p>
          </div>
        ))}
        {data.disclosures?.length > 0 && (
          <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground" data-testid="resource-graph-disclosures">
            <p className="font-medium text-foreground mb-1">Data notes</p>
            <ul className="list-disc pl-4 space-y-1">
              {data.disclosures.slice(0, 4).map((disclosure) => <li key={disclosure}>{disclosure}</li>)}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function ExportButton({ record }: { record: RecordWithNarrative }) {
  const handleExport = useCallback(() => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Community Profile Report", margin, y);
    y += lineHeight * 2;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Location: ${record.locationName || record.geographyKey}`, margin, y);
    y += lineHeight;
    doc.text(`State: ${record.stateCode || "N/A"} | Geography Type: ${record.geographyType}`, margin, y);
    y += lineHeight;
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Context Load Index: ${record.contextLoadIndex?.toFixed(1) || "N/A"} / 100`, margin, y);
    y += lineHeight;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Risk Level: ${record.contextLoadIndex ? getContextLoadLabel(record.contextLoadIndex) : "N/A"}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Key Indicators", margin, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const indicators = [
      ["Poverty Rate", `${record.povertyRate?.toFixed(1) || "N/A"}%`],
      ["Unemployment Rate", `${record.unemploymentRate?.toFixed(1) || "N/A"}%`],
      ["Median Household Income", `$${record.medianIncome?.toLocaleString() || "N/A"}`],
      ["Total Population", record.totalPopulation?.toLocaleString() || "N/A"],
      ["Health Burden Composite", `${record.healthBurdenComposite?.toFixed(1) || "N/A"}%`],
      ["Crime Trend Percentile", `${record.crimeTrendPercentile?.toFixed(1) || "N/A"}%`],
      ["Food Desert Indicator", `${record.foodDesertIndicator?.toFixed(1) || "N/A"}%`],
      ["Housing Instability Index", record.housingInstabilityIndex?.toFixed(1) || "N/A"],
      ["Education Attainment", `${record.educationAttainmentRate?.toFixed(1) || "N/A"}%`],
      ["Substance Abuse Rate", `${record.substanceAbuseRate?.toFixed(1) || "N/A"}%`],
      ["SVI Percentile", record.sviPercentile?.toFixed(1) || "N/A"],
    ];

    for (const [label, value] of indicators) {
      doc.text(`${label}: ${value}`, margin, y);
      y += lineHeight;
    }

    y += lineHeight;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Narrative Summary", margin, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const narrativeText = record.narrative || "No narrative available.";
    const splitNarrative = doc.splitTextToSize(narrativeText, pageWidth - margin * 2);
    for (const line of splitNarrative) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    y += lineHeight;
    doc.setFontSize(8);
    doc.text(`Data Sources: ${record.dataSource || "N/A"} | Data Year: ${record.dataYear || "N/A"}`, margin, y);
    y += lineHeight;
    doc.text("Generated for grant application purposes.", margin, y);
    y += lineHeight;
    doc.text("Sources: CDC PLACES, CDC SVI, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS, DOE", margin, y);

    doc.save(`community-profile-${record.geographyKey}-${new Date().toISOString().split("T")[0]}.pdf`);
  }, [record]);

  return (
    <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-profile">
      <Download className="h-4 w-4 mr-1" /> Export PDF
    </Button>
  );
}

interface SearchResult {
  locationName: string;
  center: { lat: number; lng: number };
  records: GisContextData[];
  count: number;
}

export default function CommunityMapPage() {
  const [selectedState, setSelectedState] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"state" | "location">("state");
  const [selectedRecord, setSelectedRecord] = useState<RecordWithNarrative | null>(null);
  const [compareRecord, setCompareRecord] = useState<RecordWithNarrative | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["poverty", "health"]));
  const [activeTab, setActiveTab] = useState("map");
  const { toast } = useToast();

  const stateSearchQuery = useQuery<SearchResult>({
    queryKey: ["/api/community-map/search/" + selectedState],
    enabled: searchMode === "state" && !!selectedState,
  });

  const locationSearchQuery = useQuery<SearchResult>({
    queryKey: ["/api/community-map/location-search?q=" + encodeURIComponent(activeSearch)],
    enabled: searchMode === "location" && !!activeSearch,
  });

  const searchData = searchMode === "state" ? stateSearchQuery.data : locationSearchQuery.data;
  const searchLoading = searchMode === "state" ? stateSearchQuery.isLoading : locationSearchQuery.isLoading;

  const ingestMutation = useMutation({
    mutationFn: async (stateAbbr: string) => {
      const res = await apiRequest("POST", "/api/community-map/ingest", { stateAbbr });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Data refreshed", description: "Ingested data from multiple federal sources." });
      if (searchMode === "state" && selectedState) {
        queryClient.invalidateQueries({ queryKey: ["/api/community-map/search/" + selectedState] });
      }
      if (searchMode === "location" && activeSearch) {
        queryClient.invalidateQueries({ queryKey: ["/api/community-map/location-search?q=" + encodeURIComponent(activeSearch)] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Refresh failed", description: error.message || "Could not fetch fresh data.", variant: "destructive" });
    },
  });

  const contextQuery = useQuery<RecordWithNarrative>({
    queryKey: ["/api/community-map/context", selectedRecord?.geographyKey],
    enabled: !!selectedRecord?.geographyKey,
  });

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }, []);

  const mapCenter = useMemo<[number, number]>(() => {
    if (searchData?.center) return [searchData.center.lat, searchData.center.lng];
    return [39.8283, -98.5795];
  }, [searchData]);

  const mapZoom = useMemo(() => {
    if (searchMode === "location" && activeSearch) return 9;
    if (selectedState) return 7;
    return 4;
  }, [selectedState, searchMode, activeSearch]);

  const handleRecordSelect = useCallback((record: GisContextData) => {
    const recordWithNarrative: RecordWithNarrative = { ...record };
    if (showComparison && selectedRecord) {
      setCompareRecord(recordWithNarrative);
    } else {
      setSelectedRecord(recordWithNarrative);
    }
  }, [showComparison, selectedRecord]);

  const handleLocationSearch = useCallback(() => {
    if (locationQuery.trim()) {
      setSearchMode("location");
      setActiveSearch(locationQuery.trim());
    }
  }, [locationQuery]);

  const handleStateChange = useCallback((value: string) => {
    setSelectedState(value);
    setSearchMode("state");
    setActiveSearch("");
  }, []);

  const activeLayerList = useMemo(() => {
    return DATA_LAYERS.filter(l => activeLayers.has(l.id));
  }, [activeLayers]);

  const refreshStateCode = useMemo(() => {
    if (searchMode === "state" && selectedState) return selectedState;
    if (searchData?.records?.length && searchData.records[0].stateCode) {
      return searchData.records[0].stateCode;
    }
    return "";
  }, [searchMode, selectedState, searchData]);

  return (
    <div className="flex flex-col h-full" data-testid="page-community-map">
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Globe className="h-6 w-6 text-primary" />
                Community Intelligence Map
              </h1>
              <TrainingGuideButton moduleId="community-map" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Explore social determinants of health, resources, and community data across the US
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Input
                placeholder="City, ZIP, county, or state..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                className="w-[220px]"
                data-testid="input-location-search"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleLocationSearch}
                disabled={!locationQuery.trim()}
                data-testid="button-location-search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">or</span>
            <Select value={selectedState} onValueChange={handleStateChange} data-testid="select-state">
              <SelectTrigger className="w-[180px]" data-testid="trigger-select-state">
                <SelectValue placeholder="Select state..." />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.code} value={s.code} data-testid={`option-state-${s.code}`}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshStateCode && ingestMutation.mutate(refreshStateCode)}
              disabled={!refreshStateCode || ingestMutation.isPending}
              data-testid="button-refresh-data"
            >
              {ingestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList data-testid="tabs-view-mode">
                <TabsTrigger value="map" data-testid="tab-map"><MapPin className="h-4 w-4 mr-1" /> Map</TabsTrigger>
                <TabsTrigger value="data" data-testid="tab-data"><BarChart3 className="h-4 w-4 mr-1" /> Data</TabsTrigger>
                <TabsTrigger value="compare" data-testid="tab-compare"><ArrowLeftRight className="h-4 w-4 mr-1" /> Compare</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 m-0 p-4">
              <div className="flex gap-4 h-full">
                <div className="flex-1 rounded-lg overflow-hidden border relative" style={{ minHeight: 400 }}>
                  {searchLoading && (
                    <div className="absolute inset-0 bg-background/50 z-[1000] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} zoom={mapZoom} />
                    {searchData?.records?.map((record) => {
                      if (!record.latitude || !record.longitude) return null;

                      return activeLayerList.map((layer, layerIdx) => {
                        const value = record[layer.field] as number | null;
                        if (value === null || value === undefined) return null;

                        const radius = Math.max(5, Math.min(18, value / 5));
                        const color = getLayerColor(value, layer.color);
                        const offset = layerIdx * 0.02;

                        return (
                          <CircleMarker
                            key={`${record.id}-${layer.id}`}
                            center={[(record.latitude ?? 0) + offset, (record.longitude ?? 0) + offset]}
                            radius={radius}
                            pathOptions={{ fillColor: color, color: layer.color, fillOpacity: 0.5, weight: 1.5 }}
                            eventHandlers={{
                              click: () => handleRecordSelect(record),
                            }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold">{record.locationName || record.geographyKey}</p>
                                <p className="text-xs text-gray-600">
                                  {layer.label}: {value.toFixed(1)}
                                </p>
                                {record.contextLoadIndex !== null && record.contextLoadIndex !== undefined && (
                                  <p className="text-xs">
                                    Context Load: <strong>{record.contextLoadIndex.toFixed(1)}</strong>
                                  </p>
                                )}
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      });
                    })}
                  </MapContainer>
                </div>

                <div className="w-64 flex-shrink-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Layers className="h-4 w-4" /> Data Layers
                      </CardTitle>
                      <CardDescription className="text-xs">Toggle layers independently</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DATA_LAYERS.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between" data-testid={`toggle-layer-${layer.id}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />
                            <Label className="text-xs cursor-pointer" htmlFor={`layer-${layer.id}`}>{layer.label}</Label>
                          </div>
                          <Switch
                            id={`layer-${layer.id}`}
                            checked={activeLayers.has(layer.id)}
                            onCheckedChange={() => toggleLayer(layer.id)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {searchData && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{searchData.locationName}</CardTitle>
                        <CardDescription className="text-xs">{searchData.count} data points</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          Click a point on the map to view community details.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 m-0 p-4 overflow-auto">
              {!searchData ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Search for a location</p>
                  <p className="text-sm">Enter a city, ZIP code, county, or state to explore community data.</p>
                </div>
              ) : searchLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchData.records.slice(0, 20).map(record => (
                    <div
                      key={record.id}
                      className="cursor-pointer"
                      onClick={() => handleRecordSelect(record)}
                      data-testid={`card-data-${record.geographyKey}`}
                    >
                      <Card className="hover:ring-2 ring-primary/50 transition-all">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{record.locationName || record.geographyKey}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Poverty: <strong>{record.povertyRate?.toFixed(1) || "N/A"}%</strong></div>
                            <div>Unemployment: <strong>{record.unemploymentRate?.toFixed(1) || "N/A"}%</strong></div>
                            <div>Income: <strong>${record.medianIncome?.toLocaleString() || "N/A"}</strong></div>
                            <div>CLI: <strong>{record.contextLoadIndex?.toFixed(1) || "N/A"}</strong></div>
                          </div>
                          {record.contextLoadIndex !== null && record.contextLoadIndex !== undefined && (
                            <Progress value={record.contextLoadIndex} className="h-1.5 mt-2" />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="compare" className="flex-1 m-0 p-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="compare-mode"
                      checked={showComparison}
                      onCheckedChange={setShowComparison}
                    />
                    <Label htmlFor="compare-mode">Comparison Mode</Label>
                  </div>
                  {showComparison && (
                    <p className="text-sm text-muted-foreground ml-4">
                      Click two locations in the Data tab to compare them side by side.
                    </p>
                  )}
                </div>

                {selectedRecord && compareRecord ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Community Comparison</CardTitle>
                      <CardDescription>Side-by-side analysis for grant applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ComparisonView record1={selectedRecord} record2={compareRecord} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <ArrowLeftRight className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Select two locations to compare</p>
                    <p className="text-sm text-center max-w-md">
                      Enable comparison mode, then click locations in the Data tab or on the map.
                      The first click selects Location A, the second selects Location B.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-96 border-l flex-shrink-0 overflow-auto hidden lg:block">
          <div className="p-4 space-y-4">
            {selectedRecord ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Community Profile</h3>
                  <ExportButton record={contextQuery.data || selectedRecord} />
                </div>
                {contextQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-24" />
                  </div>
                ) : (
                  <CommunityProfileCard
                    record={contextQuery.data || selectedRecord}
                    narrative={contextQuery.data?.narrative}
                  />
                )}
                <Separator />
                <h3 className="font-semibold text-sm">Available Resources</h3>
                <ResourcePanel stateCode={selectedRecord.stateCode || selectedState || ""} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
                <MapPin className="h-12 w-12 mb-4" />
                <p className="font-medium">Select a Location</p>
                <p className="text-sm mt-2">
                  Search by city, ZIP, county, or state and click a data point to view its community profile, narrative summary, and available resources.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
