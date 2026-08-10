/**
 * Inline SVG concept diagrams for Trade Sims lessons.
 *
 * Each diagram is a small, self-contained, animated SVG that TEACHES the
 * concept it is named after. They are theme-aware (they use `currentColor`
 * and Tailwind text-* utilities via a wrapper) and mobile-first (viewBox +
 * width:100% so they scale crisply to 375px).
 *
 * ANTI-FABRICATION (fable-standard applies to visuals): every number, arrow
 * direction, and geometric relationship below is technically correct for the
 * trade concept. Labels reuse the lesson's own units (V/I/R, psi/head, mA,
 * CFM, °F, etc.). No decorative lies, no wrong physics.
 *
 * Motion is done with SMIL (<animate>/<animateMotion>) so it works without
 * any JS and pauses cleanly when the tab is hidden.
 */

import type { ReactNode } from "react";

// Shared palette — kept close to the app's tailwind tokens so diagrams sit
// naturally in the Concept card in both light and dark mode.
const C = {
  ink: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  primary: "hsl(var(--primary))",
  stroke: "hsl(var(--border))",
  amber: "#f59e0b",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  red: "#ef4444",
  green: "#10b981",
  slate: "#64748b",
  violet: "#8b5cf6",
} as const;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      role="img"
      aria-label={label}
      className="w-full h-auto"
      style={{ maxHeight: 260 }}
    >
      {children}
    </svg>
  );
}

/** Reusable moving-dot along a path (electron / water flow). */
function FlowDots({ pathId, color, count = 3, dur = 2 }: { pathId: string; color: string; count?: number; dur?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r="3.2" fill={color}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${(i * dur) / count}s`}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

// ─── OHM'S LAW: V = I × R ─────────────────────────────────────────────
function OhmsLaw() {
  return (
    <Frame label="Ohm's Law circuit: 9 volt battery drives 9 milliamps through a 1 kilo-ohm resistor">
      {/* loop wire */}
      <path id="ohm-loop" d="M60 40 H260 V140 H60 Z" fill="none" stroke={C.slate} strokeWidth="3" />
      <FlowDots pathId="ohm-loop" color={C.amber} dur={2.2} />
      {/* battery on left */}
      <line x1="60" y1="78" x2="60" y2="90" stroke={C.ink} strokeWidth="6" />
      <line x1="60" y1="92" x2="60" y2="102" stroke={C.ink} strokeWidth="14" />
      <text x="30" y="72" fontSize="11" fill={C.muted}>+</text>
      <text x="30" y="118" fontSize="11" fill={C.muted}>−</text>
      <text x="14" y="94" fontSize="12" fill={C.ink} fontWeight="bold">9V</text>
      {/* resistor on right (zig-zag) */}
      <polyline
        points="260,70 252,76 268,84 252,92 268,100 252,108 260,114"
        fill="none"
        stroke={C.red}
        strokeWidth="3"
      />
      <text x="276" y="94" fontSize="12" fill={C.ink} fontWeight="bold">1kΩ</text>
      {/* readout */}
      <text x="160" y="24" fontSize="13" fill={C.primary} textAnchor="middle" fontWeight="bold">
        V = I × R
      </text>
      <text x="160" y="165" fontSize="12" fill={C.muted} textAnchor="middle">
        9V ÷ 1000Ω = 9 mA
      </text>
    </Frame>
  );
}

// ─── SERIES vs PARALLEL ───────────────────────────────────────────────
function SeriesParallel() {
  return (
    <Frame label="Series versus parallel: series shares one current path, parallel splits into two branches">
      <text x="80" y="20" fontSize="11" fill={C.ink} textAnchor="middle" fontWeight="bold">SERIES</text>
      <text x="240" y="20" fontSize="11" fill={C.ink} textAnchor="middle" fontWeight="bold">PARALLEL</text>
      {/* series: one loop through two resistors */}
      <path id="ser-loop" d="M30 60 H130 V130 H30 Z" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <FlowDots pathId="ser-loop" color={C.amber} count={2} dur={2.5} />
      <rect x="55" y="52" width="20" height="16" fill={C.red} rx="2" />
      <rect x="95" y="52" width="20" height="16" fill={C.red} rx="2" />
      <text x="80" y="150" fontSize="9" fill={C.muted} textAnchor="middle">same current, everywhere</text>
      {/* parallel: two branches */}
      <path d="M190 55 H300" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <path d="M190 130 H300" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <path id="par-a" d="M215 55 V130" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <path id="par-b" d="M275 55 V130" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <rect x="207" y="82" width="16" height="20" fill={C.red} rx="2" />
      <rect x="267" y="82" width="16" height="20" fill={C.red} rx="2" />
      <FlowDots pathId="par-a" color={C.amber} count={1} dur={1.8} />
      <FlowDots pathId="par-b" color={C.amber} count={1} dur={1.8} />
      <text x="245" y="150" fontSize="9" fill={C.muted} textAnchor="middle">current splits per branch</text>
    </Frame>
  );
}

// ─── AC SINE WAVE ─────────────────────────────────────────────────────
function AcSine() {
  return (
    <Frame label="Alternating current: voltage swings above and below zero as a sine wave, 60 hertz in the US">
      <line x1="20" y1="90" x2="300" y2="90" stroke={C.stroke} strokeWidth="1.5" />
      <text x="308" y="94" fontSize="9" fill={C.muted}>0V</text>
      <path
        d="M20 90 Q50 20 80 90 T140 90 T200 90 T260 90 T320 90"
        fill="none"
        stroke={C.violet}
        strokeWidth="3"
      />
      {/* moving marker riding the wave */}
      <circle r="4" fill={C.amber}>
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href="#ac-wave-path" />
        </animateMotion>
      </circle>
      <path id="ac-wave-path" d="M20 90 Q50 20 80 90 T140 90 T200 90 T260 90 T320 90" fill="none" stroke="none" />
      <text x="160" y="165" fontSize="11" fill={C.muted} textAnchor="middle">
        AC reverses 120×/sec → 60 Hz
      </text>
    </Frame>
  );
}

// ─── CAPACITOR CHARGE ─────────────────────────────────────────────────
function Capacitor() {
  return (
    <Frame label="Capacitor storing charge: electrons build up on two plates separated by a gap">
      {/* left plate holds + charge (red), right plate − (blue) */}
      <line x1="120" y1="50" x2="120" y2="130" stroke={C.red} strokeWidth="4" />
      <line x1="145" y1="50" x2="145" y2="130" stroke={C.blue} strokeWidth="4" />
      {/* + charges */}
      {[65, 85, 105].map((y) => (
        <text key={`p${y}`} x="108" y={y} fontSize="13" fill={C.red}>+</text>
      ))}
      {[65, 85, 105].map((y) => (
        <text key={`n${y}`} x="150" y={y} fontSize="13" fill={C.blue}>−</text>
      ))}
      {/* charging animation: opacity fill */}
      <rect x="122" y="50" width="21" height="80" fill={C.amber} opacity="0.15">
        <animate attributeName="opacity" values="0;0.35;0" dur="3s" repeatCount="indefinite" />
      </rect>
      <text x="132" y="30" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">C = Q / V</text>
      <text x="132" y="155" fontSize="11" fill={C.muted} textAnchor="middle">stores charge, resists voltage change</text>
    </Frame>
  );
}

// ─── INDUCTOR (magnetic field) ────────────────────────────────────────
function Inductor() {
  return (
    <Frame label="Inductor: current through a coil builds a magnetic field that resists change in current">
      <path
        d="M60 100 q10 -30 20 0 q10 -30 20 0 q10 -30 20 0 q10 -30 20 0 q10 -30 20 0"
        fill="none"
        stroke={C.slate}
        strokeWidth="3"
      />
      <line x1="40" y1="100" x2="60" y2="100" stroke={C.slate} strokeWidth="3" />
      <line x1="160" y1="100" x2="180" y2="100" stroke={C.slate} strokeWidth="3" />
      {/* field loops pulsing */}
      {[[110, 74, 34], [110, 74, 50]].map(([cx, cy, r], i) => (
        <ellipse key={i} cx={cx} cy={cy + 26} rx={r} ry={r * 0.5} fill="none" stroke={C.cyan} strokeWidth="1.5" opacity="0.6">
          <animate attributeName="opacity" values="0.15;0.7;0.15" dur="2.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      <text x="110" y="40" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">V = L × dI/dt</text>
      <text x="110" y="160" fontSize="11" fill={C.muted} textAnchor="middle">coil resists current change</text>
    </Frame>
  );
}

// ─── NPN / PNP TRANSISTOR ─────────────────────────────────────────────
function Transistor({ pnp }: { pnp?: boolean }) {
  return (
    <Frame label={`${pnp ? "PNP" : "NPN"} transistor: small base current switches a large collector-emitter current`}>
      {/* base bar */}
      <line x1="130" y1="55" x2="130" y2="125" stroke={C.ink} strokeWidth="5" />
      {/* base lead */}
      <line x1="80" y1="90" x2="130" y2="90" stroke={C.slate} strokeWidth="2.5" />
      <text x="60" y="94" fontSize="11" fill={C.ink}>B</text>
      {/* collector */}
      <line x1="130" y1="65" x2="180" y2="45" stroke={C.slate} strokeWidth="2.5" />
      <text x="185" y="45" fontSize="11" fill={C.ink}>C</text>
      {/* emitter with arrow */}
      <line x1="130" y1="115" x2="180" y2="135" stroke={C.slate} strokeWidth="2.5" />
      <polygon
        points={pnp ? "150,124 138,120 146,132" : "164,131 172,124 174,135"}
        fill={C.ink}
      />
      <text x="185" y="140" fontSize="11" fill={C.ink}>E</text>
      {/* small base flow, large C-E flow */}
      <path id="tr-base" d="M80 90 H128" fill="none" stroke="none" />
      <FlowDots pathId="tr-base" color={C.green} count={1} dur={3} />
      <path id="tr-ce" d="M180 45 L131 60 M131 120 L180 135" fill="none" stroke="none" />
      <text x="160" y="24" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">
        {pnp ? "PNP (active-low)" : "NPN (active-high)"}
      </text>
      <text x="160" y="165" fontSize="10" fill={C.muted} textAnchor="middle">tiny base current → big C–E current</text>
    </Frame>
  );
}

// ─── LOGIC GATE (AND) ─────────────────────────────────────────────────
function LogicGate() {
  return (
    <Frame label="Logic gate: an AND gate outputs 1 only when both inputs are 1">
      {/* AND gate shape */}
      <path d="M110 55 H150 A35 35 0 0 1 150 125 H110 Z" fill="none" stroke={C.ink} strokeWidth="2.5" />
      <line x1="80" y1="72" x2="110" y2="72" stroke={C.slate} strokeWidth="2.5" />
      <line x1="80" y1="108" x2="110" y2="108" stroke={C.slate} strokeWidth="2.5" />
      <line x1="185" y1="90" x2="215" y2="90" stroke={C.slate} strokeWidth="2.5" />
      <text x="70" y="76" fontSize="12" fill={C.ink} textAnchor="end">A</text>
      <text x="70" y="112" fontSize="12" fill={C.ink} textAnchor="end">B</text>
      <text x="222" y="94" fontSize="12" fill={C.ink}>Y</text>
      <text x="150" y="94" fontSize="12" fill={C.muted} textAnchor="middle">AND</text>
      {/* toggling truth: both must be 1 */}
      <text x="70" y="150" fontSize="10" fill={C.green} textAnchor="middle">
        <animate attributeName="fill" values={`${C.green};${C.slate};${C.green}`} dur="3s" repeatCount="indefinite" />
        1·1=1
      </text>
      <text x="160" y="24" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">Y = A AND B</text>
    </Frame>
  );
}

// ─── SAFETY / GROUNDING ───────────────────────────────────────────────
function Grounding() {
  return (
    <Frame label="Grounding path: fault current returns safely to earth instead of through a person">
      <rect x="40" y="50" width="70" height="80" rx="4" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <text x="75" y="95" fontSize="10" fill={C.muted} textAnchor="middle">device</text>
      {/* hot */}
      <line x1="40" y1="65" x2="15" y2="65" stroke={C.red} strokeWidth="2.5" />
      <text x="10" y="60" fontSize="9" fill={C.red}>L</text>
      {/* ground wire green */}
      <path id="gnd-path" d="M110 120 H160 V150" fill="none" stroke={C.green} strokeWidth="3" />
      <FlowDots pathId="gnd-path" color={C.green} count={2} dur={1.6} />
      {/* ground symbol */}
      <line x1="145" y1="150" x2="175" y2="150" stroke={C.ink} strokeWidth="2.5" />
      <line x1="150" y1="156" x2="170" y2="156" stroke={C.ink} strokeWidth="2.5" />
      <line x1="155" y1="162" x2="165" y2="162" stroke={C.ink} strokeWidth="2.5" />
      <text x="230" y="90" fontSize="11" fill={C.ink} textAnchor="middle">fault current</text>
      <text x="230" y="106" fontSize="11" fill={C.green} textAnchor="middle" fontWeight="bold">→ earth, not you</text>
    </Frame>
  );
}

// ─── SCHEMATIC READING ────────────────────────────────────────────────
function Schematic() {
  return (
    <Frame label="Schematic symbols map to real parts: battery, resistor, switch, lamp">
      {/* battery symbol */}
      <line x1="40" y1="45" x2="40" y2="65" stroke={C.ink} strokeWidth="2" />
      <line x1="46" y1="50" x2="46" y2="60" stroke={C.ink} strokeWidth="5" />
      <text x="43" y="82" fontSize="9" fill={C.muted} textAnchor="middle">battery</text>
      {/* resistor */}
      <polyline points="110,45 116,50 104,55 116,60 104,60 116,63" fill="none" stroke={C.ink} strokeWidth="1.8" />
      <text x="110" y="82" fontSize="9" fill={C.muted} textAnchor="middle">resistor</text>
      {/* switch */}
      <circle cx="175" cy="55" r="2.5" fill={C.ink} />
      <circle cx="200" cy="55" r="2.5" fill={C.ink} />
      <line x1="175" y1="55" x2="197" y2="44" stroke={C.ink} strokeWidth="2" />
      <text x="188" y="82" fontSize="9" fill={C.muted} textAnchor="middle">switch</text>
      {/* lamp */}
      <circle cx="265" cy="55" r="12" fill="none" stroke={C.ink} strokeWidth="2" />
      <line x1="257" y1="47" x2="273" y2="63" stroke={C.ink} strokeWidth="1.5" />
      <line x1="273" y1="47" x2="257" y2="63" stroke={C.ink} strokeWidth="1.5" />
      <text x="265" y="82" fontSize="9" fill={C.muted} textAnchor="middle">lamp</text>
      <text x="160" y="120" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">
        symbols → real parts
      </text>
      <text x="160" y="145" fontSize="10" fill={C.muted} textAnchor="middle">read left-to-right, source to load</text>
    </Frame>
  );
}

// ─── TROUBLESHOOTING (divide & test) ──────────────────────────────────
function Troubleshoot() {
  return (
    <Frame label="Troubleshooting: split the system in half, test the midpoint, follow the failing side">
      <line x1="30" y1="90" x2="290" y2="90" stroke={C.slate} strokeWidth="3" />
      {[30, 90, 160, 230, 290].map((x, i) => (
        <circle key={i} cx={x} cy={90} r="6" fill={i === 2 ? C.amber : C.slate} />
      ))}
      {/* meter at midpoint */}
      <circle cx="160" cy="55" r="14" fill="none" stroke={C.primary} strokeWidth="2" />
      <text x="160" y="59" fontSize="9" fill={C.primary} textAnchor="middle">V?</text>
      <line x1="160" y1="69" x2="160" y2="84" stroke={C.primary} strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M160 120 L120 145 M160 120 L200 145" stroke={C.muted} strokeWidth="1.5" fill="none" markerEnd="" />
      <text x="112" y="160" fontSize="9" fill={C.green} textAnchor="middle">good side</text>
      <text x="210" y="160" fontSize="9" fill={C.red} textAnchor="middle">fault side</text>
      <text x="160" y="24" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">split-half testing</text>
    </Frame>
  );
}

// ─── PLUMBING: PIPE SIZING / FRICTION ─────────────────────────────────
function PipeFriction() {
  return (
    <Frame label="Pipe friction loss: narrower or longer pipe drops more pressure between the two gauges">
      {/* wide pipe top */}
      <rect x="30" y="45" width="260" height="26" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      <path id="pf-wide" d="M30 58 H290" fill="none" stroke="none" />
      <FlowDots pathId="pf-wide" color={C.blue} count={4} dur={1.6} />
      <text x="18" y="62" fontSize="10" fill={C.ink} textAnchor="end">¾″</text>
      {/* narrow pipe bottom */}
      <rect x="30" y="110" width="260" height="12" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      <path id="pf-narrow" d="M30 116 H290" fill="none" stroke="none" />
      <FlowDots pathId="pf-narrow" color={C.blue} count={4} dur={2.8} />
      <text x="18" y="120" fontSize="10" fill={C.ink} textAnchor="end">½″</text>
      <text x="55" y="35" fontSize="10" fill={C.green} textAnchor="middle">low loss</text>
      <text x="55" y="145" fontSize="10" fill={C.red} textAnchor="middle">high loss</text>
      <text x="245" y="35" fontSize="10" fill={C.muted} textAnchor="middle">psi ↓</text>
      <text x="160" y="168" fontSize="10" fill={C.muted} textAnchor="middle">smaller / longer pipe = more friction = more pressure drop</text>
    </Frame>
  );
}

// ─── PLUMBING: BACKFLOW / CHECK VALVE ─────────────────────────────────
function Backflow() {
  return (
    <Frame label="Check valve stops backflow: it opens with forward flow and closes against reverse flow">
      <rect x="30" y="80" width="120" height="20" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      <rect x="190" y="80" width="100" height="20" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      {/* check valve body */}
      <circle cx="170" cy="90" r="22" fill="none" stroke={C.ink} strokeWidth="2" />
      {/* flap: open toward forward flow */}
      <line x1="170" y1="72" x2="184" y2="90" stroke={C.green} strokeWidth="3">
        <animate attributeName="x2" values="184;170;184" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" values="90;108;90" dur="3s" repeatCount="indefinite" />
      </line>
      <path id="bf-fwd" d="M30 90 H148" fill="none" stroke="none" />
      <FlowDots pathId="bf-fwd" color={C.blue} count={3} dur={1.8} />
      <text x="90" y="65" fontSize="10" fill={C.green} textAnchor="middle">forward → opens</text>
      <text x="240" y="65" fontSize="10" fill={C.red} textAnchor="middle">reverse → seals shut</text>
      {/* reverse blocked arrow */}
      <line x1="230" y1="120" x2="200" y2="120" stroke={C.red} strokeWidth="2.5" markerEnd="url(#bf-arrow)" />
      <defs>
        <marker id="bf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill={C.red} />
        </marker>
      </defs>
      <line x1="192" y1="112" x2="192" y2="128" stroke={C.red} strokeWidth="3" />
      <text x="160" y="165" fontSize="10" fill={C.muted} textAnchor="middle">protects potable supply from contamination</text>
    </Frame>
  );
}

// ─── PLUMBING: DRAIN / VENT (P-TRAP) ──────────────────────────────────
function DrainVent() {
  return (
    <Frame label="P-trap and vent: the trap holds a water seal; the vent lets air in so the seal is not siphoned">
      {/* drain down */}
      <path d="M80 40 V95 Q80 125 110 125 Q140 125 140 95 V70" fill="none" stroke={C.slate} strokeWidth="6" />
      {/* water seal in trap */}
      <path d="M92 108 Q110 122 128 108 L128 118 Q110 132 92 118 Z" fill={C.blue} opacity="0.5" />
      <text x="110" y="150" fontSize="10" fill={C.blue} textAnchor="middle">water seal</text>
      {/* vent up */}
      <line x1="140" y1="70" x2="140" y2="35" stroke={C.slate} strokeWidth="6" />
      <path id="dv-air" d="M140 40 V66" fill="none" stroke="none" />
      <FlowDots pathId="dv-air" color={C.cyan} count={2} dur={2} />
      <text x="165" y="45" fontSize="10" fill={C.cyan}>air in (vent)</text>
      <text x="60" y="35" fontSize="10" fill={C.muted} textAnchor="middle">from fixture</text>
      <text x="240" y="110" fontSize="10" fill={C.muted} textAnchor="middle">trap seal blocks</text>
      <text x="240" y="126" fontSize="10" fill={C.muted} textAnchor="middle">sewer gas</text>
    </Frame>
  );
}

// ─── PLUMBING: FIXTURE UNITS / DEMAND ─────────────────────────────────
function FixtureUnits() {
  return (
    <Frame label="Fixture units: each fixture adds demand; total WSFU sizes the supply pipe">
      {/* WSFU values match the lesson: lavatory 1, tank toilet 2.2, shower 2 */}
      {[["lavatory", 1, 55], ["toilet", 2.2, 160], ["shower", 2, 260]].map(
        ([name, wsfu, x], i) => (
          <g key={i}>
            <rect x={Number(x) - 18} y="55" width="36" height="24" rx="3" fill={C.blue} opacity="0.2" stroke={C.blue} strokeWidth="1.5" />
            <text x={x} y="71" fontSize="9" fill={C.ink} textAnchor="middle">{name}</text>
            <text x={x} y="95" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">{wsfu} WSFU</text>
          </g>
        ),
      )}
      <line x1="30" y1="120" x2="290" y2="120" stroke={C.blue} strokeWidth="6" />
      <text x="160" y="145" fontSize="11" fill={C.ink} textAnchor="middle">Σ = 5.2 WSFU → size the main</text>
      <text x="160" y="165" fontSize="9" fill={C.muted} textAnchor="middle">demand isn't additive gpm — use the WSFU curve</text>
    </Frame>
  );
}

// ─── PLUMBING: PRESSURE REGULATOR ─────────────────────────────────────
function PressureRegulator() {
  return (
    <Frame label="Pressure-reducing valve: high street pressure in, steady lower pressure out">
      <rect x="30" y="82" width="90" height="16" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      <rect x="200" y="84" width="90" height="12" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      {/* PRV body */}
      <rect x="120" y="60" width="80" height="60" rx="6" fill="none" stroke={C.ink} strokeWidth="2.5" />
      <path d="M145 90 L175 90 M160 75 L160 105" stroke={C.slate} strokeWidth="2" />
      <text x="160" y="52" fontSize="10" fill={C.muted} textAnchor="middle">PRV</text>
      <path id="prv-in" d="M30 90 H118" fill="none" stroke="none" />
      <FlowDots pathId="prv-in" color={C.red} count={4} dur={1.4} />
      <path id="prv-out" d="M202 90 H290" fill="none" stroke="none" />
      <FlowDots pathId="prv-out" color={C.green} count={3} dur={2.4} />
      <text x="70" y="140" fontSize="11" fill={C.red} textAnchor="middle" fontWeight="bold">80 psi in</text>
      <text x="250" y="140" fontSize="11" fill={C.green} textAnchor="middle" fontWeight="bold">50 psi out</text>
    </Frame>
  );
}

// ─── HVAC: HEAT TRANSFER ──────────────────────────────────────────────
function HeatTransfer() {
  return (
    <Frame label="Heat transfer: heat always moves from hot to cold — conduction, convection, radiation">
      <rect x="30" y="55" width="60" height="70" fill={C.red} opacity="0.3" stroke={C.red} strokeWidth="1.5" />
      <text x="60" y="95" fontSize="11" fill={C.red} textAnchor="middle" fontWeight="bold">HOT</text>
      <text x="60" y="112" fontSize="9" fill={C.muted} textAnchor="middle">22°C indoor</text>
      <rect x="230" y="55" width="60" height="70" fill={C.blue} opacity="0.3" stroke={C.blue} strokeWidth="1.5" />
      <text x="260" y="95" fontSize="11" fill={C.blue} textAnchor="middle" fontWeight="bold">COLD</text>
      <text x="260" y="112" fontSize="9" fill={C.muted} textAnchor="middle">−5°C outdoor</text>
      <path id="ht-flow" d="M92 90 H228" fill="none" stroke="none" />
      <FlowDots pathId="ht-flow" color={C.amber} count={4} dur={2} />
      <line x1="92" y1="90" x2="226" y2="90" stroke={C.amber} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
      <text x="160" y="30" fontSize="12" fill={C.primary} textAnchor="middle" fontWeight="bold">heat flows hot → cold</text>
      <text x="160" y="150" fontSize="10" fill={C.muted} textAnchor="middle">Q = U × A × ΔT</text>
    </Frame>
  );
}

// ─── HVAC: SENSIBLE vs LATENT ─────────────────────────────────────────
function SensibleLatent() {
  return (
    <Frame label="Sensible versus latent heat: sensible changes temperature, latent changes moisture">
      <line x1="40" y1="130" x2="290" y2="130" stroke={C.stroke} strokeWidth="1.5" />
      {/* sensible ramp */}
      <line x1="40" y1="120" x2="130" y2="60" stroke={C.red} strokeWidth="3" />
      <text x="85" y="50" fontSize="10" fill={C.red} textAnchor="middle">sensible (°F ↑)</text>
      {/* latent plateau */}
      <line x1="130" y1="60" x2="230" y2="60" stroke={C.cyan} strokeWidth="3" />
      <text x="180" y="50" fontSize="10" fill={C.cyan} textAnchor="middle">latent (moisture)</text>
      <circle r="3.5" fill={C.amber}>
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M40 120 L130 60 L230 60" />
      </circle>
      <text x="40" y="148" fontSize="9" fill={C.muted}>heat added →</text>
      <text x="160" y="165" fontSize="10" fill={C.muted} textAnchor="middle">total load = sensible + latent (Btu/h)</text>
    </Frame>
  );
}

// ─── HVAC: DUCT / STATIC PRESSURE ─────────────────────────────────────
function DuctStatic() {
  return (
    <Frame label="Duct sizing: too-small duct raises static pressure and cuts airflow in CFM">
      <rect x="30" y="50" width="180" height="34" fill={C.slate} opacity="0.2" stroke={C.slate} strokeWidth="1.5" />
      {/* transition to smaller */}
      <path d="M210 50 L250 62 L250 72 L210 84 Z" fill={C.slate} opacity="0.2" stroke={C.slate} strokeWidth="1.5" />
      <rect x="250" y="62" width="40" height="10" fill={C.slate} opacity="0.2" stroke={C.slate} strokeWidth="1.5" />
      <path id="ds-flow" d="M30 67 H288" fill="none" stroke="none" />
      <FlowDots pathId="ds-flow" color={C.cyan} count={5} dur={2} />
      <text x="120" y="42" fontSize="10" fill={C.green} textAnchor="middle">large duct · low static</text>
      <text x="255" y="100" fontSize="9" fill={C.red} textAnchor="middle">restriction</text>
      <text x="160" y="130" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">airflow (CFM) vs static (in. w.c.)</text>
      <text x="160" y="152" fontSize="9" fill={C.muted} textAnchor="middle">undersized duct → high static → less CFM delivered</text>
    </Frame>
  );
}

// ─── HVAC: PSYCHROMETRICS ─────────────────────────────────────────────
function Psychrometric() {
  return (
    <Frame label="Psychrometric chart: dry-bulb temperature versus humidity, with the saturation curve">
      <line x1="40" y1="140" x2="290" y2="140" stroke={C.stroke} strokeWidth="1.5" />
      <line x1="40" y1="140" x2="40" y2="35" stroke={C.stroke} strokeWidth="1.5" />
      <path d="M40 135 Q120 120 200 70 Q240 45 280 35" fill="none" stroke={C.cyan} strokeWidth="2.5" />
      <text x="150" y="90" fontSize="9" fill={C.cyan}>100% RH (saturation)</text>
      <circle cx="150" cy="110" r="4" fill={C.amber}>
        <animate attributeName="cy" values="110;100;110" dur="3s" repeatCount="indefinite" />
      </circle>
      <text x="160" y="122" fontSize="9" fill={C.ink}>comfort zone</text>
      <text x="165" y="158" fontSize="10" fill={C.muted} textAnchor="middle">dry-bulb °C →</text>
      <text x="24" y="90" fontSize="10" fill={C.muted} transform="rotate(-90 24 90)">humidity ratio →</text>
    </Frame>
  );
}

// ─── HVAC: COMBUSTION SAFETY ──────────────────────────────────────────
function Combustion() {
  return (
    <Frame label="Gas combustion: fuel plus air burns to CO2 and water; incomplete burn makes deadly CO">
      <path d="M110 120 Q100 90 130 80 Q120 60 145 55 Q150 75 165 70 Q170 100 150 120 Z" fill={C.amber} opacity="0.7">
        <animate attributeName="opacity" values="0.5;0.85;0.5" dur="1.2s" repeatCount="indefinite" />
      </path>
      <text x="65" y="95" fontSize="10" fill={C.ink} textAnchor="middle">gas + air</text>
      <line x1="90" y1="95" x2="108" y2="95" stroke={C.slate} strokeWidth="2" markerEnd="url(#cb-arr)" />
      <defs>
        <marker id="cb-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={C.slate} /></marker>
      </defs>
      <text x="230" y="70" fontSize="10" fill={C.green} textAnchor="middle">complete → CO₂ + H₂O</text>
      <text x="230" y="110" fontSize="10" fill={C.red} textAnchor="middle" fontWeight="bold">incomplete → CO ☠</text>
      <text x="160" y="160" fontSize="9" fill={C.muted} textAnchor="middle">blue flame = good air/fuel · yellow/soot = CO risk</text>
    </Frame>
  );
}

// ─── HVAC: HEAT PUMP ──────────────────────────────────────────────────
function HeatPump() {
  return (
    <Frame label="Heat pump: a reversing valve swaps indoor and outdoor coils to heat or cool">
      <circle cx="70" cy="90" r="30" fill="none" stroke={C.blue} strokeWidth="2" />
      <text x="70" y="88" fontSize="9" fill={C.ink} textAnchor="middle">outdoor</text>
      <text x="70" y="102" fontSize="9" fill={C.muted} textAnchor="middle">coil</text>
      <circle cx="250" cy="90" r="30" fill="none" stroke={C.red} strokeWidth="2" />
      <text x="250" y="88" fontSize="9" fill={C.ink} textAnchor="middle">indoor</text>
      <text x="250" y="102" fontSize="9" fill={C.muted} textAnchor="middle">coil</text>
      <path id="hp-loop" d="M100 78 H220 M220 102 H100" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <FlowDots pathId="hp-loop" color={C.violet} count={3} dur={2.4} />
      <text x="160" y="70" fontSize="9" fill={C.violet} textAnchor="middle">refrigerant loop</text>
      <text x="160" y="140" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">reversing valve flips heat/cool</text>
      <text x="160" y="160" fontSize="9" fill={C.muted} textAnchor="middle">moves heat, doesn't create it (COP &gt; 1)</text>
    </Frame>
  );
}

// ─── WELDING: PROCESS OVERVIEW ────────────────────────────────────────
function WeldProcess() {
  return (
    <Frame label="Arc welding: an electric arc melts filler and base metal to fuse two pieces">
      <rect x="30" y="100" width="120" height="24" fill={C.slate} opacity="0.4" />
      <rect x="170" y="100" width="120" height="24" fill={C.slate} opacity="0.4" />
      {/* electrode */}
      <line x1="160" y1="40" x2="160" y2="88" stroke={C.ink} strokeWidth="5" />
      {/* arc */}
      <line x1="160" y1="88" x2="160" y2="100" stroke={C.amber} strokeWidth="3">
        <animate attributeName="stroke" values={`${C.amber};#fff;${C.amber}`} dur="0.4s" repeatCount="indefinite" />
      </line>
      <circle cx="160" cy="100" r="6" fill={C.amber} opacity="0.8">
        <animate attributeName="r" values="5;8;5" dur="0.5s" repeatCount="indefinite" />
      </circle>
      {/* weld pool */}
      <ellipse cx="160" cy="103" rx="16" ry="5" fill={C.red} opacity="0.6" />
      <text x="160" y="30" fontSize="10" fill={C.muted} textAnchor="middle">electrode</text>
      <text x="70" y="145" fontSize="10" fill={C.muted} textAnchor="middle">base metal</text>
      <text x="230" y="145" fontSize="10" fill={C.muted} textAnchor="middle">base metal</text>
      <text x="215" y="103" fontSize="9" fill={C.red}>weld pool</text>
    </Frame>
  );
}

// ─── WELDING: JOINT / WELD SYMBOLS ────────────────────────────────────
function WeldSymbols() {
  return (
    <Frame label="Welding symbol: the reference line, arrow, and fillet triangle tell where and how big to weld">
      <line x1="60" y1="70" x2="230" y2="70" stroke={C.ink} strokeWidth="2" />
      <line x1="230" y1="70" x2="270" y2="95" stroke={C.ink} strokeWidth="2" markerEnd="url(#ws-arr)" />
      <defs>
        <marker id="ws-arr" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill={C.ink} /></marker>
      </defs>
      {/* fillet triangle below line (arrow side) */}
      <path d="M120 70 L132 70 L120 86 Z" fill={C.red} />
      <text x="145" y="86" fontSize="10" fill={C.ink}>¼″ fillet</text>
      <text x="90" y="60" fontSize="9" fill={C.muted}>reference line</text>
      <text x="255" y="112" fontSize="9" fill={C.muted}>arrow → joint</text>
      <text x="160" y="140" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">symbol below line = arrow-side weld</text>
    </Frame>
  );
}

// ─── WELDING: FILLET WELD GEOMETRY ────────────────────────────────────
function FilletWeld() {
  return (
    <Frame label="Fillet weld: leg size and throat on a T-joint between two plates">
      {/* vertical plate */}
      <rect x="70" y="30" width="24" height="110" fill={C.slate} opacity="0.4" />
      {/* horizontal plate */}
      <rect x="70" y="116" width="180" height="24" fill={C.slate} opacity="0.4" />
      {/* fillet triangle */}
      <path d="M94 116 L94 82 L138 116 Z" fill={C.red} opacity="0.7" stroke={C.red} strokeWidth="1.5" />
      {/* leg dimensions */}
      <line x1="94" y1="82" x2="94" y2="116" stroke={C.green} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="60" y="102" fontSize="9" fill={C.green} textAnchor="end">leg</text>
      <line x1="94" y1="116" x2="138" y2="116" stroke={C.green} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="116" y="152" fontSize="9" fill={C.green} textAnchor="middle">leg</text>
      {/* throat */}
      <line x1="94" y1="90" x2="115" y2="112" stroke={C.blue} strokeWidth="1.5" />
      <text x="150" y="95" fontSize="9" fill={C.blue}>throat ≈ 0.707 × leg</text>
      <text x="160" y="24" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">fillet weld on a T-joint</text>
    </Frame>
  );
}

// ─── WELDING: DISTORTION ──────────────────────────────────────────────
function Distortion() {
  return (
    <Frame label="Welding distortion: heat shrinks the weld side and pulls the plate out of flat">
      <path d="M40 100 Q160 60 280 100" fill="none" stroke={C.slate} strokeWidth="10" opacity="0.5" />
      <path d="M40 100 Q160 60 280 100" fill="none" stroke={C.red} strokeWidth="2" strokeDasharray="4 3">
        <animate attributeName="d" values="M40 100 L280 100;M40 100 Q160 60 280 100;M40 100 L280 100" dur="4s" repeatCount="indefinite" />
      </path>
      <text x="160" y="55" fontSize="10" fill={C.red} textAnchor="middle">weld cools & shrinks → pulls up</text>
      <text x="160" y="140" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">control: tack, sequence, clamp, preheat</text>
    </Frame>
  );
}

// ─── WELDING: INSPECTION / DEFECTS ────────────────────────────────────
function WeldDefects() {
  return (
    <Frame label="Weld defects: undercut, porosity, and lack of fusion versus a sound weld bead">
      <rect x="30" y="80" width="260" height="30" fill={C.slate} opacity="0.3" />
      {/* good bead */}
      <path d="M45 80 q15 -14 30 0" fill={C.green} opacity="0.6" />
      <text x="60" y="130" fontSize="8" fill={C.green} textAnchor="middle">sound</text>
      {/* porosity */}
      <circle cx="140" cy="92" r="3" fill="none" stroke={C.red} strokeWidth="1.5" />
      <circle cx="150" cy="98" r="2" fill="none" stroke={C.red} strokeWidth="1.5" />
      <text x="145" y="130" fontSize="8" fill={C.red} textAnchor="middle">porosity</text>
      {/* undercut */}
      <path d="M215 80 q10 8 0 12" fill="none" stroke={C.red} strokeWidth="2" />
      <text x="220" y="130" fontSize="8" fill={C.red} textAnchor="middle">undercut</text>
      <text x="160" y="30" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">visual inspection catches these</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: BATTERY / CHARGING ───────────────────────────────────
function BatteryCharging() {
  return (
    <Frame label="Charging system: alternator recharges the 12V battery and powers the car's loads">
      <rect x="30" y="70" width="60" height="50" rx="4" fill="none" stroke={C.ink} strokeWidth="2" />
      <text x="60" y="92" fontSize="10" fill={C.ink} textAnchor="middle">battery</text>
      <text x="60" y="108" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">12.6V</text>
      <circle cx="250" cy="90" r="28" fill="none" stroke={C.slate} strokeWidth="2" />
      <text x="250" y="88" fontSize="9" fill={C.ink} textAnchor="middle">alternator</text>
      <text x="250" y="102" fontSize="10" fill={C.green} textAnchor="middle" fontWeight="bold">14.2V</text>
      <path id="ac-charge" d="M222 90 H92" fill="none" stroke="none" />
      <FlowDots pathId="ac-charge" color={C.amber} count={3} dur={1.8} />
      <text x="160" y="70" fontSize="9" fill={C.muted} textAnchor="middle">charge current</text>
      <text x="160" y="150" fontSize="9" fill={C.muted} textAnchor="middle">alternator (running) &gt; battery → it charges</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: STARTING SYSTEM ──────────────────────────────────────
function StartingSystem() {
  return (
    <Frame label="Starter draws very high current briefly, so a weak battery sags in voltage">
      <rect x="30" y="70" width="55" height="50" rx="4" fill="none" stroke={C.ink} strokeWidth="2" />
      <text x="57" y="92" fontSize="9" fill={C.ink} textAnchor="middle">battery</text>
      <circle cx="240" cy="95" r="30" fill="none" stroke={C.slate} strokeWidth="2" />
      <text x="240" y="99" fontSize="9" fill={C.ink} textAnchor="middle">starter</text>
      <path id="ss-flow" d="M85 95 H210" fill="none" stroke="none" />
      <FlowDots pathId="ss-flow" color={C.red} count={5} dur={1.1} />
      <text x="150" y="78" fontSize="10" fill={C.red} textAnchor="middle" fontWeight="bold">~150–250 A</text>
      <text x="150" y="150" fontSize="9" fill={C.muted} textAnchor="middle">high draw → weak battery voltage sags below 9.6V</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: OBD2 / DTC ───────────────────────────────────────────
function Obd2() {
  return (
    <Frame label="OBD-II: the ECU stores a diagnostic trouble code like P0301 you read with a scan tool">
      <rect x="60" y="55" width="90" height="60" rx="6" fill="none" stroke={C.slate} strokeWidth="2" />
      <text x="105" y="80" fontSize="9" fill={C.ink} textAnchor="middle">ECU</text>
      <text x="105" y="96" fontSize="8" fill={C.muted} textAnchor="middle">monitors sensors</text>
      <line x1="150" y1="85" x2="200" y2="85" stroke={C.slate} strokeWidth="2" />
      <rect x="200" y="60" width="90" height="50" rx="6" fill="none" stroke={C.primary} strokeWidth="2" />
      <text x="245" y="82" fontSize="8" fill={C.muted} textAnchor="middle">scan tool</text>
      <text x="245" y="100" fontSize="12" fill={C.red} textAnchor="middle" fontWeight="bold">
        P0301
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </text>
      <text x="160" y="150" fontSize="9" fill={C.muted} textAnchor="middle">code = symptom pointer, not a parts list</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: SENSOR DIAGNOSTICS ───────────────────────────────────
function SensorDiag() {
  return (
    <Frame label="Sensor diagnostics: a sensor outputs a voltage the ECU reads; compare to spec">
      <rect x="40" y="70" width="50" height="40" rx="4" fill="none" stroke={C.slate} strokeWidth="2" />
      <text x="65" y="94" fontSize="9" fill={C.ink} textAnchor="middle">sensor</text>
      <path id="sd-sig" d="M90 90 H180" fill="none" stroke="none" />
      <FlowDots pathId="sd-sig" color={C.green} count={2} dur={2} />
      <line x1="90" y1="90" x2="180" y2="90" stroke={C.green} strokeWidth="2" opacity="0.4" />
      <rect x="180" y="65" width="60" height="50" rx="4" fill="none" stroke={C.slate} strokeWidth="2" />
      <text x="210" y="93" fontSize="9" fill={C.ink} textAnchor="middle">ECU</text>
      <text x="135" y="78" fontSize="10" fill={C.green} textAnchor="middle">0.1–5.0 V</text>
      <text x="160" y="140" fontSize="9" fill={C.muted} textAnchor="middle">measure signal vs spec → in range = OK</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: BRAKES (HYDRAULIC) ───────────────────────────────────
function BrakeHydraulic() {
  return (
    <Frame label="Hydraulic brakes: pedal force is multiplied through fluid to the caliper pistons">
      <rect x="30" y="80" width="26" height="30" fill={C.slate} opacity="0.5" />
      <text x="43" y="128" fontSize="8" fill={C.muted} textAnchor="middle">pedal</text>
      <rect x="56" y="88" width="180" height="14" fill={C.blue} opacity="0.3" stroke={C.blue} strokeWidth="1.5" />
      <path id="bh-fluid" d="M56 95 H232" fill="none" stroke="none" />
      <FlowDots pathId="bh-fluid" color={C.blue} count={3} dur={1.6} />
      <rect x="236" y="70" width="50" height="50" fill={C.slate} opacity="0.5" />
      <text x="261" y="135" fontSize="8" fill={C.muted} textAnchor="middle">caliper</text>
      <text x="160" y="55" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">Pascal's law: pressure equal everywhere</text>
      <text x="160" y="160" fontSize="9" fill={C.muted} textAnchor="middle">small pedal force → large clamping force</text>
    </Frame>
  );
}

// ─── AUTOMOTIVE: COOLING ──────────────────────────────────────────────
function Cooling() {
  return (
    <Frame label="Cooling system: coolant carries engine heat to the radiator; the thermostat regulates temp">
      <rect x="40" y="70" width="50" height="50" rx="4" fill={C.red} opacity="0.3" stroke={C.red} strokeWidth="1.5" />
      <text x="65" y="98" fontSize="9" fill={C.ink} textAnchor="middle">engine</text>
      <rect x="230" y="60" width="50" height="70" fill={C.blue} opacity="0.25" stroke={C.blue} strokeWidth="1.5" />
      <text x="255" y="98" fontSize="8" fill={C.ink} textAnchor="middle">radiator</text>
      <path id="cool-loop" d="M90 82 H230 M230 118 H90" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <FlowDots pathId="cool-loop" color={C.cyan} count={4} dur={2.2} />
      <text x="160" y="70" fontSize="9" fill={C.red} textAnchor="middle">hot out</text>
      <text x="160" y="135" fontSize="9" fill={C.blue} textAnchor="middle">cool back</text>
      <text x="160" y="155" fontSize="9" fill={C.muted} textAnchor="middle">thermostat opens ~195°F to hold temp</text>
    </Frame>
  );
}

// ─── SOFTWARE: N-TIER ARCHITECTURE ────────────────────────────────────
function NTier() {
  return (
    <Frame label="Three-tier architecture: client talks to server, server talks to database">
      {[["Client / UI", 55, C.blue], ["Server / API", 135, C.violet], ["Database", 215, C.green]].map(
        ([label, x, color], i) => (
          <g key={i}>
            <rect x={Number(x)} y="60" width="70" height="60" rx="6" fill={color as string} opacity="0.2" stroke={color as string} strokeWidth="1.5" />
            <text x={Number(x) + 35} y="94" fontSize="9" fill={C.ink} textAnchor="middle">{label}</text>
          </g>
        ),
      )}
      <path id="nt-a" d="M125 90 H135" fill="none" stroke="none" />
      <path id="nt-b" d="M205 90 H215" fill="none" stroke="none" />
      <line x1="125" y1="90" x2="135" y2="90" stroke={C.slate} strokeWidth="2" />
      <line x1="205" y1="90" x2="215" y2="90" stroke={C.slate} strokeWidth="2" />
      <FlowDots pathId="nt-a" color={C.amber} count={1} dur={1.5} />
      <FlowDots pathId="nt-b" color={C.amber} count={1} dur={1.5} />
      <text x="160" y="145" fontSize="9" fill={C.muted} textAnchor="middle">each tier has one job — swap one without breaking the others</text>
    </Frame>
  );
}

// ─── SOFTWARE: BIG-O ──────────────────────────────────────────────────
function BigO() {
  return (
    <Frame label="Big-O complexity: constant, logarithmic, linear, and quadratic growth curves">
      <line x1="40" y1="140" x2="290" y2="140" stroke={C.stroke} strokeWidth="1.5" />
      <line x1="40" y1="140" x2="40" y2="30" stroke={C.stroke} strokeWidth="1.5" />
      <path d="M40 130 H280" fill="none" stroke={C.green} strokeWidth="2" />
      <text x="285" y="130" fontSize="8" fill={C.green}>O(1)</text>
      <path d="M40 130 Q160 105 280 95" fill="none" stroke={C.cyan} strokeWidth="2" />
      <text x="285" y="95" fontSize="8" fill={C.cyan}>O(log n)</text>
      <path d="M40 130 L280 55" fill="none" stroke={C.amber} strokeWidth="2" />
      <text x="285" y="55" fontSize="8" fill={C.amber}>O(n)</text>
      <path d="M40 140 Q180 130 250 35" fill="none" stroke={C.red} strokeWidth="2" />
      <text x="230" y="30" fontSize="8" fill={C.red}>O(n²)</text>
      <text x="165" y="158" fontSize="9" fill={C.muted} textAnchor="middle">input size n →</text>
    </Frame>
  );
}

// ─── SOFTWARE: GIT BRANCHING ──────────────────────────────────────────
function GitBranch() {
  return (
    <Frame label="Git branching: a feature branch diverges from main and merges back">
      <line x1="30" y1="70" x2="290" y2="70" stroke={C.slate} strokeWidth="2.5" />
      {[50, 110, 230, 280].map((x, i) => (
        <circle key={i} cx={x} cy={70} r="6" fill={C.violet} />
      ))}
      <text x="20" y="60" fontSize="9" fill={C.muted}>main</text>
      {/* branch */}
      <path d="M110 70 C140 70 140 120 170 120 L210 120 C240 120 240 70 280 70" fill="none" stroke={C.green} strokeWidth="2.5" />
      {[170, 210].map((x, i) => (
        <circle key={i} cx={x} cy={120} r="6" fill={C.green} />
      ))}
      <text x="190" y="140" fontSize="9" fill={C.green} textAnchor="middle">feature branch</text>
      <text x="280" y="60" fontSize="8" fill={C.muted} textAnchor="middle">merge</text>
    </Frame>
  );
}

// ─── SOFTWARE: MVC ────────────────────────────────────────────────────
function Mvc() {
  return (
    <Frame label="Model-View-Controller: controller mediates between the view and the model">
      <circle cx="160" cy="50" r="22" fill={C.violet} opacity="0.2" stroke={C.violet} strokeWidth="1.5" />
      <text x="160" y="54" fontSize="9" fill={C.ink} textAnchor="middle">Controller</text>
      <circle cx="70" cy="120" r="22" fill={C.blue} opacity="0.2" stroke={C.blue} strokeWidth="1.5" />
      <text x="70" y="124" fontSize="9" fill={C.ink} textAnchor="middle">View</text>
      <circle cx="250" cy="120" r="22" fill={C.green} opacity="0.2" stroke={C.green} strokeWidth="1.5" />
      <text x="250" y="124" fontSize="9" fill={C.ink} textAnchor="middle">Model</text>
      <line x1="145" y1="68" x2="88" y2="104" stroke={C.slate} strokeWidth="1.5" />
      <line x1="175" y1="68" x2="232" y2="104" stroke={C.slate} strokeWidth="1.5" />
      <line x1="92" y1="120" x2="228" y2="120" stroke={C.slate} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="160" y="160" fontSize="9" fill={C.muted} textAnchor="middle">separation of concerns</text>
    </Frame>
  );
}

// ─── SOFTWARE: SCALABILITY ────────────────────────────────────────────
function Scalability() {
  return (
    <Frame label="Horizontal scaling: a load balancer spreads requests across multiple servers">
      <rect x="30" y="80" width="50" height="30" rx="4" fill={C.blue} opacity="0.2" stroke={C.blue} strokeWidth="1.5" />
      <text x="55" y="99" fontSize="8" fill={C.ink} textAnchor="middle">load bal.</text>
      {[45, 90, 135].map((y, i) => (
        <g key={i}>
          <line x1="80" y1="95" x2="180" y2={y + 15} stroke={C.slate} strokeWidth="1.5" />
          <rect x="180" y={y} width="55" height="26" rx="4" fill={C.green} opacity="0.2" stroke={C.green} strokeWidth="1.5" />
          <text x="207" y={y + 17} fontSize="8" fill={C.ink} textAnchor="middle">server {i + 1}</text>
        </g>
      ))}
      <path id="sc-in" d="M10 95 H30" fill="none" stroke="none" />
      <FlowDots pathId="sc-in" color={C.amber} count={2} dur={1.4} />
      <text x="160" y="165" fontSize="9" fill={C.muted} textAnchor="middle">add servers to handle more traffic</text>
    </Frame>
  );
}

// ─── SOFTWARE: SECURITY (AUTH LAYERS) ─────────────────────────────────
function Security() {
  return (
    <Frame label="Defense in depth: a request passes auth, then authorization, then validation before data">
      {["Request", "AuthN", "AuthZ", "Validate", "Data"].map((label, i) => {
        const x = 20 + i * 60;
        const isData = i === 4;
        return (
          <g key={i}>
            <rect x={x} y="70" width="52" height="40" rx="4" fill={isData ? C.green : C.slate} opacity="0.2" stroke={isData ? C.green : C.slate} strokeWidth="1.5" />
            <text x={x + 26} y="94" fontSize="8" fill={C.ink} textAnchor="middle">{label}</text>
            {i < 4 && <line x1={x + 52} y1="90" x2={x + 60} y2="90" stroke={C.slate} strokeWidth="1.5" />}
          </g>
        );
      })}
      <path id="sec-flow" d="M20 90 H320" fill="none" stroke="none" />
      <FlowDots pathId="sec-flow" color={C.amber} count={1} dur={4} />
      <text x="160" y="140" fontSize="9" fill={C.muted} textAnchor="middle">fail closed: any gate says no → request stops</text>
    </Frame>
  );
}

// ─── 2D TWINS for the flagship 3D keys ────────────────────────────────
// These are the graceful fallback when WebGL is unavailable (headless, some
// mobile webviews, GPU-less environments) or the 3D component throws. They
// teach the SAME concept with the SAME correct physics/geometry as the 3D
// model, just flat. Registered in SVG_FALLBACKS (not SVG_DIAGRAMS, whose
// flagship keys route to 3D first).

// PLUMBING: water head column → base pressure. P = ρ·g·h; 5 m ≈ 7.1 psi.
function WaterHeadColumn() {
  return (
    <Frame label="Water head column: taller column of water = higher pressure at the base. 5 m ≈ 7.1 psi">
      <rect x="130" y="30" width="60" height="110" fill={C.blue} opacity="0.45" stroke={C.blue} strokeWidth="1.5" />
      <rect x="110" y="140" width="100" height="14" rx="3" fill={C.slate} />
      {/* head markers every metre (5 m tall) */}
      {[0, 1, 2, 3, 4, 5].map((m) => {
        const y = 30 + (m * 110) / 5;
        return (
          <g key={m}>
            <line x1="190" y1={y} x2="200" y2={y} stroke={C.muted} strokeWidth="1" />
            <text x="204" y={y + 3} fontSize="8" fill={C.muted}>{5 - m} m</text>
          </g>
        );
      })}
      {/* falling drop */}
      <circle r="3.5" fill={C.cyan}>
        <animate attributeName="cy" values="35;135;35" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="cx" values="160;160;160" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <text x="90" y="45" fontSize="10" fill={C.blue} textAnchor="end">surface</text>
      <text x="160" y="24" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">P = ρ · g · h</text>
      <text x="160" y="172" fontSize="10" fill={C.red} textAnchor="middle" fontWeight="bold">base ≈ 7.1 psi (5 m head)</text>
    </Frame>
  );
}

// ELECTRICAL: series circuit — one current path, equal current everywhere,
// two 4.5 V drops summing to the 9 V source (KVL). Matches the lesson's own
// worked example (9 V ÷ 2 kΩ = 4.5 mA). Twin of the 3D loop.
function SeriesCircuitFlow() {
  return (
    <Frame label="Series circuit: one loop, the same 4.5 milliamp current everywhere, two 4.5 V drops summing to 9 V">
      <path id="scf-loop" d="M50 50 H270 V140 H50 Z" fill="none" stroke={C.slate} strokeWidth="3" />
      <FlowDots pathId="scf-loop" color={C.blue} count={4} dur={2.4} />
      {/* battery left */}
      <line x1="50" y1="86" x2="50" y2="96" stroke={C.ink} strokeWidth="6" />
      <line x1="50" y1="98" x2="50" y2="106" stroke={C.ink} strokeWidth="14" />
      <text x="20" y="98" fontSize="12" fill={C.ink} fontWeight="bold">9V</text>
      {/* two 1 kΩ resistors on top */}
      <rect x="110" y="42" width="26" height="16" fill={C.red} rx="2" />
      <rect x="184" y="42" width="26" height="16" fill={C.red} rx="2" />
      <text x="123" y="34" fontSize="9" fill={C.red} textAnchor="middle">R1 1kΩ · 4.5V</text>
      <text x="197" y="34" fontSize="9" fill={C.red} textAnchor="middle">R2 1kΩ · 4.5V</text>
      <text x="160" y="132" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">I = 4.5 mA — SAME everywhere</text>
      <text x="160" y="168" fontSize="9" fill={C.muted} textAnchor="middle">4.5V + 4.5V = 9V source (KVL) · I = 9V ÷ 2kΩ</text>
    </Frame>
  );
}

// HVAC: refrigeration cycle — 4 stages, high-pressure warm side / low cool.
function RefrigerationCycle() {
  return (
    <Frame label="Refrigeration cycle: compressor, condenser (hot, high pressure), metering, evaporator (cold, low pressure)">
      <path id="ref-loop" d="M70 60 H250 V130 H70 Z" fill="none" stroke={C.slate} strokeWidth="2.5" />
      <FlowDots pathId="ref-loop" color={C.violet} count={4} dur={2.6} />
      {/* compressor (bottom-left) */}
      <circle cx="70" cy="130" r="12" fill={C.slate} opacity="0.5" stroke={C.slate} strokeWidth="1.5" />
      <text x="70" y="155" fontSize="8" fill={C.ink} textAnchor="middle">1 compressor</text>
      {/* condenser (top-left) warm */}
      <rect x="55" y="48" width="30" height="24" fill={C.red} opacity="0.4" stroke={C.red} strokeWidth="1.5" />
      <text x="70" y="38" fontSize="8" fill={C.red} textAnchor="middle">2 condenser HIGH P</text>
      {/* metering (top-right) */}
      <polygon points="250,50 240,68 260,68" fill={C.slate} opacity="0.6" />
      <text x="250" y="38" fontSize="8" fill={C.ink} textAnchor="middle">3 metering</text>
      {/* evaporator (bottom-right) cold */}
      <rect x="235" y="118" width="30" height="24" fill={C.blue} opacity="0.4" stroke={C.blue} strokeWidth="1.5" />
      <text x="250" y="158" fontSize="8" fill={C.blue} textAnchor="middle">4 evaporator LOW P</text>
      <text x="160" y="98" fontSize="10" fill={C.primary} textAnchor="middle" fontWeight="bold">moves heat, doesn't make it</text>
    </Frame>
  );
}

// WELDING: fillet weld on a T-joint. throat = 0.707 × leg. Twin of 3D.
function WeldJointGeometry() {
  return (
    <Frame label="Fillet weld cross-section on a T-joint: equal legs, throat equals 0.707 times the leg">
      <rect x="70" y="30" width="24" height="110" fill={C.slate} opacity="0.4" />
      <rect x="70" y="116" width="180" height="24" fill={C.slate} opacity="0.4" />
      <path d="M94 116 L94 82 L138 116 Z" fill={C.amber} opacity="0.75" stroke={C.amber} strokeWidth="1.5" />
      <line x1="94" y1="82" x2="94" y2="116" stroke={C.green} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="66" y="102" fontSize="9" fill={C.green} textAnchor="end">leg</text>
      <line x1="94" y1="116" x2="138" y2="116" stroke={C.green} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="116" y="152" fontSize="9" fill={C.green} textAnchor="middle">leg</text>
      <line x1="94" y1="90" x2="115" y2="112" stroke={C.blue} strokeWidth="1.5" />
      <text x="150" y="95" fontSize="9" fill={C.blue}>throat ≈ 0.707 × leg</text>
      {/* bead ripple pulse */}
      <circle cx="108" cy="103" r="3" fill={C.red} opacity="0.7">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="160" y="24" fontSize="11" fill={C.primary} textAnchor="middle" fontWeight="bold">fillet weld on a T-joint</text>
    </Frame>
  );
}

/**
 * 2D fallbacks for the flagship 3D keys — used when WebGL is unavailable or a
 * 3D component throws. Keyed by the SAME diagramKey the 3D model uses.
 */
export const SVG_FALLBACKS: Record<string, () => JSX.Element> = {
  "water-head-column": WaterHeadColumn,
  "series-circuit-flow": SeriesCircuitFlow,
  "refrigeration-cycle": RefrigerationCycle,
  "weld-joint-geometry": WeldJointGeometry,
};

/**
 * Registry: diagramKey → SVG component. Keys that need 3D are NOT here; they
 * live in the lazy 3D registry in concept-diagram.tsx. Anything not present in
 * either registry renders nothing (no placeholder).
 */
export const SVG_DIAGRAMS: Record<string, () => JSX.Element> = {
  // electrical
  "ohms-law": OhmsLaw,
  "series-parallel": SeriesParallel,
  "ac-sine": AcSine,
  "capacitor": Capacitor,
  "inductor": Inductor,
  "transistor-npn": () => <Transistor />,
  "transistor-pnp": () => <Transistor pnp />,
  "logic-gate": LogicGate,
  "grounding": Grounding,
  "schematic": Schematic,
  "troubleshoot": Troubleshoot,
  // plumbing
  "pipe-friction": PipeFriction,
  "backflow": Backflow,
  "drain-vent": DrainVent,
  "fixture-units": FixtureUnits,
  "pressure-regulator": PressureRegulator,
  // hvac
  "heat-transfer": HeatTransfer,
  "sensible-latent": SensibleLatent,
  "duct-static": DuctStatic,
  "psychrometric": Psychrometric,
  "combustion": Combustion,
  "heat-pump": HeatPump,
  // welding
  "weld-process": WeldProcess,
  "weld-symbols": WeldSymbols,
  "fillet-weld": FilletWeld,
  "distortion": Distortion,
  "weld-defects": WeldDefects,
  // automotive
  "battery-charging": BatteryCharging,
  "starting-system": StartingSystem,
  "obd2": Obd2,
  "sensor-diag": SensorDiag,
  "brake-hydraulic": BrakeHydraulic,
  "cooling": Cooling,
  // software engineering
  "n-tier": NTier,
  "big-o": BigO,
  "git-branch": GitBranch,
  "mvc": Mvc,
  "scalability": Scalability,
  "security": Security,
};
