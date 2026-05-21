import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 720;
const H = 360;
const CORE_X = 220;
const CORE_Y = 60;
const CORE_W = 280;
const CORE_H = 240;
const COIL_W = 36;

export function TransformerSim({ className }: { className?: string }) {
  const [v1, setV1] = useState(120);
  const [n1, setN1] = useState(100);
  const [n2, setN2] = useState(50);
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setPhase((p) => (p + 2 * Math.PI * 1.2 * dt) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [playing]);

  const ratio = n2 / n1;
  const v2 = v1 * ratio;
  const i1Rel = Math.sin(phase);
  const i2Rel = Math.sin(phase + Math.PI);
  const fluxOpacity = 0.3 + 0.7 * Math.abs(Math.sin(phase));

  const renderCoil = (cx: number, turns: number, current: number) => {
    const visibleTurns = Math.min(20, Math.max(4, Math.round(turns / 8)));
    const spacing = CORE_H / (visibleTurns + 1);
    const arrows: JSX.Element[] = [];
    for (let i = 0; i < visibleTurns; i++) {
      const y = CORE_Y + spacing * (i + 1);
      arrows.push(
        <ellipse
          key={`c-${i}`}
          cx={cx}
          cy={y}
          rx={COIL_W / 2}
          ry={spacing * 0.35}
          fill="none"
          stroke="#b45309"
          strokeWidth="2.5"
        />,
      );
    }
    const arrowDir = current >= 0 ? 1 : -1;
    const arrowMag = Math.abs(current);
    arrows.push(
      <g key="curr-arrows" opacity={0.3 + 0.7 * arrowMag}>
        {[0.2, 0.5, 0.8].map((f) => (
          <polygon
            key={f}
            points={`${cx - 4},${CORE_Y + CORE_H * f - 6 * arrowDir} ${cx + 4},${CORE_Y + CORE_H * f - 6 * arrowDir} ${cx},${CORE_Y + CORE_H * f + 6 * arrowDir}`}
            fill="#dc2626"
          />
        ))}
      </g>,
    );
    return arrows;
  };

  return (
    <div className={cn("w-full", className)} data-testid="transformer-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Transformer with primary and secondary coils around a laminated iron core.">
          <defs>
            <linearGradient id="iron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="#f8fafc" />

          <rect x={CORE_X} y={CORE_Y} width={CORE_W} height={40} fill="url(#iron)" stroke="#1e293b" strokeWidth="2" />
          <rect x={CORE_X} y={CORE_Y + CORE_H - 40} width={CORE_W} height={40} fill="url(#iron)" stroke="#1e293b" strokeWidth="2" />
          <rect x={CORE_X} y={CORE_Y} width={40} height={CORE_H} fill="url(#iron)" stroke="#1e293b" strokeWidth="2" />
          <rect x={CORE_X + CORE_W - 40} y={CORE_Y} width={40} height={CORE_H} fill="url(#iron)" stroke="#1e293b" strokeWidth="2" />

          {[80, 130, 180].map((y) => (
            <ellipse
              key={`flux-${y}`}
              cx={CORE_X + CORE_W / 2}
              cy={CORE_Y + CORE_H / 2}
              rx={CORE_W / 2 - 50}
              ry={CORE_H / 2 - 40}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity={fluxOpacity}
            />
          ))}
          <text x={CORE_X + CORE_W / 2} y={CORE_Y + CORE_H / 2 + 4} textAnchor="middle" fontSize="11" fill="#7c3aed" opacity={fluxOpacity}>
            magnetic flux
          </text>

          {renderCoil(CORE_X + 20, n1, i1Rel)}
          {renderCoil(CORE_X + CORE_W - 20, n2, i2Rel)}

          <line x1="40" y1="160" x2={CORE_X + 20 - COIL_W / 2 - 4} y2="160" stroke="#1e293b" strokeWidth="2" />
          <line x1="40" y1="200" x2={CORE_X + 20 - COIL_W / 2 - 4} y2="200" stroke="#1e293b" strokeWidth="2" />
          <text x="40" y="150" fontSize="11" fill="#1e293b" fontWeight="bold">PRIMARY</text>
          <text x="40" y="220" fontSize="11" fill="#1e293b">{v1.toFixed(0)} V · {n1} turns</text>

          <line x1={CORE_X + CORE_W - 20 + COIL_W / 2 + 4} y1="160" x2={W - 40} y2="160" stroke="#1e293b" strokeWidth="2" />
          <line x1={CORE_X + CORE_W - 20 + COIL_W / 2 + 4} y1="200" x2={W - 40} y2="200" stroke="#1e293b" strokeWidth="2" />
          <text x={W - 40} y="150" textAnchor="end" fontSize="11" fill="#1e293b" fontWeight="bold">SECONDARY</text>
          <text x={W - 40} y="220" textAnchor="end" fontSize="11" fill="#1e293b">{v2.toFixed(1)} V · {n2} turns</text>

          <rect x="20" y="240" width={W - 40} height="50" fill="#fef3c7" stroke="#d97706" strokeWidth="1" rx="4" />
          <text x="30" y="262" fontSize="12" fill="#78350f" fontWeight="bold">V₂ = V₁ × (N₂ / N₁)</text>
          <text x="30" y="282" fontSize="12" fill="#78350f" fontFamily="monospace">
            {v2.toFixed(1)} V = {v1} V × ({n2} / {n1}) = {v1} V × {ratio.toFixed(3)}
          </text>
          <text x={W - 30} y="262" textAnchor="end" fontSize="11" fill="#78350f">{ratio < 1 ? "STEP-DOWN" : ratio > 1 ? "STEP-UP" : "1:1 ISOLATION"}</text>
          <text x={W - 30} y="282" textAnchor="end" fontSize="10" fill="#78350f">current scales inverse: I₂ = I₁ × (N₁/N₂)</text>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <Button size="sm" variant={playing ? "default" : "secondary"} onClick={() => setPlaying((p) => !p)} data-testid="button-play-pause">
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"} AC
          </Button>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Primary V₁</span><span className="font-mono">{v1} V</span></div>
            <Slider value={[v1]} onValueChange={(v) => setV1(v[0] ?? 120)} min={12} max={480} step={4} data-testid="slider-v1" />
          </div>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Turns ratio (N₁:N₂)</span><span className="font-mono">{n1}:{n2}</span></div>
            <Slider
              value={[Math.log2(n1 / n2)]}
              onValueChange={(v) => {
                const r = Math.pow(2, v[0] ?? 1);
                if (r >= 1) {
                  setN1(Math.round(100 * r));
                  setN2(100);
                } else {
                  setN1(100);
                  setN2(Math.round(100 / r));
                }
              }}
              min={-4}
              max={4}
              step={0.1}
              data-testid="slider-ratio"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Step-down</div><div className="text-muted-foreground mt-1">N₁ &gt; N₂ — drop the wall voltage to USB-C levels.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Step-up</div><div className="text-muted-foreground mt-1">N₂ &gt; N₁ — push 12 kV onto a transmission line.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Isolation</div><div className="text-muted-foreground mt-1">1:1 — same voltage, no metal path between circuits.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">The trade</div><div className="text-muted-foreground mt-1">Whatever you gain in voltage, you give up in current. Power stays roughly the same.</div></div>
      </div>
    </div>
  );
}
