import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const W = 720;
const H = 340;
const CHORD = 280;
const CX = W / 2;
const CY = H / 2 + 10;

function liftCoefficient(alphaDeg: number): { cl: number; stalled: boolean } {
  if (alphaDeg <= 14) return { cl: 0.1 * alphaDeg + 0.3, stalled: false };
  if (alphaDeg <= 16) return { cl: 1.7, stalled: false };
  if (alphaDeg <= 25) return { cl: Math.max(0.5, 1.7 - (alphaDeg - 16) * 0.13), stalled: true };
  return { cl: 0.5, stalled: true };
}

function airfoilPath(alphaRad: number): string {
  const pts: Array<[number, number]> = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = t * CHORD - CHORD / 2;
    const camber = 12 * Math.sin(Math.PI * t);
    const thickness = 28 * Math.sin(Math.PI * t) * (1 - 0.4 * t);
    pts.push([x, -camber - thickness / 2]);
  }
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const x = t * CHORD - CHORD / 2;
    const camber = 12 * Math.sin(Math.PI * t);
    const thickness = 28 * Math.sin(Math.PI * t) * (1 - 0.4 * t);
    pts.push([x, -camber + thickness / 2]);
  }
  const cos = Math.cos(alphaRad);
  const sin = Math.sin(alphaRad);
  const rotated = pts.map(([x, y]) => {
    const xr = x * cos - y * sin + CX;
    const yr = x * sin + y * cos + CY;
    return `${xr.toFixed(1)},${yr.toFixed(1)}`;
  });
  return `M ${rotated.join(" L ")} Z`;
}

export function WingSim({ className }: { className?: string }) {
  const [alpha, setAlpha] = useState(6);
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setPhase((p) => (p + dt * 1.5) % 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, []);

  const alphaRad = (alpha * Math.PI) / 180;
  const { cl, stalled } = liftCoefficient(alpha);
  const lift = cl * 100;
  const cos = Math.cos(alphaRad);
  const sin = Math.sin(alphaRad);

  const streamlines: JSX.Element[] = [];
  const rows = 7;
  for (let r = 0; r < rows; r++) {
    const yOff = (r - (rows - 1) / 2) * 38;
    const above = yOff < 0;
    const dashes = stalled && above ? "4 4" : "0";
    const path = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const baseX = -W / 2 + t * W;
      let baseY = yOff;
      const localT = (baseX + W / 2) / W;
      const proximity = 1 - Math.min(1, Math.abs(baseX) / (CHORD / 2 + 60));
      if (above) baseY -= proximity * (8 + cl * 14);
      else baseY += proximity * (4 + cl * 6) * 0.5;
      if (stalled && above && proximity > 0.3) baseY += Math.sin((localT + phase) * 18) * 8;
      const xr = baseX * cos - baseY * sin + CX;
      const yr = baseX * sin + baseY * cos + CY;
      path.push(`${xr.toFixed(1)},${yr.toFixed(1)}`);
    }
    streamlines.push(
      <path
        key={r}
        d={`M ${path.join(" L ")}`}
        fill="none"
        stroke={above ? "#0ea5e9" : "#64748b"}
        strokeWidth="1.5"
        strokeDasharray={dashes}
        opacity={above ? 0.85 : 0.6}
      />,
    );
    const tickerCount = 6;
    for (let k = 0; k < tickerCount; k++) {
      const tt = (k / tickerCount + phase * (above ? 1 + cl * 0.3 : 0.7)) % 1;
      const baseX = -W / 2 + tt * W;
      let baseY = yOff;
      const proximity = 1 - Math.min(1, Math.abs(baseX) / (CHORD / 2 + 60));
      if (above) baseY -= proximity * (8 + cl * 14);
      else baseY += proximity * (4 + cl * 6) * 0.5;
      if (stalled && above && proximity > 0.3) baseY += Math.sin((tt + phase) * 18) * 8;
      const xr = baseX * cos - baseY * sin + CX;
      const yr = baseX * sin + baseY * cos + CY;
      streamlines.push(
        <circle key={`t-${r}-${k}`} cx={xr} cy={yr} r="2.5" fill={above ? "#0ea5e9" : "#64748b"} opacity={above ? 0.9 : 0.6} />,
      );
    }
  }

  return (
    <div className={cn("w-full", className)} data-testid="wing-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Airfoil cross-section with streamlines showing lift and stall as angle of attack changes.">
          <defs>
            <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#sky3)" />

          {streamlines}

          <path d={airfoilPath(alphaRad)} fill="#1e293b" stroke="#0f172a" strokeWidth="2" />

          <g transform={`translate(${CX}, ${CY - 60 - cl * 30})`} opacity={stalled ? 0.4 : 1}>
            <line x1="0" y1="0" x2="0" y2={40 + lift * 0.6} stroke="#16a34a" strokeWidth="3" markerEnd="url(#liftArrow)" />
            <text x="8" y="20" fontSize="11" fill="#15803d" fontWeight="bold">LIFT</text>
          </g>
          <defs>
            <marker id="liftArrow" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <polygon points="0,10 5,0 10,10" fill="#16a34a" />
            </marker>
          </defs>

          <g transform="translate(40, 30)">
            <rect x="-8" y="-8" width="160" height="80" fill="white" opacity="0.95" rx="6" stroke="#cbd5e1" />
            <text x="0" y="6" fontSize="10" fill="#64748b">Angle of attack</text>
            <text x="0" y="22" fontSize="18" fill="#1e293b" fontWeight="bold">{alpha.toFixed(1)}°</text>
            <text x="0" y="38" fontSize="10" fill="#64748b">Lift coefficient (Cl)</text>
            <text x="0" y="54" fontSize="14" fill={stalled ? "#dc2626" : "#15803d"} fontWeight="bold">{cl.toFixed(2)}</text>
            {stalled && <text x="0" y="68" fontSize="11" fill="#dc2626" fontWeight="bold">⚠ STALLED</text>}
          </g>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="text-xs flex items-center justify-between mb-1">
            <span>Angle of attack (α)</span>
            <span className="font-mono">{alpha.toFixed(1)}°</span>
          </div>
          <Slider value={[alpha]} onValueChange={(v) => setAlpha(v[0] ?? 6)} min={-4} max={25} step={0.2} data-testid="slider-alpha" />
          <div className="text-[10px] text-muted-foreground mt-2 flex justify-between">
            <span>-4° (slight push down)</span>
            <span className="text-amber-700">~14° (peak lift)</span>
            <span className="text-red-700">16°+ (stall)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Camber</div><div className="text-muted-foreground mt-1">The curve. Air going over the top has farther to go.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Pressure</div><div className="text-muted-foreground mt-1">Faster air = lower pressure. The wing gets sucked upward.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Angle of attack</div><div className="text-muted-foreground mt-1">More tilt = more lift, up to a point.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Stall</div><div className="text-muted-foreground mt-1">Past ~16° the air stops staying glued to the top. Lift falls off a cliff.</div></div>
      </div>
    </div>
  );
}
