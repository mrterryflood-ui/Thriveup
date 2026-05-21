import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 720;
const H = 340;
const CELL_X = 100;
const CELL_Y = 80;
const CELL_W = 520;
const CELL_H = 180;
const SEP_X = CELL_X + CELL_W / 2;
const ION_COUNT = 22;

interface Ion {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function BatterySim({ className }: { className?: string }) {
  const [mode, setMode] = useState<"charge" | "discharge">("discharge");
  const [rate, setRate] = useState(1);
  const [soc, setSoc] = useState(0.75);
  const ionsRef = useRef<Ion[]>([]);
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  if (ionsRef.current.length === 0) {
    for (let i = 0; i < ION_COUNT; i++) {
      ionsRef.current.push({
        x: CELL_X + 30 + Math.random() * (CELL_W - 60),
        y: CELL_Y + 20 + Math.random() * (CELL_H - 40),
        vx: 0,
        vy: 0,
      });
    }
  }

  useEffect(() => {
    const step = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      const dir = mode === "charge" ? -1 : 1;
      const speed = 40 * rate;
      for (const ion of ionsRef.current) {
        ion.vx = dir * speed + (Math.random() - 0.5) * 10;
        ion.vy += (Math.random() - 0.5) * 30 * dt;
        ion.vy *= 0.95;
        ion.x += ion.vx * dt;
        ion.y += ion.vy * dt;
        if (ion.x < CELL_X + 30) ion.x = CELL_X + CELL_W - 30;
        if (ion.x > CELL_X + CELL_W - 30) ion.x = CELL_X + 30;
        if (ion.y < CELL_Y + 20) ion.y = CELL_Y + 20;
        if (ion.y > CELL_Y + CELL_H - 20) ion.y = CELL_Y + CELL_H - 20;
      }
      setSoc((s) => {
        const delta = dir === -1 ? 0.04 : -0.04;
        const next = s + delta * rate * dt;
        return Math.max(0, Math.min(1, next));
      });
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [mode, rate]);

  const voltage = 3.0 + 1.2 * soc;
  const electronArrowX = mode === "charge" ? "M 50 50 L 100 50" : "M 100 50 L 50 50";
  const externalY = 30;

  return (
    <div className={cn("w-full", className)} data-testid="battery-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Lithium-ion cell with anode, separator, and cathode showing ion movement and external electron flow.">
          <rect x="0" y="0" width={W} height={H} fill="#f8fafc" />

          <line x1={CELL_X} y1={CELL_Y} x2={CELL_X} y2={externalY + 20} stroke="#1e293b" strokeWidth="3" />
          <line x1={CELL_X + CELL_W} y1={CELL_Y} x2={CELL_X + CELL_W} y2={externalY + 20} stroke="#1e293b" strokeWidth="3" />
          <line x1={CELL_X} y1={externalY + 20} x2={CELL_X + CELL_W / 2 - 50} y2={externalY + 20} stroke="#1e293b" strokeWidth="3" />
          <line x1={CELL_X + CELL_W / 2 + 50} y1={externalY + 20} x2={CELL_X + CELL_W} y2={externalY + 20} stroke="#1e293b" strokeWidth="3" />

          <rect x={CELL_X + CELL_W / 2 - 50} y={externalY} width="100" height="40" fill="#fde68a" stroke="#d97706" strokeWidth="2" rx="4" />
          <text x={CELL_X + CELL_W / 2} y={externalY + 25} textAnchor="middle" fontSize="11" fill="#78350f" fontWeight="bold">
            {mode === "charge" ? "Charger" : "Load (your phone)"}
          </text>

          {[0.2, 0.5, 0.8].map((f) => (
            <g key={f} transform={`translate(${CELL_X + CELL_W * f - 20}, ${externalY + 14})`} opacity={0.4 + 0.6 * Math.abs(Math.sin((tick + f * 40) / 6))}>
              <text fontSize="13" fill="#0ea5e9" fontWeight="bold">e⁻</text>
              {mode === "charge" ? <ArrowLeft x="12" y="-9" width="14" height="14" color="#0ea5e9" /> : <ArrowRight x="12" y="-9" width="14" height="14" color="#0ea5e9" />}
            </g>
          ))}

          <rect x={CELL_X} y={CELL_Y} width={CELL_W / 2 - 4} height={CELL_H} fill="#1f2937" opacity="0.85" stroke="#0f172a" strokeWidth="2" />
          <text x={CELL_X + 12} y={CELL_Y + 18} fontSize="11" fill="#fef3c7" fontWeight="bold">ANODE</text>
          <text x={CELL_X + 12} y={CELL_Y + 32} fontSize="9" fill="#fef3c7">graphite (Li intercalation)</text>

          <rect x={SEP_X - 6} y={CELL_Y} width="12" height={CELL_H} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <text x={SEP_X} y={CELL_Y + CELL_H + 14} textAnchor="middle" fontSize="9" fill="#64748b">separator + electrolyte</text>

          <rect x={CELL_X + CELL_W / 2 + 4} y={CELL_Y} width={CELL_W / 2 - 4} height={CELL_H} fill="#7c2d12" opacity="0.85" stroke="#431407" strokeWidth="2" />
          <text x={CELL_X + CELL_W - 12} y={CELL_Y + 18} textAnchor="end" fontSize="11" fill="#fef3c7" fontWeight="bold">CATHODE</text>
          <text x={CELL_X + CELL_W - 12} y={CELL_Y + 32} textAnchor="end" fontSize="9" fill="#fef3c7">LiCoO₂ / LiFePO₄</text>

          {ionsRef.current.map((ion, i) => (
            <g key={i}>
              <circle cx={ion.x} cy={ion.y} r="6" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
              <text x={ion.x} y={ion.y + 3} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Li⁺</text>
            </g>
          ))}

          <rect x={CELL_X} y={CELL_Y + CELL_H + 30} width={CELL_W} height="14" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="3" />
          <rect x={CELL_X} y={CELL_Y + CELL_H + 30} width={CELL_W * soc} height="14" fill={soc > 0.2 ? "#22c55e" : "#dc2626"} rx="3" />
          <text x={CELL_X + 8} y={CELL_Y + CELL_H + 41} fontSize="10" fill="#1e293b" fontWeight="bold">State of Charge: {(soc * 100).toFixed(0)}%</text>
          <text x={CELL_X + CELL_W - 8} y={CELL_Y + CELL_H + 41} textAnchor="end" fontSize="10" fill="#1e293b" fontWeight="bold">{voltage.toFixed(2)} V</text>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "discharge" ? "default" : "outline"} onClick={() => setMode("discharge")} data-testid="button-discharge">Discharge</Button>
            <Button size="sm" variant={mode === "charge" ? "default" : "outline"} onClick={() => setMode("charge")} data-testid="button-charge">Charge</Button>
          </div>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Rate</span><span className="font-mono">{rate.toFixed(1)}× C</span></div>
            <Slider value={[rate]} onValueChange={(v) => setRate(v[0] ?? 1)} min={0.2} max={3} step={0.1} data-testid="slider-rate" />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSoc(0.75)} data-testid="button-reset-soc">Reset to 75%</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Anode</div><div className="text-muted-foreground mt-1">Where lithium hides between graphite sheets when charged.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Cathode</div><div className="text-muted-foreground mt-1">Where lithium ends up when the battery is empty.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Separator</div><div className="text-muted-foreground mt-1">Lets ions pass, blocks electrons. The whole reason the cell works.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">External circuit</div><div className="text-muted-foreground mt-1">Electrons have to take the long way around — through your device.</div></div>
      </div>
    </div>
  );
}
