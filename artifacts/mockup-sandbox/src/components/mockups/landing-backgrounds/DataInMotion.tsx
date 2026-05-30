import { useEffect, useRef, useState } from "react";

function AnimatedBar({ height, color, delay }: { height: number; color: string; delay: number }) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(height), delay);
    return () => clearTimeout(t);
  }, [height, delay]);
  return (
    <div className="flex flex-col justify-end" style={{ height: 80, width: 10 }}>
      <div style={{
        height: h, width: "100%", background: color,
        transition: "height 1.2s cubic-bezier(0.34,1.56,0.64,1)",
        borderRadius: "3px 3px 0 0",
        boxShadow: `0 0 8px ${color}88`,
      }} />
    </div>
  );
}

function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = target / 80;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

const MAP_DOTS = [
  { x: 42, y: 48, size: 14, pulse: true, label: "Austin Hub" },
  { x: 55, y: 60, size: 8, pulse: false, label: "Pflugerville" },
  { x: 30, y: 42, size: 7, pulse: false, label: "" },
  { x: 65, y: 38, size: 6, pulse: false, label: "" },
  { x: 72, y: 55, size: 9, pulse: false, label: "" },
  { x: 25, y: 65, size: 7, pulse: false, label: "" },
  { x: 50, y: 30, size: 6, pulse: false, label: "" },
  { x: 80, y: 70, size: 7, pulse: false, label: "" },
  { x: 38, y: 72, size: 6, pulse: false, label: "" },
  { x: 60, y: 78, size: 8, pulse: false, label: "" },
  { x: 18, y: 50, size: 5, pulse: false, label: "" },
  { x: 85, y: 40, size: 6, pulse: false, label: "" },
];

const METRICS = [
  { label: "Grants Tracked", value: 721, color: "#22d3ee", suffix: "" },
  { label: "Platforms Online", value: 26, color: "#a78bfa", suffix: "" },
  { label: "Benefits Screened", value: 9, color: "#34d399", suffix: " programs" },
  { label: "States Replicable", value: 50, color: "#fb923c", suffix: "" },
];

const BARS_DATA = [
  [12, 28, 45, 62, 80, 65, 90, 75, 95, 88],
  [8, 22, 38, 55, 48, 70, 58, 82, 76, 98],
];

const STREAM_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

export function DataInMotion() {
  const streamRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = streamRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const streams = STREAM_COLORS.map((color, i) => ({
      color,
      particles: Array.from({ length: 18 }, (_, j) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 0.4 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
        trail: [] as { x: number; y: number }[],
      })),
    }));

    function draw() {
      ctx!.fillStyle = "rgba(2,6,23,0.15)";
      ctx!.fillRect(0, 0, W, H);

      streams.forEach(({ color, particles }) => {
        particles.forEach((p) => {
          p.y -= p.speed;
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 12) p.trail.shift();

          if (p.trail.length > 1) {
            ctx!.beginPath();
            ctx!.strokeStyle = color;
            ctx!.lineWidth = p.size * 0.7;
            p.trail.forEach((pt, i) => {
              ctx!.globalAlpha = (i / p.trail.length) * p.alpha * 0.6;
              if (i === 0) ctx!.moveTo(pt.x, pt.y);
              else ctx!.lineTo(pt.x, pt.y);
            });
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }

          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = color;
          ctx!.globalAlpha = p.alpha;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        });
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden"
      style={{ background: "#020617" }}>

      <canvas
        ref={streamRef}
        width={1280}
        height={800}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
      />

      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(2,6,23,0.8) 100%)" }} />

      <div className="relative z-10 flex min-h-screen">
        <div className="flex flex-col justify-center px-12 flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded mb-6 text-xs font-mono font-medium w-fit"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee", letterSpacing: "0.12em" }}>
            ● LIVE · AUSTIN, TX → NATIONWIDE
          </div>

          <h1 className="text-5xl font-black mb-4 leading-tight"
            style={{ color: "#f0f9ff" }}>
            Community impact,<br />
            <span style={{ color: "#22d3ee", textShadow: "0 0 30px rgba(34,211,238,0.5)" }}>
              measured and moving.
            </span>
          </h1>

          <p className="text-base mb-8"
            style={{ color: "rgba(240,249,255,0.55)", lineHeight: 1.75, maxWidth: 480 }}>
            Real-time grant discovery. Live SDOH data. 9 benefits screened in one conversation.
            Not a static brochure — a live intelligence layer for communities that have been
            underserved and underestimated.
          </p>

          <div className="flex gap-4 mb-12">
            <button className="px-6 py-3 rounded font-semibold text-sm font-mono"
              style={{ background: "#22d3ee", color: "#020617", boxShadow: "0 0 25px rgba(34,211,238,0.5)" }}>
              Run Benefits Screen →
            </button>
            <button className="px-6 py-3 rounded font-semibold text-sm"
              style={{ background: "rgba(240,249,255,0.06)", color: "#f0f9ff", border: "1px solid rgba(34,211,238,0.25)" }}>
              Explore Community Data
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.color}33` }}>
                <div className="text-2xl font-black font-mono mb-0.5" style={{ color: m.color }}>
                  <CountUp target={m.value} suffix={m.suffix} />
                </div>
                <div className="text-xs" style={{ color: "rgba(240,249,255,0.4)" }}>{m.label}</div>
                <div className="flex gap-1 mt-2 items-end">
                  {BARS_DATA[0].map((h, i) => (
                    <AnimatedBar key={i} height={h * 0.6} color={m.color} delay={i * 80} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center flex-shrink-0 w-80 px-8">
          <div className="w-full rounded-xl p-4 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <div className="text-xs font-mono mb-3" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
              COVERAGE MAP — TEXAS
            </div>
            <div className="relative" style={{ height: 160, background: "rgba(34,211,238,0.03)", borderRadius: 8, border: "1px solid rgba(34,211,238,0.1)" }}>
              {MAP_DOTS.map((d, i) => (
                <div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)" }}>
                  {d.pulse && (
                    <div className="absolute inset-0 rounded-full animate-ping"
                      style={{ width: d.size * 2.5, height: d.size * 2.5, top: -d.size * 0.75, left: -d.size * 0.75, background: "rgba(34,211,238,0.2)" }} />
                  )}
                  <div className="rounded-full" style={{
                    width: d.size, height: d.size,
                    background: d.pulse ? "#22d3ee" : `rgba(34,211,238,${0.3 + Math.random() * 0.4})`,
                    boxShadow: d.pulse ? "0 0 10px rgba(34,211,238,0.8)" : "none",
                  }} />
                  {d.label && (
                    <div className="absolute whitespace-nowrap text-xs font-mono" style={{ top: d.size + 2, left: "50%", transform: "translateX(-50%)", color: "#22d3ee", fontSize: 9 }}>
                      {d.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs font-mono" style={{ color: "rgba(240,249,255,0.3)", letterSpacing: "0.08em" }}>
              26 platforms live · expanding nationwide
            </div>
          </div>

          <div className="w-full rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.15)" }}>
            <div className="text-xs font-mono mb-3" style={{ color: "#a78bfa", letterSpacing: "0.1em" }}>
              GRANT DISCOVERY — LIVE
            </div>
            {[
              { name: "DOL WIOA Title I", amount: "$2.4M", status: "OPEN" },
              { name: "SAMHSA SUD Trmt", amount: "$850K", status: "OPEN" },
              { name: "HUD CDBG-DR", amount: "$1.2M", status: "REVIEW" },
              { name: "USDA SNAP-Ed", amount: "$620K", status: "OPEN" },
            ].map((g, i) => (
              <div key={i} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: i < 3 ? "1px solid rgba(167,139,250,0.08)" : "none" }}>
                <span style={{ fontSize: 10, color: "rgba(240,249,255,0.5)", fontFamily: "monospace" }}>{g.name}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, color: "#a78bfa", fontFamily: "monospace", fontWeight: 700 }}>{g.amount}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                    style={{ fontSize: 8, background: g.status === "OPEN" ? "rgba(52,211,153,0.2)" : "rgba(251,146,60,0.2)", color: g.status === "OPEN" ? "#34d399" : "#fb923c" }}>
                    {g.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
