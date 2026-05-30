import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setV(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return v;
}

const NODES = [
  { label: "Health", angle: 0,    dist: 310, color: "#34d399" },
  { label: "Housing", angle: 32,   dist: 340, color: "#60a5fa" },
  { label: "Jobs", angle: 72,    dist: 290, color: "#a78bfa" },
  { label: "Justice", angle: 108,   dist: 330, color: "#f472b6" },
  { label: "Youth", angle: 145,   dist: 300, color: "#fb923c" },
  { label: "Veterans", angle: 180,   dist: 320, color: "#38bdf8" },
  { label: "Families", angle: 215,   dist: 290, color: "#34d399" },
  { label: "Faith", angle: 252,   dist: 340, color: "#f59e0b" },
  { label: "CHW", angle: 288,   dist: 305, color: "#c084fc" },
  { label: "Data", angle: 324,   dist: 325, color: "#22d3ee" },
];

const ROLES = ["Promotora", "Peer Mentor", "Faith Leader", "Caregiver", "CHW", "Veteran", "Neighbor"];

export function Hybrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const blobRef = useRef<HTMLDivElement>(null);
  const grants = useCountUp(721);
  const platforms = useCountUp(26);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    type Particle = { x: number; y: number; speed: number; size: number; color: string; alpha: number; trail: {x:number;y:number}[] };
    const PCOLORS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#f472b6"];
    const particles: Particle[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.3 + Math.random() * 0.6,
      size: 1 + Math.random() * 1.5,
      color: PCOLORS[Math.floor(Math.random() * PCOLORS.length)],
      alpha: 0.15 + Math.random() * 0.25,
      trail: [],
    }));

    const nodeStates = NODES.map((n) => ({
      ...n,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.015,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      px: cx + Math.cos((n.angle * Math.PI) / 180) * n.dist,
      py: cy + Math.sin((n.angle * Math.PI) / 180) * n.dist,
    }));

    let tick = 0;
    function draw() {
      tick++;
      ctx!.clearRect(0, 0, W, H);

      // Particle streams (Direction C)
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; p.trail = []; }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 10) p.trail.shift();
        if (p.trail.length > 1) {
          ctx!.beginPath();
          ctx!.strokeStyle = p.color;
          ctx!.lineWidth = p.size * 0.6;
          p.trail.forEach((pt, i) => {
            ctx!.globalAlpha = (i / p.trail.length) * p.alpha * 0.5;
            i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
          });
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      });

      // Network nodes + connections (Direction A)
      nodeStates.forEach((n) => {
        n.pulse += n.pulseSpeed;
        n.px += n.vx;
        n.py += n.vy;
        const targetX = cx + Math.cos((n.angle * Math.PI) / 180) * n.dist;
        const targetY = cy + Math.sin((n.angle * Math.PI) / 180) * n.dist;
        n.vx += (targetX - n.px) * 0.003;
        n.vy += (targetY - n.py) * 0.003;
        n.vx *= 0.96; n.vy *= 0.96;

        // Line to center
        const distToCenter = Math.sqrt((n.px - cx) ** 2 + (n.py - cy) ** 2);
        const lineAlpha = 0.18 * (1 - distToCenter / 420);
        if (lineAlpha > 0) {
          const grad = ctx!.createLinearGradient(cx, cy, n.px, n.py);
          grad.addColorStop(0, n.color + "00");
          grad.addColorStop(0.6, n.color + Math.round(lineAlpha * 255).toString(16).padStart(2, "0"));
          grad.addColorStop(1, n.color + Math.round(lineAlpha * 1.4 * 255).toString(16).padStart(2, "0"));
          ctx!.beginPath();
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 1;
          ctx!.moveTo(cx, cy);
          ctx!.lineTo(n.px, n.py);
          ctx!.stroke();

          // Traveling dot
          const progress = ((tick * 0.006 + n.angle * 0.01) % 1);
          const dotX = cx + (n.px - cx) * progress;
          const dotY = cy + (n.py - cy) * progress;
          ctx!.beginPath();
          ctx!.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
          ctx!.fillStyle = n.color;
          ctx!.globalAlpha = 0.5;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        }

        // Node
        const pf = 1 + Math.sin(n.pulse) * 0.12;
        const r = 5 * pf;
        const glow = ctx!.createRadialGradient(n.px, n.py, 0, n.px, n.py, r * 3);
        glow.addColorStop(0, n.color + "55");
        glow.addColorStop(1, n.color + "00");
        ctx!.beginPath(); ctx!.arc(n.px, n.py, r * 3, 0, Math.PI * 2);
        ctx!.fillStyle = glow; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx!.fillStyle = n.color; ctx!.fill();

        // Label
        ctx!.font = "10px Inter, sans-serif";
        ctx!.fillStyle = n.color;
        ctx!.globalAlpha = 0.7;
        ctx!.textAlign = "center";
        ctx!.fillText(n.label, n.px, n.py + r + 13);
        ctx!.globalAlpha = 1;
      });

      // Peer-to-peer links between nearby nodes
      for (let i = 0; i < nodeStates.length; i++) {
        for (let j = i + 1; j < nodeStates.length; j++) {
          const a = nodeStates[i], b = nodeStates[j];
          const d = Math.sqrt((a.px - b.px) ** 2 + (a.py - b.py) ** 2);
          if (d < 180) {
            ctx!.beginPath();
            ctx!.strokeStyle = a.color;
            ctx!.globalAlpha = (1 - d / 180) * 0.08;
            ctx!.lineWidth = 0.7;
            ctx!.moveTo(a.px, a.py);
            ctx!.lineTo(b.px, b.py);
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Blob breathing (Direction B)
  useEffect(() => {
    let tick = 0;
    const iv = setInterval(() => {
      tick += 0.006;
      if (!blobRef.current) return;
      const blobs = blobRef.current.querySelectorAll<HTMLElement>("[data-b]");
      blobs.forEach((b, i) => {
        const phase = tick + i * 1.3;
        const sx = 1 + Math.sin(phase * 0.8) * 0.08;
        const sy = 1 + Math.cos(phase * 0.6) * 0.06;
        const tx = Math.sin(phase * 0.4) * 25;
        const ty = Math.cos(phase * 0.5) * 20;
        b.style.transform = `translate(${tx}px,${ty}px) scale(${sx},${sy})`;
      });
    }, 16);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden" style={{ background: "linear-gradient(150deg, #050810 0%, #0a1020 45%, #08060f 100%)" }}>

      {/* Breathing warm blobs */}
      <div ref={blobRef} className="absolute inset-0 pointer-events-none">
        <div data-b="1" className="absolute rounded-full" style={{ width: 600, height: 600, top: "-10%", left: "-8%", background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)", filter: "blur(70px)" }} />
        <div data-b="2" className="absolute rounded-full" style={{ width: 500, height: 500, top: "0%", right: "-6%", background: "radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div data-b="3" className="absolute rounded-full" style={{ width: 480, height: 480, bottom: "-5%", left: "30%", background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)", filter: "blur(65px)" }} />
        <div data-b="4" className="absolute rounded-full" style={{ width: 360, height: 360, top: "40%", left: "15%", background: "radial-gradient(circle, rgba(34,211,238,0.09) 0%, transparent 65%)", filter: "blur(55px)" }} />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      {/* Animated canvas: network + streams */}
      <canvas ref={canvasRef} width={1280} height={800} className="absolute inset-0 w-full h-full" style={{ opacity: 0.75 }} />

      {/* Vignette toward center so text reads cleanly */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 65% 70% at 50% 45%, rgba(5,8,16,0.72) 0%, transparent 100%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* Live indicator */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-7 text-xs font-medium"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b", letterSpacing: "0.06em" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f59e0b" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#f59e0b" }} />
          </span>
          The Collaborative Advocate Foundation · Austin, TX → Nationwide
        </div>

        {/* Headline */}
        <h1 className="font-black mb-5 leading-tight" style={{ fontSize: "clamp(2.4rem,5vw,3.8rem)", color: "#f8fafc", maxWidth: 720, textShadow: "0 2px 40px rgba(5,8,16,0.8)" }}>
          Built from community.
          <br />
          <span style={{ background: "linear-gradient(90deg, #f59e0b 0%, #f472b6 55%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Powered by data.
          </span>
        </h1>

        {/* Sub */}
        <p style={{ color: "rgba(248,250,252,0.62)", fontSize: "1.05rem", maxWidth: 560, lineHeight: 1.75, marginBottom: 36 }}>
          We equip youth, veterans, returning citizens, families, and the organizations that champion them
          — with AI tools, verifiable credentials, and the infrastructure to create change from within.
          Veteran-founded. Black-led. Built by people who've been where you are.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-14">
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f472b6)", color: "#050810", boxShadow: "0 0 35px rgba(245,158,11,0.35)" }}>
            Find What Your Family Qualifies For →
          </button>
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "rgba(248,250,252,0.07)", color: "#f8fafc", border: "1px solid rgba(248,250,252,0.18)", backdropFilter: "blur(8px)" }}>
            See Your Neighborhood's Data
          </button>
        </div>

        {/* Floating community role chips */}
        <div className="relative w-full max-w-2xl h-0 pointer-events-none" style={{ marginTop: -56 }}>
          {ROLES.map((r, i) => (
            <span key={r} className="absolute text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                top: [-55, -42, -30, -18, -48, -35, -22][i],
                left: i < 4 ? `${i * 26 - 10}%` : undefined,
                right: i >= 4 ? `${(i - 4) * 28 - 5}%` : undefined,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: ["#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c","#38bdf8","#f59e0b"][i],
                animation: `floatChip ${3.5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
              }}>
              {r}
            </span>
          ))}
        </div>

        {/* Live stat strip */}
        <div className="flex items-center gap-10 mt-4"
          style={{ paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            [String(grants), "Grants Discovered", "#f59e0b"],
            [String(platforms), "Platforms Online", "#22d3ee"],
            ["9", "Benefits Screened at Once", "#34d399"],
            ["50", "States Deployable", "#a78bfa"],
          ].map(([n, l, c]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black font-mono" style={{ color: c }}>{n}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(248,250,252,0.35)", letterSpacing: "0.04em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes floatChip {
          0%,100% { transform: translateY(0px); opacity:0.7; }
          50% { transform: translateY(-6px); opacity:1; }
        }
      `}</style>
    </div>
  );
}
