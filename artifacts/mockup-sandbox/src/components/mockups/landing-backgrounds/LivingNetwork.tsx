import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  label: string;
  color: string;
  pulse: number;
  pulseSpeed: number;
  isHub: boolean;
}

interface Connection {
  a: number;
  b: number;
  strength: number;
}

const NODE_DATA = [
  { label: "ThriveUp", color: "#f59e0b", r: 18, isHub: true },
  { label: "Health", color: "#34d399", r: 10, isHub: false },
  { label: "Housing", color: "#60a5fa", r: 10, isHub: false },
  { label: "Jobs", color: "#a78bfa", r: 9, isHub: false },
  { label: "Youth", color: "#f472b6", r: 9, isHub: false },
  { label: "Veterans", color: "#fb923c", r: 8, isHub: false },
  { label: "Families", color: "#34d399", r: 11, isHub: false },
  { label: "CHW", color: "#38bdf8", r: 8, isHub: false },
  { label: "Justice", color: "#c084fc", r: 8, isHub: false },
  { label: "Grants", color: "#fbbf24", r: 9, isHub: false },
  { label: "Schools", color: "#4ade80", r: 8, isHub: false },
  { label: "Faith", color: "#f87171", r: 8, isHub: false },
  { label: "Data", color: "#67e8f9", r: 9, isHub: false },
  { label: "Care", color: "#e879f9", r: 8, isHub: false },
  { label: "SDOH", color: "#a3e635", r: 8, isHub: false },
  { label: "Training", color: "#fb923c", r: 9, isHub: false },
  { label: "Benefits", color: "#60a5fa", r: 8, isHub: false },
  { label: "Partners", color: "#34d399", r: 10, isHub: false },
  { label: "Voice", color: "#f472b6", r: 8, isHub: false },
  { label: "Impact", color: "#fbbf24", r: 9, isHub: false },
];

export function LivingNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const nodes: Node[] = NODE_DATA.map((d, i) => {
      if (d.isHub) {
        return { ...d, x: cx, y: cy, vx: 0, vy: 0, pulse: 0, pulseSpeed: 0.03 };
      }
      const angle = ((i - 1) / (NODE_DATA.length - 1)) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 120 + Math.random() * 180;
      return {
        ...d,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      };
    });

    const connections: Connection[] = [];
    nodes.forEach((n, i) => {
      if (i === 0) return;
      connections.push({ a: 0, b: i, strength: 0.6 + Math.random() * 0.4 });
      if (Math.random() > 0.5 && i > 1) {
        const peer = 1 + Math.floor(Math.random() * (nodes.length - 1));
        if (peer !== i) connections.push({ a: i, b: peer, strength: 0.2 + Math.random() * 0.3 });
      }
    });

    nodesRef.current = nodes;
    connectionsRef.current = connections;

    function draw() {
      tickRef.current += 1;
      ctx!.clearRect(0, 0, W, H);

      nodes.forEach((n) => {
        if (!n.isHub) {
          n.x += n.vx;
          n.y += n.vy;
          const dx = n.x - cx;
          const dy = n.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 260) {
            n.vx -= dx * 0.0003;
            n.vy -= dy * 0.0003;
          }
          if (dist < 80) {
            n.vx += dx * 0.002;
            n.vy += dy * 0.002;
          }
          n.vx *= 0.995;
          n.vy *= 0.995;
          if (n.x < 40) n.vx += 0.05;
          if (n.x > W - 40) n.vx -= 0.05;
          if (n.y < 40) n.vy += 0.05;
          if (n.y > H - 40) n.vy -= 0.05;
          n.vx += (Math.random() - 0.5) * 0.04;
          n.vy += (Math.random() - 0.5) * 0.04;
        }
        n.pulse += n.pulseSpeed;
      });

      connections.forEach((c) => {
        const a = nodes[c.a];
        const b = nodes[c.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 350) return;

        const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y);
        const alpha = c.strength * (1 - dist / 350) * 0.7;
        grad.addColorStop(0, a.color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
        grad.addColorStop(1, b.color + Math.round(alpha * 255).toString(16).padStart(2, "0"));

        ctx!.beginPath();
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = c.a === 0 ? 1.5 : 0.8;
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();

        const progress = ((tickRef.current * 0.008 + c.a * 0.5) % 1);
        const px = a.x + dx * progress;
        const py = a.y + dy * progress;
        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = a.color + "cc";
        ctx!.fill();
      });

      nodes.forEach((n) => {
        const pulseFactor = 1 + Math.sin(n.pulse) * 0.15;
        const r = n.r * pulseFactor;

        if (n.isHub) {
          const rings = [2.8, 2, 1.4];
          rings.forEach((factor, i) => {
            const ringAlpha = 0.08 - i * 0.02;
            ctx!.beginPath();
            ctx!.arc(n.x, n.y, r * factor + Math.sin(n.pulse * 0.7 + i) * 4, 0, Math.PI * 2);
            ctx!.fillStyle = n.color + Math.round(ringAlpha * 255).toString(16).padStart(2, "0");
            ctx!.fill();
          });
        }

        const glow = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
        glow.addColorStop(0, n.color + "cc");
        glow.addColorStop(0.4, n.color + "66");
        glow.addColorStop(1, n.color + "00");
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = glow;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = n.color;
        ctx!.fill();

        if (n.isHub || n.r >= 9) {
          ctx!.font = `${n.isHub ? "bold 11px" : "10px"} Inter, sans-serif`;
          ctx!.fillStyle = "#ffffff";
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          if (n.isHub) {
            ctx!.fillText("ThriveUp", n.x, n.y - 1);
          } else {
            ctx!.fillStyle = n.color;
            ctx!.font = "9px Inter, sans-serif";
            ctx!.fillText(n.label, n.x, n.y + r + 11);
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #030712 0%, #0a0f1e 40%, #0f172a 100%)" }}>
      <canvas
        ref={canvasRef}
        width={1280}
        height={800}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.85 }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium tracking-widest uppercase"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
          26 Platforms · 721 Grants · Greater Austin → Nation
        </div>

        <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight"
          style={{ color: "#f8fafc", textShadow: "0 0 60px rgba(245,158,11,0.3)" }}>
          Every community node,<br />
          <span style={{ color: "#f59e0b" }}>connected and thriving.</span>
        </h1>

        <p className="text-lg max-w-2xl mb-10"
          style={{ color: "rgba(248,250,252,0.65)", lineHeight: 1.7 }}>
          ThriveUp is the connective infrastructure — not a platform you visit,
          but the living network your community already runs through.
          Health. Housing. Jobs. Justice. All wired together, in real time.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "#f59e0b", color: "#0a0f1e", boxShadow: "0 0 30px rgba(245,158,11,0.4)" }}>
            See Your Community's Data →
          </button>
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.08)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.2)" }}>
            Find Benefits You Qualify For
          </button>
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-12">
          {[["26", "Platforms Online"], ["721", "Grants Tracked"], ["9", "Benefits Screened at Once"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black" style={{ color: "#f59e0b" }}>{n}</div>
              <div className="text-xs" style={{ color: "rgba(248,250,252,0.45)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
