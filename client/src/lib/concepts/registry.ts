import type { LucideIcon } from "lucide-react";
import { Cog, Zap, Building2, Battery, Plane, Lock, Wind, HeartPulse } from "lucide-react";

export type ConceptLane =
  | "mechanical"
  | "electrical"
  | "civil"
  | "chemical"
  | "aerospace"
  | "software"
  | "energy"
  | "biomedical";

export interface LaneMeta {
  slug: ConceptLane;
  label: string;
  short: string;
  icon: LucideIcon;
  accent: string;
}

export const LANES: LaneMeta[] = [
  { slug: "mechanical", label: "Mechanical", short: "Levers, linkages, motion", icon: Cog, accent: "amber" },
  { slug: "electrical", label: "Electrical", short: "Current, voltage, the grid", icon: Zap, accent: "yellow" },
  { slug: "civil", label: "Civil & structural", short: "Bridges, towers, loads", icon: Building2, accent: "stone" },
  { slug: "chemical", label: "Chemical & materials", short: "Batteries, alloys, reactions", icon: Battery, accent: "emerald" },
  { slug: "aerospace", label: "Aerospace", short: "Lift, thrust, flight", icon: Plane, accent: "sky" },
  { slug: "software", label: "Software & systems", short: "Networks, crypto, AI", icon: Lock, accent: "violet" },
  { slug: "energy", label: "Energy", short: "Wind, oil, solar, storage", icon: Wind, accent: "teal" },
  { slug: "biomedical", label: "Bio & medical", short: "Pacemakers, prosthetics, scans", icon: HeartPulse, accent: "rose" },
];

export interface ConceptCard {
  slug: string;
  lane: ConceptLane;
  hook: string;
  title: string;
  subtitle: string;
  url: string;
  tradeSimLink?: { url: string; label: string };
}

export const CONCEPTS: ConceptCard[] = [
  {
    slug: "oil-pumpjack",
    lane: "mechanical",
    hook: "Do you know what engineering makes oil extraction possible?",
    title: "An incredible system — just four ideas stacked together.",
    subtitle: "Rotation to oscillation, a counterweight to even the load, a pivoting beam, and a one-way valve.",
    url: "/concepts/oil-pumpjack",
  },
  {
    slug: "transformer",
    lane: "electrical",
    hook: "Why doesn't your wall outlet fry every appliance you plug into it?",
    title: "Transformers — copper, iron, and the trick that runs the grid.",
    subtitle: "Voltage and current trade places through a shared magnetic field. Change the turns ratio, change the deal.",
    url: "/concepts/transformer",
    tradeSimLink: { url: "/academy/trade-sims/electrical", label: "Electrical Trade Sims →" },
  },
  {
    slug: "suspension-bridge",
    lane: "civil",
    hook: "How does a steel deck hang in the air over a river?",
    title: "Suspension bridges — pulling cables, pushing towers, gravity playing fair.",
    subtitle: "Every pound on the deck becomes tension in a cable and compression in a tower. Drag the truck and watch.",
    url: "/concepts/suspension-bridge",
  },
  {
    slug: "lithium-battery",
    lane: "chemical",
    hook: "What's actually moving inside the battery in your phone?",
    title: "A lithium-ion cell — ions shuttling, electrons going the long way around.",
    subtitle: "Charging pushes ions one way. Discharging lets them slide back. The current you use is just electrons taking the scenic route.",
    url: "/concepts/lithium-battery",
  },
  {
    slug: "airplane-wing",
    lane: "aerospace",
    hook: "Why does a 400-ton airplane stay up?",
    title: "The wing — bending air, paying with pressure, until it asks too much.",
    subtitle: "Tilt the wing and see lift climb. Tilt too far and the air stops cooperating — that's stall.",
    url: "/concepts/airplane-wing",
  },
  {
    slug: "public-key-encryption",
    lane: "software",
    hook: "How can two strangers share a secret without ever exchanging a password?",
    title: "Public-key encryption — a lock anyone can close, only one person can open.",
    subtitle: "Math you can do on paper, with primes small enough to follow. Type a message and watch RSA actually work.",
    url: "/concepts/public-key-encryption",
  },
  {
    slug: "wind-turbine",
    lane: "energy",
    hook: "How much electricity is really sitting in the wind?",
    title: "A wind turbine — three blades, a gearbox, and a cubed wind speed.",
    subtitle: "Power scales with the cube of wind speed. Double the wind, get eight times the power — until the blades have to feather to survive.",
    url: "/concepts/wind-turbine",
  },
  {
    slug: "pacemaker",
    lane: "biomedical",
    hook: "What does an artificial heart-rhythm device actually do all day?",
    title: "A pacemaker — patient, listening, only firing when the heart forgets.",
    subtitle: "It watches every beat. If the next one doesn't come in time, it sends a small electrical nudge. Otherwise it stays quiet.",
    url: "/concepts/pacemaker",
  },
];

export function getLane(slug: ConceptLane): LaneMeta {
  return LANES.find((l) => l.slug === slug) ?? LANES[0];
}

export function getConcept(slug: string): ConceptCard | undefined {
  return CONCEPTS.find((c) => c.slug === slug);
}
