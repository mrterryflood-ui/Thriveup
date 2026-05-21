import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

const W = 720;
const H = 360;
const DECK_Y = 250;
const TOWER_TOP_Y = 70;
const LEFT_TOWER_X = 120;
const RIGHT_TOWER_X = 600;
const SPAN = RIGHT_TOWER_X - LEFT_TOWER_X;

const DEAD_LOAD_KN = 8000;
const TRUCK_LOAD_KN = 600;
const H_TENSION_BASE_KN = 12000;

function cableY(x: number, sag: number): number {
  const t = (x - LEFT_TOWER_X) / SPAN;
  return TOWER_TOP_Y + 4 * sag * t * (1 - t);
}

export function BridgeSim({ className }: { className?: string }) {
  const [truckPos, setTruckPos] = useState(0.5);
  const [trucks, setTrucks] = useState(1);

  const totalLoad = DEAD_LOAD_KN + trucks * TRUCK_LOAD_KN;
  const sag = 60 + (totalLoad - DEAD_LOAD_KN) * 0.015;

  const liveLoad = trucks * TRUCK_LOAD_KN;
  const reactionLeft = DEAD_LOAD_KN / 2 + liveLoad * (1 - truckPos);
  const reactionRight = DEAD_LOAD_KN / 2 + liveLoad * truckPos;
  const horizontalTension = H_TENSION_BASE_KN * (1 + (totalLoad - DEAD_LOAD_KN) / DEAD_LOAD_KN * 0.4);
  const tensionLeftCable = Math.sqrt(horizontalTension ** 2 + reactionLeft ** 2);
  const tensionRightCable = Math.sqrt(horizontalTension ** 2 + reactionRight ** 2);

  const maxAllowable = 22000;
  const stressLeft = Math.min(1, reactionLeft / maxAllowable);
  const stressRight = Math.min(1, reactionRight / maxAllowable);
  const towerColor = (s: number) => {
    if (s < 0.5) return "#16a34a";
    if (s < 0.8) return "#f59e0b";
    return "#dc2626";
  };

  const truckX = LEFT_TOWER_X + SPAN * truckPos;
  const truckY = DECK_Y - 10;

  const cablePath = (() => {
    const points: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = LEFT_TOWER_X + (SPAN * i) / 40;
      points.push(`${x},${cableY(x, sag)}`);
    }
    return `M ${points.join(" L ")}`;
  })();

  return (
    <div className={cn("w-full", className)} data-testid="bridge-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Suspension bridge with two towers, main cable, deck, and an adjustable truck load.">
          <defs>
            <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={W} height={DECK_Y + 20} fill="url(#sky2)" />
          <rect x="0" y={DECK_Y + 20} width={W} height={H - DECK_Y - 20} fill="url(#water)" opacity="0.7" />

          <rect x={LEFT_TOWER_X - 10} y={TOWER_TOP_Y} width="20" height={DECK_Y + 20 - TOWER_TOP_Y} fill={towerColor(stressLeft)} stroke="#1e293b" strokeWidth="2" />
          <rect x={RIGHT_TOWER_X - 10} y={TOWER_TOP_Y} width="20" height={DECK_Y + 20 - TOWER_TOP_Y} fill={towerColor(stressRight)} stroke="#1e293b" strokeWidth="2" />

          <line x1={LEFT_TOWER_X} y1={TOWER_TOP_Y} x2="20" y2={DECK_Y + 30} stroke="#1f2937" strokeWidth="3" />
          <line x1={RIGHT_TOWER_X} y1={TOWER_TOP_Y} x2={W - 20} y2={DECK_Y + 30} stroke="#1f2937" strokeWidth="3" />

          <path d={cablePath} fill="none" stroke="#1f2937" strokeWidth="4" />

          {Array.from({ length: 11 }, (_, i) => {
            const x = LEFT_TOWER_X + (SPAN * i) / 10;
            return <line key={i} x1={x} y1={cableY(x, sag)} x2={x} y2={DECK_Y} stroke="#475569" strokeWidth="1.5" />;
          })}

          <rect x={LEFT_TOWER_X - 10} y={DECK_Y} width={SPAN + 20} height="12" fill="#334155" stroke="#0f172a" strokeWidth="2" />

          {Array.from({ length: trucks }, (_, i) => {
            const offset = (i - (trucks - 1) / 2) * 50;
            return (
              <g key={i} transform={`translate(${truckX + offset - 20}, ${truckY - 18})`}>
                <rect width="40" height="22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" rx="2" />
                <circle cx="10" cy="22" r="4" fill="#1f2937" />
                <circle cx="30" cy="22" r="4" fill="#1f2937" />
              </g>
            );
          })}

          <g transform={`translate(${LEFT_TOWER_X - 60}, ${TOWER_TOP_Y - 10})`}>
            <rect x="-4" y="0" width="78" height="36" fill="white" opacity="0.92" rx="4" stroke="#cbd5e1" />
            <text x="0" y="12" fontSize="9" fill="#1e293b" fontWeight="bold">Left tower</text>
            <text x="0" y="24" fontSize="9" fill="#1e293b">{reactionLeft.toFixed(0)} kN</text>
            <text x="0" y="34" fontSize="8" fill="#64748b">cable: {tensionLeftCable.toFixed(0)}</text>
          </g>
          <g transform={`translate(${RIGHT_TOWER_X - 16}, ${TOWER_TOP_Y - 10})`}>
            <rect x="-4" y="0" width="78" height="36" fill="white" opacity="0.92" rx="4" stroke="#cbd5e1" />
            <text x="0" y="12" fontSize="9" fill="#1e293b" fontWeight="bold">Right tower</text>
            <text x="0" y="24" fontSize="9" fill="#1e293b">{reactionRight.toFixed(0)} kN</text>
            <text x="0" y="34" fontSize="8" fill="#64748b">cable: {tensionRightCable.toFixed(0)}</text>
          </g>

          <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#1e293b">
            horizontal cable tension at midspan: {horizontalTension.toFixed(0)} kN · dead load {DEAD_LOAD_KN} kN · live load {liveLoad} kN
          </text>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Truck position on deck</span><span className="font-mono">{(truckPos * 100).toFixed(0)}%</span></div>
            <Slider value={[truckPos]} onValueChange={(v) => setTruckPos(v[0] ?? 0.5)} min={0.05} max={0.95} step={0.01} data-testid="slider-truck-pos" />
          </div>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1"><Truck className="w-3 h-3" />Trucks on bridge</span><span className="font-mono">{trucks}</span></div>
            <Slider value={[trucks]} onValueChange={(v) => setTrucks(Math.round(v[0] ?? 1))} min={0} max={12} step={1} data-testid="slider-trucks" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Tension</div><div className="text-muted-foreground mt-1">The cables get pulled apart. Steel is great at this.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Compression</div><div className="text-muted-foreground mt-1">The towers get squeezed. Concrete + steel handles it.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Reaction</div><div className="text-muted-foreground mt-1">Move the truck toward a tower — that tower carries more.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Safety factor</div><div className="text-muted-foreground mt-1">Bridges are designed to hold ~3–5× the worst expected load. Green/yellow/red = how close we are.</div></div>
      </div>
    </div>
  );
}
