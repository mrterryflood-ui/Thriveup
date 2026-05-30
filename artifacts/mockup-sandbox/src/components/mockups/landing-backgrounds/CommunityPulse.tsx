import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

const FACES = [
  { top: "12%", left: "8%", size: 72, delay: 0, label: "Promotora" },
  { top: "55%", left: "4%", size: 64, delay: 0.3, label: "Peer Mentor" },
  { top: "75%", left: "14%", size: 56, delay: 0.6, label: "Faith Leader" },
  { top: "8%", left: "78%", size: 68, delay: 0.2, label: "CHW" },
  { top: "65%", left: "82%", size: 72, delay: 0.4, label: "Caregiver" },
  { top: "35%", left: "88%", size: 56, delay: 0.7, label: "Veteran" },
  { top: "82%", left: "50%", size: 60, delay: 0.5, label: "Neighbor" },
];

const WORDS = [
  "Housing", "Health", "Jobs", "Justice", "Family",
  "SNAP", "Childcare", "Medicaid", "Training", "Recovery",
  "Foster", "Veterans", "Seniors", "Youth", "Mental Health",
];

export function CommunityPulse() {
  const grants = useCountUp(721, 2200);
  const platforms = useCountUp(26, 1600);
  const screened = useCountUp(9, 1200);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 0.008;
      if (blobRef.current) {
        const blobs = blobRef.current.querySelectorAll<HTMLElement>("[data-blob]");
        blobs.forEach((b, i) => {
          const phase = tick + i * 1.1;
          const x = Math.sin(phase * 0.7) * 40;
          const y = Math.cos(phase * 0.5) * 30;
          const scale = 1 + Math.sin(phase * 0.9) * 0.12;
          b.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        });
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1c0a00 0%, #2d1200 25%, #1a0a0a 60%, #0f0a1a 100%)" }}>

      <div ref={blobRef} className="absolute inset-0 pointer-events-none">
        <div data-blob="1" className="absolute rounded-full" style={{
          width: 520, height: 520, top: "5%", left: "-8%",
          background: "radial-gradient(circle, rgba(234,88,12,0.28) 0%, transparent 70%)",
          filter: "blur(60px)", willChange: "transform",
        }} />
        <div data-blob="2" className="absolute rounded-full" style={{
          width: 600, height: 600, top: "30%", right: "-12%",
          background: "radial-gradient(circle, rgba(190,18,60,0.22) 0%, transparent 70%)",
          filter: "blur(70px)", willChange: "transform",
        }} />
        <div data-blob="3" className="absolute rounded-full" style={{
          width: 440, height: 440, bottom: "5%", left: "25%",
          background: "radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)",
          filter: "blur(50px)", willChange: "transform",
        }} />
        <div data-blob="4" className="absolute rounded-full" style={{
          width: 380, height: 380, top: "15%", left: "40%",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          filter: "blur(60px)", willChange: "transform",
        }} />
        <div data-blob="5" className="absolute rounded-full" style={{
          width: 300, height: 300, bottom: "20%", right: "10%",
          background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
          filter: "blur(50px)", willChange: "transform",
        }} />
      </div>

      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "48px 48px" }} />

      {FACES.map((f, i) => (
        <div key={i} className="absolute flex flex-col items-center gap-1"
          style={{ top: f.top, left: f.left, opacity: 0.65, animation: `fadeFloat${i % 3} 6s ease-in-out infinite`, animationDelay: `${f.delay}s` }}>
          <div className="rounded-full flex items-center justify-center font-bold text-white"
            style={{
              width: f.size, height: f.size,
              background: `radial-gradient(circle at 30% 30%, rgba(251,146,60,0.4), rgba(139,92,246,0.3))`,
              border: "1.5px solid rgba(251,146,60,0.4)",
              fontSize: f.size * 0.35,
              boxShadow: "0 0 20px rgba(251,146,60,0.2)",
            }}>
            {["🤲", "🌟", "✊", "💛", "🌿", "🦁", "🔗"][i]}
          </div>
          <span style={{ fontSize: 9, color: "rgba(251,146,60,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{f.label}</span>
        </div>
      ))}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {WORDS.map((w, i) => (
          <span key={w} className="absolute text-xs font-medium"
            style={{
              top: `${10 + (i * 31) % 80}%`,
              left: `${5 + (i * 47 + 15) % 90}%`,
              color: `rgba(251,146,60,${0.08 + (i % 4) * 0.04})`,
              fontSize: 11 + (i % 3) * 2,
              transform: `rotate(${-15 + (i % 5) * 8}deg)`,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
            {w}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium tracking-widest uppercase"
          style={{ background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.35)", color: "#fb923c" }}>
          Black-Led · Veteran-Founded · 501(c)(3) · Pflugerville, Texas
        </div>

        <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight"
          style={{ color: "#fef3c7", textShadow: "0 2px 40px rgba(234,88,12,0.4)" }}>
          The community<br />
          <span style={{ background: "linear-gradient(90deg, #fb923c, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            was never the problem.
          </span>
        </h1>

        <p className="text-lg max-w-2xl mb-10"
          style={{ color: "rgba(254,243,199,0.65)", lineHeight: 1.75 }}>
          Promotoras, peer mentors, faith leaders, untitled caregivers — they've been holding
          communities together for generations. We build the infrastructure that sees them,
          pays them, and multiplies what they already do.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #ea580c, #be185d)", color: "#fff", boxShadow: "0 0 30px rgba(234,88,12,0.4)" }}>
            Find What Your Family Qualifies For →
          </button>
          <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fef3c7", border: "1px solid rgba(251,146,60,0.3)" }}>
            See Your Neighborhood's Data
          </button>
        </div>

        <div className="flex justify-center gap-16">
          {[[grants.toLocaleString(), "Grants Discovered"], [platforms, "Platforms Connected"], [screened, "Benefits Screened at Once"]].map(([n, l]) => (
            <div key={String(l)} className="text-center">
              <div className="text-3xl font-black" style={{ color: "#fb923c" }}>{n}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(254,243,199,0.45)" }}>{String(l)}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeFloat0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes fadeFloat1 { 0%, 100% { transform: translateY(-4px); } 50% { transform: translateY(6px); } }
        @keyframes fadeFloat2 { 0%, 100% { transform: translateY(3px); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}
