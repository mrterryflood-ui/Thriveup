import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 720;
const H = 520;
const GROUND_Y = 380;
const PIVOT = { x: 380, y: 180 };
const CRANK = { x: 160, y: 320 };
const CRANK_R = 50;
const L_PITMAN = 210;
const L_TAIL = 140;
const L_HEAD = 200;
const HORSEHEAD_R = 38;

const BASE_RPM = 8;

interface Linkage {
  theta: number;
  T: { x: number; y: number };
  H: { x: number; y: number };
  K: { x: number; y: number };
  CW: { x: number; y: number };
  beamAngleDeg: number;
}

function solveLinkage(theta: number): Linkage {
  const K = {
    x: CRANK.x + CRANK_R * Math.cos(theta),
    y: CRANK.y - CRANK_R * Math.sin(theta),
  };
  const CW = {
    x: CRANK.x - CRANK_R * Math.cos(theta),
    y: CRANK.y + CRANK_R * Math.sin(theta),
  };
  const dx = K.x - PIVOT.x;
  const dy = K.y - PIVOT.y;
  const d = Math.hypot(dx, dy) || 1;
  const a = (L_TAIL * L_TAIL - L_PITMAN * L_PITMAN + d * d) / (2 * d);
  const h2 = Math.max(0, L_TAIL * L_TAIL - a * a);
  const hh = Math.sqrt(h2);
  const mx = PIVOT.x + (a * dx) / d;
  const my = PIVOT.y + (a * dy) / d;
  const px = -dy / d;
  const py = dx / d;
  const t1 = { x: mx + hh * px, y: my + hh * py };
  const t2 = { x: mx - hh * px, y: my - hh * py };
  const T = t1.x < t2.x ? t1 : t2;
  const ux = (PIVOT.x - T.x) / L_TAIL;
  const uy = (PIVOT.y - T.y) / L_TAIL;
  const head = { x: PIVOT.x + L_HEAD * ux, y: PIVOT.y + L_HEAD * uy };
  const beamAngleDeg = (Math.atan2(uy, ux) * 180) / Math.PI;
  return { theta, T, H: head, K, CW, beamAngleDeg };
}

type PartKey =
  | "walkingBeam"
  | "horsehead"
  | "crank"
  | "counterweight"
  | "pitman"
  | "polishedRod"
  | "samsonPost"
  | "wellCasing"
  | "tubing";

const PART_LABEL: Record<PartKey, string> = {
  walkingBeam: "Walking beam",
  horsehead: "Horsehead",
  crank: "Crank",
  counterweight: "Counterweight",
  pitman: "Pitman arm",
  polishedRod: "Polished rod / sucker rod",
  samsonPost: "Samson post",
  wellCasing: "Well casing",
  tubing: "Tubing",
};

const PART_NOTE: Record<PartKey, string> = {
  walkingBeam:
    "The big horizontal lever. The crank rocks one end down so the other end goes up — and back.",
  horsehead:
    "Shaped like a horse's head on purpose. As the beam rocks, the curve keeps the cable hanging perfectly vertical, so the rod beneath it stays straight.",
  crank:
    "Rotates continuously, driven by an electric motor or gas engine. Converts spin into the back-and-forth the beam needs.",
  counterweight:
    "Sits opposite the crank pin. It does about half the lifting work, so the motor doesn't have to fight gravity on every stroke.",
  pitman:
    "The long bar connecting the crank to the tail of the walking beam. Translates rotation into oscillation.",
  polishedRod:
    "A polished steel shaft running into the well. Hundreds of feet of sucker rods are threaded below it down to the pump.",
  samsonPost:
    "The A-frame tower the beam pivots on. Has to be heavy and straight — every stroke pushes on it.",
  wellCasing:
    "Steel pipe lining the wellbore. Keeps the hole from collapsing and isolates the oil zone from groundwater.",
  tubing:
    "Smaller pipe inside the casing. Carries the oil up; the rods run inside it.",
};

interface Props {
  className?: string;
}

export function PumpjackSim({ className }: Props) {
  const [theta, setTheta] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [highlight, setHighlight] = useState<PartKey | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const omega = (BASE_RPM * speed * 2 * Math.PI) / 60;
      setTheta((prev) => (prev + omega * dt) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed]);

  const L = solveLinkage(theta);
  const wellX = PIVOT.x + L_HEAD;
  const rodTopY = L.H.y + HORSEHEAD_R + 6;
  const isHL = (k: PartKey) => highlight === k;
  const hlStyle = (k: PartKey, base: string) =>
    isHL(k) ? "#f59e0b" : base;
  const hlOpacity = (k: PartKey) =>
    highlight == null || isHL(k) ? 1 : 0.45;

  const strokesPerMin = Math.round(BASE_RPM * speed);

  return (
    <div className={cn("w-full", className)} data-testid="pumpjack-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Animated pumpjack mechanism showing crank, walking beam, horsehead, and polished rod in motion."
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="earth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a98467" />
              <stop offset="100%" stopColor="#6b4f3b" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={W} height={GROUND_Y} fill="url(#sky)" />
          <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} fill="url(#earth)" />
          <rect x="0" y={H - 60} width={W} height="60" fill="#1f2937" opacity="0.6" />
          <text x={W - 12} y={H - 24} textAnchor="end" fontSize="11" fill="#fef3c7" opacity="0.9">
            Oil reservoir
          </text>

          <rect
            x={PIVOT.x - 110}
            y={GROUND_Y - 8}
            width={220}
            height={8}
            fill="#475569"
          />

          <g opacity={hlOpacity("samsonPost")}>
            <polygon
              points={`${PIVOT.x - 80},${GROUND_Y - 8} ${PIVOT.x + 80},${GROUND_Y - 8} ${PIVOT.x + 14},${PIVOT.y + 14} ${PIVOT.x - 14},${PIVOT.y + 14}`}
              fill={hlStyle("samsonPost", "#94a3b8")}
              stroke="#334155"
              strokeWidth="2"
            />
            <line
              x1={PIVOT.x - 60}
              y1={GROUND_Y - 100}
              x2={PIVOT.x + 60}
              y2={GROUND_Y - 100}
              stroke="#334155"
              strokeWidth="2"
            />
          </g>

          <g opacity={hlOpacity("crank")}>
            <line
              x1={CRANK.x}
              y1={CRANK.y}
              x2={CRANK.x}
              y2={GROUND_Y - 8}
              stroke="#334155"
              strokeWidth="6"
            />
            <circle
              cx={CRANK.x}
              cy={CRANK.y}
              r={CRANK_R + 6}
              fill={hlStyle("crank", "#cbd5e1")}
              stroke="#334155"
              strokeWidth="2"
            />
            <line
              x1={CRANK.x}
              y1={CRANK.y}
              x2={L.K.x}
              y2={L.K.y}
              stroke="#334155"
              strokeWidth="3"
            />
            <circle cx={L.K.x} cy={L.K.y} r="6" fill="#1e293b" />
          </g>

          <g opacity={hlOpacity("counterweight")}>
            <rect
              x={L.CW.x - 22}
              y={L.CW.y - 14}
              width={44}
              height={28}
              fill={hlStyle("counterweight", "#475569")}
              stroke="#1e293b"
              strokeWidth="2"
              rx="3"
              transform={`rotate(${(theta * 180) / Math.PI} ${L.CW.x} ${L.CW.y})`}
            />
          </g>

          <g opacity={hlOpacity("pitman")}>
            <line
              x1={L.K.x}
              y1={L.K.y}
              x2={L.T.x}
              y2={L.T.y}
              stroke={hlStyle("pitman", "#0f172a")}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          <g opacity={hlOpacity("walkingBeam")}>
            <line
              x1={L.T.x}
              y1={L.T.y}
              x2={L.H.x}
              y2={L.H.y}
              stroke={hlStyle("walkingBeam", "#1e293b")}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <circle cx={PIVOT.x} cy={PIVOT.y} r="7" fill="#fbbf24" stroke="#7c2d12" strokeWidth="2" />
          </g>

          <g
            opacity={hlOpacity("horsehead")}
            transform={`rotate(${L.beamAngleDeg} ${L.H.x} ${L.H.y})`}
          >
            <path
              d={`M ${L.H.x - 6} ${L.H.y - HORSEHEAD_R}
                  Q ${L.H.x + HORSEHEAD_R + 8} ${L.H.y - HORSEHEAD_R} ${L.H.x + HORSEHEAD_R + 4} ${L.H.y}
                  Q ${L.H.x + HORSEHEAD_R + 4} ${L.H.y + HORSEHEAD_R + 4} ${L.H.x} ${L.H.y + HORSEHEAD_R + 4}
                  L ${L.H.x - 30} ${L.H.y + HORSEHEAD_R + 4}
                  L ${L.H.x - 30} ${L.H.y - HORSEHEAD_R}
                  Z`}
              fill={hlStyle("horsehead", "#b45309")}
              stroke="#7c2d12"
              strokeWidth="2"
            />
          </g>

          <g opacity={hlOpacity("polishedRod")}>
            <line
              x1={wellX}
              y1={rodTopY}
              x2={L.H.x}
              y2={L.H.y + 6}
              stroke="#1e293b"
              strokeWidth="2"
            />
            <rect
              x={wellX - 3}
              y={rodTopY}
              width={6}
              height={GROUND_Y - rodTopY}
              fill={hlStyle("polishedRod", "#0f172a")}
            />
          </g>

          <g opacity={hlOpacity("wellCasing")}>
            <rect
              x={wellX - 14}
              y={GROUND_Y - 8}
              width={28}
              height={14}
              fill="#475569"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <rect
              x={wellX - 10}
              y={GROUND_Y + 6}
              width={20}
              height={H - GROUND_Y - 6}
              fill="none"
              stroke={hlStyle("wellCasing", "#1f2937")}
              strokeWidth="3"
            />
          </g>

          <g opacity={hlOpacity("tubing")}>
            <rect
              x={wellX - 6}
              y={GROUND_Y + 6}
              width={12}
              height={H - GROUND_Y - 6}
              fill="none"
              stroke={hlStyle("tubing", "#64748b")}
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </g>

          <g opacity={hlOpacity("polishedRod")}>
            <rect
              x={wellX - 2}
              y={GROUND_Y + 6}
              width={4}
              height={H - GROUND_Y - 24}
              fill="#0f172a"
            />
            {(() => {
              const upstroke = Math.sin(theta) > 0;
              return (
                <polygon
                  points={`${wellX - 8},${H - 30} ${wellX + 8},${H - 30} ${wellX},${upstroke ? H - 50 : H - 14}`}
                  fill={upstroke ? "#16a34a" : "#dc2626"}
                  opacity="0.85"
                />
              );
            })()}
          </g>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant={playing ? "default" : "secondary"}
            onClick={() => setPlaying((p) => !p)}
            data-testid="button-play-pause"
          >
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTheta(0);
              setSpeed(1);
            }}
            data-testid="button-reset-sim"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Speed</span>
            <Slider
              value={[speed]}
              onValueChange={(v) => setSpeed(v[0] ?? 1)}
              min={0.2}
              max={3}
              step={0.1}
              className="flex-1"
              data-testid="slider-speed"
            />
            <span className="text-xs font-mono w-10 text-right" data-testid="text-speed">
              {speed.toFixed(1)}×
            </span>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap" data-testid="text-strokes">
            ≈ {strokesPerMin} strokes / min
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {(Object.keys(PART_LABEL) as PartKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onMouseEnter={() => setHighlight(k)}
            onMouseLeave={() => setHighlight(null)}
            onFocus={() => setHighlight(k)}
            onBlur={() => setHighlight(null)}
            onClick={() => setHighlight((cur) => (cur === k ? null : k))}
            className={cn(
              "text-left rounded-md border p-3 transition-colors",
              isHL(k) ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-border hover:border-amber-400/60",
            )}
            data-testid={`button-part-${k}`}
          >
            <div className="font-semibold text-sm">{PART_LABEL[k]}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-snug">{PART_NOTE[k]}</div>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Tip: hover or tap a part above to highlight it in the animation. The little arrow at the
        bottom of the well shows the pump's lift stroke (green = oil rising) and refill stroke
        (red = valves resetting).
      </p>
    </div>
  );
}
