import { useMemo, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer,
  RotateCcw,
  Play
} from "lucide-react";
import { 
  computeHeatInput, 
  predictPenetration, 
  evaluateWeldVsSpec,
  inchesToMm,
  type WeldingProcess,
  type JointType,
  type AwsCategory,
  type HeatInputResult,
  type EvalError
} from "@/lib/trade-sims/welding/heat-input-evaluator";

export interface WeldingCanvasProps {
  initialProps?: Partial<{
    processKind: WeldingProcess;
    volts: number;
    amps: number;
    travelSpeedInPerMin: number;
    jointType: JointType;
    jointThicknessInches: number;
    awsCode: AwsCategory;
  }>;
  onChange?: (s: { lastSolve: HeatInputResult | null; passed: boolean }) => void;
}

export function WeldingCanvas({ initialProps, onChange }: WeldingCanvasProps) {
  const [processKind, setProcessKind] = useState<WeldingProcess>(initialProps?.processKind ?? "SMAW");
  const [volts, setVolts] = useState<number>(initialProps?.volts ?? 22);
  const [amps, setAmps] = useState<number>(initialProps?.amps ?? 150);
  const [travelSpeedInPerMin, setTravelSpeedInPerMin] = useState<number>(initialProps?.travelSpeedInPerMin ?? 8);
  const [jointType, setJointType] = useState<JointType>(initialProps?.jointType ?? "butt");
  const [jointThicknessInches, setJointThicknessInches] = useState<number>(initialProps?.jointThicknessInches ?? 0.25);
  const [awsCode, setAwsCode] = useState<AwsCategory>(initialProps?.awsCode ?? "D1.1");
  const [hasRun, setHasRun] = useState(false);

  const results = useMemo(() => {
    const thicknessMm = inchesToMm(jointThicknessInches);
    if (typeof thicknessMm !== "number") return { error: thicknessMm };

    const hi = computeHeatInput({
      process: processKind,
      volts,
      amps,
      travelSpeedMmPerSec: (travelSpeedInPerMin * 25.4) / 60
    });

    if (!hi.ok) return { error: hi };

    const pen = predictPenetration({
      process: processKind,
      heatInputJPerMm: hi.heatInputJPerMm,
      baseMetalMm: thicknessMm,
      jointType
    });

    if (!pen.ok) return { error: pen };

    const spec = evaluateWeldVsSpec({
      process: processKind,
      parameters: {
        volts,
        amps,
        travelSpeedInPerMin
      },
      jointType,
      baseMetalInches: jointThicknessInches,
      position: "1G", // Defaulting to flat for simplicity in v1
      awsCategory: awsCode
    });

    if (!spec.ok) return { error: spec };

    // Classification for UI
    const hiKJ = hi.heatInputJPerMm / 1000;
    let hiClass: "cold" | "normal" | "hot" = "normal";
    if (hiKJ < 1.0) hiClass = "cold";
    else if (hiKJ > 2.5) hiClass = "hot";

    return {
      hi,
      pen,
      spec,
      hiClass,
      hiKJ,
      thicknessMm
    };
  }, [processKind, volts, amps, travelSpeedInPerMin, jointType, jointThicknessInches, awsCode]);

  const handleRun = () => {
    setHasRun(true);
    if ("hi" in results && results.hi && "spec" in results && results.spec) {
      onChange?.({
        lastSolve: results.hi,
        passed: results.spec.pass,
      });
    } else {
      onChange?.({
        lastSolve: null,
        passed: false,
      });
    }
  };

  const handleReset = () => {
    setProcessKind(initialProps?.processKind ?? "SMAW");
    setVolts(initialProps?.volts ?? 22);
    setAmps(initialProps?.amps ?? 150);
    setTravelSpeedInPerMin(initialProps?.travelSpeedInPerMin ?? 8);
    setJointType(initialProps?.jointType ?? "butt");
    setJointThicknessInches(initialProps?.jointThicknessInches ?? 0.25);
    setAwsCode(initialProps?.awsCode ?? "D1.1");
    setHasRun(false);
  };

  const renderSVG = () => {
    if ("error" in results) return null;
    const { pen, thicknessMm } = results;
    
    // Scale: 1mm = 5px (base metal 0.25in = 6.35mm = 31.75px)
    const scale = 5;
    const tPx = thicknessMm * scale;
    const pPx = pen.penetrationMm * scale;
    const bPx = (pen.penetrationMm * 2) * scale; // Approx bead width proportional to pen
    
    return (
      <div className="flex justify-center bg-slate-900 rounded p-4 border border-slate-700 h-[120px] items-center">
        <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
          {/* Base Metal Plates */}
          {jointType === "butt" && (
            <>
              <rect x="20" y={60 - tPx/2} width="75" height={tPx} fill="#4a5568" stroke="#2d3748" />
              <rect x="105" y={60 - tPx/2} width="75" height={tPx} fill="#4a5568" stroke="#2d3748" />
            </>
          )}
          {jointType === "tee" && (
            <>
              <rect x="20" y={60 + tPx/2} width="160" height={tPx} fill="#4a5568" stroke="#2d3748" />
              <rect x="90" y={60 - tPx * 1.5} width={tPx} height={tPx * 2} fill="#4a5568" stroke="#2d3748" />
            </>
          )}
          {jointType === "lap" && (
            <>
              <rect x="20" y="60" width="100" height={tPx} fill="#4a5568" stroke="#2d3748" />
              <rect x="60" y={60 - tPx} width="100" height={tPx} fill="#4a5568" stroke="#2d3748" />
            </>
          )}

          {/* Weld Bead */}
          <path 
            d={`M ${100 - bPx/2} 60 Q 100 ${60 + pPx * 1.5} ${100 + bPx/2} 60 Q 100 ${60 - pPx/2} ${100 - bPx/2} 60`}
            fill={pen.classification === "burnthrough" ? "rgba(239, 68, 68, 0.8)" : "rgba(234, 179, 8, 0.8)"}
            stroke={pen.classification === "incomplete" ? "white" : "none"}
            strokeDasharray={pen.classification === "incomplete" ? "2,2" : "none"}
          />
          
          {/* Burnthrough warning */}
          {pen.classification === "burnthrough" && (
            <text x="100" y="100" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">BURNTHROUGH</text>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Settings Panel */}
      <Card className="md:col-span-4" data-testid="card-welding-settings">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4" /> Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="process">Process</Label>
            <Select 
              value={processKind} 
              onValueChange={(v) => setProcessKind(v as WeldingProcess)}
            >
              <SelectTrigger id="process" data-testid="select-process">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMAW">SMAW (Stick)</SelectItem>
                <SelectItem value="GMAW">GMAW (MIG)</SelectItem>
                <SelectItem value="FCAW">FCAW (Flux-Core)</SelectItem>
                <SelectItem value="GTAW">GTAW (TIG)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volts">Voltage (V)</Label>
              <Input 
                id="volts"
                type="number"
                value={volts}
                onChange={(e) => setVolts(Number(e.target.value))}
                data-testid="input-volts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amps">Amperage (A)</Label>
              <Input 
                id="amps"
                type="number"
                value={amps}
                onChange={(e) => setAmps(Number(e.target.value))}
                data-testid="input-amps"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed">Travel Speed (in/min)</Label>
            <Input 
              id="speed"
              type="number"
              value={travelSpeedInPerMin}
              onChange={(e) => setTravelSpeedInPerMin(Number(e.target.value))}
              data-testid="input-speed"
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="joint">Joint Type</Label>
            <Select 
              value={jointType} 
              onValueChange={(v) => setJointType(v as JointType)}
            >
              <SelectTrigger id="joint" data-testid="select-joint-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="butt">Butt Joint</SelectItem>
                <SelectItem value="lap">Lap Joint</SelectItem>
                <SelectItem value="tee">T-Joint</SelectItem>
                <SelectItem value="corner">Corner Joint</SelectItem>
                <SelectItem value="edge">Edge Joint</SelectItem>
                <SelectItem value="groove">Groove</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thickness">Thickness (inches)</Label>
            <Input 
              id="thickness"
              type="number"
              step="0.0625"
              value={jointThicknessInches}
              onChange={(e) => setJointThicknessInches(Number(e.target.value))}
              data-testid="input-thickness"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aws">AWS Code</Label>
            <Select 
              value={awsCode} 
              onValueChange={(v) => setAwsCode(v as AwsCategory)}
            >
              <SelectTrigger id="aws" data-testid="select-aws-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="D1.1">D1.1 (Steel)</SelectItem>
                <SelectItem value="D1.2">D1.2 (Aluminum)</SelectItem>
                <SelectItem value="D1.6">D1.6 (Stainless)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button className="flex-1" onClick={handleRun} data-testid="button-mark-sim-run">
              <Play className="h-4 w-4 mr-2" /> Mark Run
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="md:col-span-8" data-testid="card-welding-results">
        <CardHeader>
          <CardTitle className="text-sm">Weld Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {"error" in results ? (
            <Alert variant="destructive" data-testid="alert-eval-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Evaluation Error</AlertTitle>
              <AlertDescription>{(results.error as EvalError).error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    results.hiClass === "cold" ? "bg-blue-100 text-blue-600" :
                    results.hiClass === "hot" ? "bg-orange-100 text-orange-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Heat Input</div>
                    <div className="text-xl font-bold font-mono">
                      {results.hiKJ.toFixed(2)} <span className="text-sm font-normal">kJ/mm</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className={`${
                    results.hiClass === "cold" ? "bg-blue-500" :
                    results.hiClass === "hot" ? "bg-orange-500" :
                    "bg-green-500"
                  } hover:opacity-90`}
                  data-testid="badge-heat-input-class"
                >
                  {results.hiClass.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Cross-Section Visualization</Label>
                {renderSVG()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WPS Compliance</Label>
                  <Alert 
                    variant={results.spec.pass ? "default" : "destructive"}
                    className={results.spec.pass ? "border-green-200 bg-green-50" : ""}
                    data-testid="alert-wps-status"
                  >
                    {results.spec.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{results.spec.pass ? "Within Spec" : "Out of Spec"}</AlertTitle>
                    <AlertDescription className="text-xs">
                      <ul className="list-disc pl-4 mt-1">
                        {results.spec.notes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label>Tips & Diagnostics</Label>
                  <div className="text-sm border rounded-lg p-3 bg-slate-50 text-slate-700">
                    <p className="font-medium mb-1">Observation:</p>
                    <p data-testid="text-welding-tips">
                      Travel speed of {travelSpeedInPerMin} in/min at {amps}A·{volts}V 
                      gives {results.hiKJ.toFixed(2)} kJ/mm — 
                      {results.spec.pass ? "which is within" : "exceeds or falls below"} {awsCode} limits for {jointThicknessInches} in. base metal.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WeldingCanvas;
