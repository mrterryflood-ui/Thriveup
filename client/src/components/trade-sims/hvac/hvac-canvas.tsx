import { useMemo, useState, useEffect } from "react";
import {
  solveThermal,
  wToBtuh,
  type HvacZone,
  type HvacEquipment,
  type HvacDuct,
  type ThermalSolveResult,
  type ThermalSolveError,
} from "@/lib/trade-sims/hvac/thermal-solver";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  Wind,
  Snowflake,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";

export type HvacEquipmentPreset = "heat_pump_3ton" | "gas_furnace_80k" | "none";

export interface HvacCanvasProps {
  initialZones?: Array<Partial<HvacZone>>;
  initialEquipment?: HvacEquipmentPreset;
  initialSeason?: "cooling" | "heating";
  onChange?: (s: {
    lastSolve: ThermalSolveResult | null;
    comfort: "pass" | "marginal" | "fail";
  }) => void;
}

// Presets keyed to common residential equipment. heat_pump_3ton is roughly
// 36k BTU/h ≈ 10500 W; furnace 80k BTU/h ≈ 23500 W. "none" lets the learner
// watch ambient drift only.
const EQUIPMENT_PRESETS: Record<HvacEquipmentPreset, Omit<HvacEquipment, "id">> = {
  heat_pump_3ton: { heatingCapacity: 10500, coolingCapacity: 10500, efficiency: 3.5, blowerCFM: 1200 },
  gas_furnace_80k: { heatingCapacity: 23500, coolingCapacity: 0, efficiency: 0.95, blowerCFM: 1200 },
  none: { heatingCapacity: 0, coolingCapacity: 0, efficiency: 1, blowerCFM: 0 },
};

const DEFAULT_ZONE: Omit<HvacZone, "id"> = {
  volume: 80,
  targetTemp: 22,
  occupancy: 2,
  externalWallArea: 60,
  externalWallR: 4,
  internalGain: 150,
};

function zoneFromPartial(p: Partial<HvacZone>, i: number): HvacZone {
  return {
    id: p.id ?? `zone_${i + 1}`,
    volume: p.volume ?? DEFAULT_ZONE.volume,
    targetTemp: p.targetTemp ?? DEFAULT_ZONE.targetTemp,
    occupancy: p.occupancy ?? DEFAULT_ZONE.occupancy,
    externalWallArea: p.externalWallArea ?? DEFAULT_ZONE.externalWallArea,
    externalWallR: p.externalWallR ?? DEFAULT_ZONE.externalWallR,
    internalGain: p.internalGain ?? DEFAULT_ZONE.internalGain,
  };
}

export function HvacCanvas({
  initialZones,
  initialEquipment = "heat_pump_3ton",
  initialSeason = "heating",
  onChange,
}: HvacCanvasProps) {
  const [zones, setZones] = useState<HvacZone[]>(() => {
    const src = initialZones && initialZones.length > 0 ? initialZones : [{}];
    return src.map((z, i) => zoneFromPartial(z, i));
  });
  const [equipmentType, setEquipmentType] = useState<HvacEquipmentPreset>(initialEquipment);
  const [season, setSeason] = useState<"cooling" | "heating">(initialSeason);
  const [outdoorTemp, setOutdoorTemp] = useState<number>(initialSeason === "cooling" ? 32 : -5);

  const addZone = () => {
    setZones((prev) => [...prev, zoneFromPartial({}, prev.length)]);
  };
  const removeZone = (id: string) => {
    setZones((prev) => (prev.length > 1 ? prev.filter((z) => z.id !== id) : prev));
  };
  const updateZone = (id: string, field: keyof HvacZone, value: number) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
  };

  const solveResult: ThermalSolveResult | ThermalSolveError = useMemo(() => {
    // Auto-stamp one supply + one return duct per zone so the solver has
    // an airflow path without forcing the learner to wire ducts manually.
    const ducts: HvacDuct[] = zones.flatMap((z) => [
      {
        id: `supply_${z.id}`,
        fromZone: "equipment",
        toZone: z.id,
        crossSection: 0.05,
        length: 5,
        kind: "supply" as const,
      },
      {
        id: `return_${z.id}`,
        fromZone: z.id,
        toZone: "equipment",
        crossSection: 0.08,
        length: 5,
        kind: "return" as const,
      },
    ]);
    return solveThermal({
      units: "SI",
      zones,
      ducts,
      equipment: { id: "sys_1", ...EQUIPMENT_PRESETS[equipmentType] },
      ambient: { temp: outdoorTemp },
    });
  }, [zones, equipmentType, outdoorTemp]);

  const comfortVerdict: "pass" | "marginal" | "fail" = useMemo(() => {
    if (!solveResult.ok) return "fail";
    let maxDiff = 0;
    for (const z of zones) {
      const zr = solveResult.perZone[z.id];
      if (zr) maxDiff = Math.max(maxDiff, Math.abs(zr.temperature - z.targetTemp));
    }
    if (maxDiff <= 1) return "pass";
    if (maxDiff <= 3) return "marginal";
    return "fail";
  }, [solveResult, zones]);

  useEffect(() => {
    onChange?.({
      lastSolve: solveResult.ok ? solveResult : null,
      comfort: comfortVerdict,
    });
    // onChange is intentionally omitted: parents typically pass an inline
    // arrow, so including it would refire the effect every render. We only
    // care about solver-output changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveResult, comfortVerdict]);

  return (
    <div className="space-y-4" data-testid="hvac-canvas">
      {/* Schematic header — visual orientation only */}
      <div className="w-full h-24 bg-slate-50 dark:bg-slate-900 border rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-background border-2 border-primary rounded">
              <Wind className="h-6 w-6 text-primary" />
            </div>
            <span className="text-[10px] uppercase font-bold mt-1">Equipment</span>
          </div>
          {zones.map((z) => (
            <div key={z.id} className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-primary/40 relative">
                <div className="absolute right-0 -top-[3px] w-2 h-2 border-t-2 border-r-2 border-primary rotate-45" />
              </div>
              <div className="p-2 bg-background border rounded">
                <span className="text-[10px] font-mono">{z.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Zones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Thermal Zones</h3>
            <Button size="sm" onClick={addZone} data-testid="button-add-zone">
              <Plus className="h-4 w-4 mr-1" /> Add zone
            </Button>
          </div>
          {zones.map((z) => (
            <Card key={z.id} className="relative">
              {zones.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeZone(z.id)}
                  data-testid={`button-remove-${z.id}`}
                  aria-label={`Remove ${z.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{z.id}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-volume`}>Volume (m³)</Label>
                  <Input
                    id={`${z.id}-volume`}
                    type="number"
                    value={z.volume}
                    onChange={(e) => updateZone(z.id, "volume", Number(e.target.value))}
                    data-testid={`input-${z.id}-volume`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-target`}>Target (°C)</Label>
                  <Input
                    id={`${z.id}-target`}
                    type="number"
                    value={z.targetTemp}
                    onChange={(e) => updateZone(z.id, "targetTemp", Number(e.target.value))}
                    data-testid={`input-${z.id}-targetTemp`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-occ`}>Occupants</Label>
                  <Input
                    id={`${z.id}-occ`}
                    type="number"
                    value={z.occupancy ?? 0}
                    onChange={(e) => updateZone(z.id, "occupancy", Number(e.target.value))}
                    data-testid={`input-${z.id}-occupancy`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-wall`}>Wall area (m²)</Label>
                  <Input
                    id={`${z.id}-wall`}
                    type="number"
                    value={z.externalWallArea}
                    onChange={(e) => updateZone(z.id, "externalWallArea", Number(e.target.value))}
                    data-testid={`input-${z.id}-wallArea`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-r`}>Wall R (m²K/W)</Label>
                  <Input
                    id={`${z.id}-r`}
                    type="number"
                    step="0.5"
                    value={z.externalWallR}
                    onChange={(e) => updateZone(z.id, "externalWallR", Number(e.target.value))}
                    data-testid={`input-${z.id}-wallR`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${z.id}-gain`}>Internal gain (W)</Label>
                  <Input
                    id={`${z.id}-gain`}
                    type="number"
                    value={z.internalGain ?? 0}
                    onChange={(e) => updateZone(z.id, "internalGain", Number(e.target.value))}
                    data-testid={`input-${z.id}-internalGain`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Equipment + ambient */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wind className="h-4 w-4" /> Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-xs">System</Label>
              <Select
                value={equipmentType}
                onValueChange={(v) => setEquipmentType(v as HvacEquipmentPreset)}
              >
                <SelectTrigger data-testid="select-equipment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heat_pump_3ton">Heat pump · 3-ton (≈10.5 kW)</SelectItem>
                  <SelectItem value="gas_furnace_80k">Gas furnace · 80k BTU/h (≈23.5 kW)</SelectItem>
                  <SelectItem value="none">None — observe ambient drift only</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Thermometer className="h-4 w-4" /> Outdoor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Season</Label>
                <Select
                  value={season}
                  onValueChange={(v) => {
                    const s = v as "cooling" | "heating";
                    setSeason(s);
                    setOutdoorTemp(s === "cooling" ? 32 : -5);
                  }}
                >
                  <SelectTrigger data-testid="select-season">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heating">Winter (heating)</SelectItem>
                    <SelectItem value="cooling">Summer (cooling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="outdoor-temp">Outdoor (°C)</Label>
                <Input
                  id="outdoor-temp"
                  type="number"
                  value={outdoorTemp}
                  onChange={(e) => setOutdoorTemp(Number(e.target.value))}
                  data-testid="input-outdoor-temp"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      <Card className="border-2">
        <CardContent className="pt-4">
          {!solveResult.ok ? (
            <Alert variant="destructive" data-testid="alert-hvac-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Solver error</AlertTitle>
              <AlertDescription>{solveResult.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Live system analysis</h3>
                <Badge
                  data-testid="badge-comfort"
                  className={
                    comfortVerdict === "pass"
                      ? "bg-green-600 hover:bg-green-600"
                      : comfortVerdict === "marginal"
                        ? "bg-amber-500 hover:bg-amber-500"
                        : "bg-red-600 hover:bg-red-600"
                  }
                >
                  {comfortVerdict === "pass" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  Comfort: {comfortVerdict.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border rounded">
                  <Label className="text-[10px] uppercase opacity-70">System load</Label>
                  <div className="text-lg font-mono font-bold" data-testid="result-total-load">
                    {Math.round(solveResult.totalLoad)} W
                  </div>
                  <div className="text-xs opacity-60">
                    {Math.round(wToBtuh(solveResult.totalLoad))} BTU/h
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <Label className="text-[10px] uppercase opacity-70">Capacity</Label>
                  <div className="text-lg font-mono font-bold" data-testid="result-capacity">
                    {Math.round(solveResult.equipmentCapacity)} W
                  </div>
                  <div className="text-xs opacity-60">Mode: {solveResult.mode}</div>
                </div>
                <div className="p-3 border rounded">
                  <Label className="text-[10px] uppercase opacity-70">Sizing margin</Label>
                  <div className="text-lg font-mono font-bold" data-testid="result-margin">
                    {Math.round(solveResult.equipmentCapacity - solveResult.totalLoad)} W
                  </div>
                  {solveResult.warnings.length > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                      {solveResult.warnings.length} warning{solveResult.warnings.length === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase opacity-70">Per-zone</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {zones.map((z) => {
                    const zr = solveResult.perZone[z.id];
                    if (!zr) return null;
                    const diff = Math.abs(zr.temperature - z.targetTemp);
                    const verdictClass =
                      diff <= 1 ? "" : diff <= 3 ? "border-amber-500" : "border-red-500";
                    return (
                      <div
                        key={z.id}
                        className={`p-2 border rounded ${verdictClass}`}
                        data-testid={`zone-result-${z.id}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">{z.id}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {zr.sensibleLoad > 0 ? (
                              <Flame className="h-2.5 w-2.5 mr-1" />
                            ) : (
                              <Snowflake className="h-2.5 w-2.5 mr-1" />
                            )}
                            {Math.abs(Math.round(zr.sensibleLoad))} W
                          </Badge>
                        </div>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-base font-mono">
                            {zr.temperature.toFixed(1)}°C
                          </span>
                          <span className="text-[10px] opacity-60">
                            target {z.targetTemp.toFixed(0)}°C · {Math.round(zr.airflowRequiredCFM)} CFM
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {solveResult.warnings.length > 0 && (
                <Alert data-testid="alert-hvac-warnings">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>System warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {solveResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
