import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 720;
const H = 280;
const PLOT_X = 60;
const PLOT_W = W - 80;
const PLOT_Y = 30;
const PLOT_H = 200;
const BASELINE = PLOT_Y + PLOT_H / 2;
const TIME_WINDOW = 8;

interface Beat {
  t: number;
  paced: boolean;
}

export function PacemakerSim({ className }: { className?: string }) {
  const [intrinsicBpm, setIntrinsicBpm] = useState(45);
  const [pacingEnabled, setPacingEnabled] = useState(true);
  const [pacingFloor, setPacingFloor] = useState(60);
  const [playing, setPlaying] = useState(true);
  const [now, setNow] = useState(0);
  const beatsRef = useRef<Beat[]>([]);
  const lastIntrinsicRef = useRef(0);
  const lastBeatRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (ts: number) => {
      if (lastTickRef.current == null) lastTickRef.current = ts;
      const dt = (ts - lastTickRef.current) / 1000;
      lastTickRef.current = ts;
      setNow((n) => {
        const next = n + dt;
        const intrinsicInterval = 60 / intrinsicBpm;
        const pacedInterval = 60 / pacingFloor;
        const jitter = (Math.random() - 0.5) * 0.04 * intrinsicInterval;
        if (next - lastIntrinsicRef.current >= intrinsicInterval + jitter) {
          lastIntrinsicRef.current = next;
          beatsRef.current.push({ t: next, paced: false });
          lastBeatRef.current = next;
        } else if (pacingEnabled && next - lastBeatRef.current >= pacedInterval) {
          beatsRef.current.push({ t: next, paced: true });
          lastBeatRef.current = next;
        }
        const cutoff = next - TIME_WINDOW - 1;
        beatsRef.current = beatsRef.current.filter((b) => b.t >= cutoff);
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [playing, intrinsicBpm, pacingEnabled, pacingFloor]);

  const t0 = now - TIME_WINDOW;
  const xOf = (t: number) => PLOT_X + ((t - t0) / TIME_WINDOW) * PLOT_W;

  const ecgPath = (() => {
    const points: string[] = [];
    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const t = t0 + (i / samples) * TIME_WINDOW;
      let y = BASELINE;
      for (const beat of beatsRef.current) {
        const dt = t - beat.t;
        if (dt < 0 || dt > 0.5) continue;
        if (dt < 0.05) y -= 6 * (dt / 0.05);
        else if (dt < 0.12) {
          const phase = (dt - 0.05) / 0.07;
          y += -6 + phase * 90 - phase * phase * 90;
          if (phase > 0.5) y = BASELINE - 60 * (1 - (phase - 0.5) * 2);
        } else if (dt < 0.18) {
          const phase = (dt - 0.12) / 0.06;
          y = BASELINE + 30 * (1 - phase);
        } else if (dt > 0.28 && dt < 0.4) {
          const phase = (dt - 0.28) / 0.12;
          y -= 10 * Math.sin(phase * Math.PI);
        }
      }
      points.push(`${xOf(t).toFixed(1)},${y.toFixed(1)}`);
    }
    return `M ${points.join(" L ")}`;
  })();

  const visible = beatsRef.current.filter((b) => b.t >= t0);
  const recent = visible.filter((b) => b.t >= now - 4);
  const pacedCount = recent.filter((b) => b.paced).length;
  const naturalCount = recent.length - pacedCount;
  const effectiveBpm = recent.length >= 2 ? Math.round((recent.length / 4) * 60) : 0;

  const reset = () => {
    beatsRef.current = [];
    lastIntrinsicRef.current = now;
    lastBeatRef.current = now;
  };

  return (
    <div className={cn("w-full", className)} data-testid="pacemaker-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="ECG trace showing natural heartbeats and pacemaker-triggered beats over time.">
          <rect x="0" y="0" width={W} height={H} fill="#0f172a" />

          {Array.from({ length: 11 }, (_, i) => (
            <line key={`vg-${i}`} x1={PLOT_X + (PLOT_W * i) / 10} y1={PLOT_Y} x2={PLOT_X + (PLOT_W * i) / 10} y2={PLOT_Y + PLOT_H} stroke="#1e293b" strokeWidth="1" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`hg-${i}`} x1={PLOT_X} y1={PLOT_Y + (PLOT_H * i) / 4} x2={PLOT_X + PLOT_W} y2={PLOT_Y + (PLOT_H * i) / 4} stroke="#1e293b" strokeWidth="1" />
          ))}
          <line x1={PLOT_X} y1={BASELINE} x2={PLOT_X + PLOT_W} y2={BASELINE} stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />

          <path d={ecgPath} fill="none" stroke="#22c55e" strokeWidth="2" />

          {visible.map((b, i) => (
            <line key={i} x1={xOf(b.t)} y1={PLOT_Y + 4} x2={xOf(b.t)} y2={PLOT_Y + 14} stroke={b.paced ? "#f59e0b" : "#0ea5e9"} strokeWidth="2" />
          ))}

          <text x={PLOT_X} y={20} fontSize="10" fill="#94a3b8">ECG · 8-second window</text>
          <text x={PLOT_X + PLOT_W} y={20} textAnchor="end" fontSize="10" fill="#94a3b8">
            <tspan fill="#0ea5e9">■</tspan> natural  <tspan fill="#f59e0b">■</tspan> paced
          </text>
        </svg>

        <div className="px-4 py-3 border-t bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <Button size="sm" variant={playing ? "default" : "secondary"} onClick={() => setPlaying((p) => !p)} data-testid="button-play-pause">
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} data-testid="button-reset"><RotateCcw className="w-4 h-4 mr-2" />Reset trace</Button>
          <div className="text-xs">
            <div className="flex items-center justify-between"><span>Intrinsic rate</span><span className="font-mono">{intrinsicBpm} bpm</span></div>
            <Slider value={[intrinsicBpm]} onValueChange={(v) => setIntrinsicBpm(Math.round(v[0] ?? 60))} min={30} max={90} step={1} data-testid="slider-intrinsic" />
          </div>
          <div className="text-xs">
            <div className="flex items-center justify-between mb-1">
              <span>Pacemaker</span>
              <Switch checked={pacingEnabled} onCheckedChange={setPacingEnabled} data-testid="switch-pacing" />
            </div>
            <div className="flex items-center justify-between"><span>Floor</span><span className="font-mono">{pacingFloor} bpm</span></div>
            <Slider value={[pacingFloor]} onValueChange={(v) => setPacingFloor(Math.round(v[0] ?? 60))} min={40} max={80} step={1} data-testid="slider-floor" disabled={!pacingEnabled} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3">
          <div className="font-semibold">Effective rate</div>
          <div className="text-muted-foreground mt-1 font-mono text-base">{effectiveBpm} bpm</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="font-semibold">Natural beats</div>
          <div className="text-muted-foreground mt-1 font-mono text-base text-sky-500">{naturalCount} / 4s</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="font-semibold">Paced beats</div>
          <div className="text-muted-foreground mt-1 font-mono text-base text-amber-500">{pacedCount} / 4s</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="font-semibold">Try this</div>
          <div className="text-muted-foreground mt-1 text-[11px]">Drop intrinsic to 40. Watch the pacemaker fill in only when it has to.</div>
        </div>
      </div>
    </div>
  );
}
