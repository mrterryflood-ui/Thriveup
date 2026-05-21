import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 720;
const H = 420;
const TOWER_X = 320;
const HUB_Y = 130;
const TOWER_BASE_Y = 380;
const BLADE_LENGTH = 110;
const RHO = 1.225;
const ROTOR_R = 50;
const SWEPT_AREA = Math.PI * ROTOR_R * ROTOR_R;
const CP_MAX = 0.42;
const CUT_IN = 3;
const RATED_WIND = 12;
const CUT_OUT = 25;
const RATED_POWER_W = 0.5 * RHO * SWEPT_AREA * RATED_WIND ** 3 * CP_MAX;

function computePower(wind: number, pitchDeg: number): number {
  if (wind < CUT_IN) return 0;
  if (wind >= CUT_OUT) return 0;
  const pitchEffect = Math.cos((pitchDeg * Math.PI) / 180) ** 2;
  const raw = 0.5 * RHO * SWEPT_AREA * wind ** 3 * CP_MAX * pitchEffect;
  return Math.min(raw, RATED_POWER_W);
}

export function WindTurbineSim({ className }: { className?: string }) {
  const [wind, setWind] = useState(10);
  const [pitch, setPitch] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [bladePhase, setBladePhase] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const effectivePitch = wind >= CUT_OUT ? 90 : wind > RATED_WIND ? Math.min(90, pitch + (wind - RATED_WIND) * 4) : pitch;
  const power = computePower(wind, effectivePitch);
  const rpm = wind < CUT_IN || wind >= CUT_OUT ? 0 : Math.min(22, wind * 1.6 * Math.cos((effectivePitch * Math.PI) / 180));

  useEffect(() => {
    if (!playing) return;
    const tick = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setBladePhase((p) => (p + (rpm / 60) * 2 * Math.PI * dt) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [playing, rpm]);

  let status: { label: string; color: string };
  if (wind < CUT_IN) status = { label: "BELOW CUT-IN", color: "#64748b" };
  else if (wind >= CUT_OUT) status = { label: "FEATHERED (storm)", color: "#dc2626" };
  else if (power >= RATED_POWER_W * 0.98) status = { label: "AT RATED POWER", color: "#16a34a" };
  else status = { label: "GENERATING", color: "#0ea5e9" };

  return (
    <div className={cn("w-full", className)} data-testid="wind-turbine-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Wind turbine with adjustable wind speed and blade pitch.">
          <defs>
            <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={TOWER_BASE_Y} fill="url(#sky4)" />
          <rect x="0" y={TOWER_BASE_Y} width={W} height={H - TOWER_BASE_Y} fill="#84cc16" />

          {Array.from({ length: Math.min(10, Math.round(wind))}, (_, i) => {
            const y = 50 + i * 32;
            const phase = (Date.now() / 100 + i * 30) % 600;
            return (
              <g key={i}>
                <line x1={phase - 80} y1={y} x2={phase} y2={y} stroke="#0ea5e9" strokeWidth="1.5" opacity="0.5" />
                <polygon points={`${phase},${y} ${phase - 8},${y - 3} ${phase - 8},${y + 3}`} fill="#0ea5e9" opacity="0.6" />
              </g>
            );
          })}

          <polygon points={`${TOWER_X - 14},${TOWER_BASE_Y} ${TOWER_X - 5},${HUB_Y + 10} ${TOWER_X + 5},${HUB_Y + 10} ${TOWER_X + 14},${TOWER_BASE_Y}`} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <rect x={TOWER_X - 18} y={HUB_Y - 12} width="40" height="24" fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="3" />

          <g transform={`translate(${TOWER_X + 2}, ${HUB_Y}) rotate(${(bladePhase * 180) / Math.PI})`}>
            {[0, 120, 240].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const tipX = Math.cos(rad) * BLADE_LENGTH;
              const tipY = Math.sin(rad) * BLADE_LENGTH;
              const perpX = -Math.sin(rad);
              const perpY = Math.cos(rad);
              const widthAtBase = 14 * Math.cos((effectivePitch * Math.PI) / 180) + 2;
              return (
                <polygon
                  key={deg}
                  points={`${-perpX * widthAtBase},${-perpY * widthAtBase} ${tipX + perpX * 2},${tipY + perpY * 2} ${tipX - perpX * 2},${tipY - perpY * 2} ${perpX * widthAtBase},${perpY * widthAtBase}`}
                  fill="#f8fafc"
                  stroke="#475569"
                  strokeWidth="2"
                />
              );
            })}
            <circle r="6" fill="#475569" />
          </g>

          <g transform="translate(40, 30)">
            <rect x="-8" y="-8" width="200" height="120" fill="white" opacity="0.95" rx="6" stroke="#cbd5e1" />
            <text x="0" y="6" fontSize="10" fill="#64748b">Power output</text>
            <text x="0" y="26" fontSize="22" fill="#1e293b" fontWeight="bold" fontFamily="monospace">
              {(power / 1e6).toFixed(2)} MW
            </text>
            <text x="0" y="40" fontSize="9" fill="#64748b">of {(RATED_POWER_W / 1e6).toFixed(1)} MW rated</text>
            <text x="0" y="60" fontSize="10" fill="#64748b">Rotor speed</text>
            <text x="0" y="76" fontSize="14" fill="#1e293b" fontWeight="bold" fontFamily="monospace">
              {rpm.toFixed(1)} rpm
            </text>
            <text x="0" y="98" fontSize="11" fill={status.color} fontWeight="bold">{status.label}</text>
          </g>

          <g transform={`translate(${W - 220}, 30)`}>
            <rect x="-8" y="-8" width="220" height="80" fill="white" opacity="0.95" rx="6" stroke="#cbd5e1" />
            <text x="0" y="6" fontSize="10" fill="#64748b">Formula</text>
            <text x="0" y="22" fontSize="11" fill="#1e293b" fontFamily="monospace">P = ½ · ρ · A · v³ · Cp</text>
            <text x="0" y="38" fontSize="9" fill="#64748b">ρ = 1.225 kg/m³ (air)</text>
            <text x="0" y="50" fontSize="9" fill="#64748b">A = π · {ROTOR_R}² ≈ {SWEPT_AREA.toFixed(0)} m²</text>
            <text x="0" y="62" fontSize="9" fill="#64748b">v = {wind.toFixed(1)} m/s · Cp(eff) = {(CP_MAX * Math.cos((effectivePitch * Math.PI) / 180) ** 2).toFixed(2)}</text>
          </g>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <Button size="sm" variant={playing ? "default" : "secondary"} onClick={() => setPlaying((p) => !p)} data-testid="button-play-pause">
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Wind speed (v)</span><span className="font-mono">{wind.toFixed(1)} m/s</span></div>
            <Slider value={[wind]} onValueChange={(v) => setWind(v[0] ?? 10)} min={0} max={30} step={0.5} data-testid="slider-wind" />
          </div>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Blade pitch</span><span className="font-mono">{effectivePitch.toFixed(0)}°{wind > RATED_WIND ? " (auto)" : ""}</span></div>
            <Slider value={[pitch]} onValueChange={(v) => setPitch(v[0] ?? 0)} min={0} max={90} step={1} data-testid="slider-pitch" disabled={wind >= CUT_OUT} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Cut-in (3 m/s)</div><div className="text-muted-foreground mt-1">Below this the rotor barely overcomes friction. Brake stays on.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">v³ scaling</div><div className="text-muted-foreground mt-1">Double the wind = 8× the power. That's why siting matters so much.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Rated wind (~12)</div><div className="text-muted-foreground mt-1">Past here, blades pitch to cap power. The generator can't take more.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Cut-out (25 m/s)</div><div className="text-muted-foreground mt-1">Storm protection. Feather the blades, stop the rotor, ride it out.</div></div>
      </div>
    </div>
  );
}
