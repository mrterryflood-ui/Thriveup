import type { ReactNode } from "react";

const C = {
  ink: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  surface: "hsl(var(--card))",
  stroke: "hsl(var(--border))",
  green: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  slate: "#64748b",
  blue: "#3b82f6",
} as const;

const urgencyColors: Record<string, string> = {
  stable: C.green,
  watch: C.amber,
  concern: C.orange,
  crisis: C.red,
};

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 640 360"
      role="img"
      aria-label={label}
      className="w-full h-auto"
      style={{ maxHeight: 420 }}
    >
      <rect width="640" height="360" rx="12" fill={C.surface} />
      {children}
    </svg>
  );
}

function formatMoney(value: number) {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function shorten(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function finiteNumber(value: unknown) {
  try {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  } catch {
    return 0;
  }
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function Unavailable() {
  return (
    <text x="320" y="180" textAnchor="middle" fill={C.muted} fontSize="14">
      Data unavailable
    </text>
  );
}

export interface ZipPin {
  zip: string;
  lat: number;
  lng: number;
  score: number;
  grade: string;
  urgency: string;
  costOfInaction: number;
  isCenter?: boolean;
}

export interface SkylineMapProps {
  zips: ZipPin[];
  centerLat: number;
  centerLng: number;
}

export function SkylineFallback(props: SkylineMapProps) {
  const zips = (Array.isArray(props?.zips) ? props.zips : [])
    .filter(isRecord)
    .map((zip) => ({
      zip: safeString(zip.zip, "Unknown"),
      lat: finiteNumber(zip.lat),
      lng: finiteNumber(zip.lng),
      score: finiteNumber(zip.score),
      grade: safeString(zip.grade, "—"),
      urgency: safeString(zip.urgency),
      costOfInaction: finiteNumber(zip.costOfInaction),
      isCenter: Boolean(zip.isCenter),
    }));

  if (zips.length === 0) {
    return (
      <Frame label="ZIP score bar chart for 0 ZIP codes">
        <Unavailable />
      </Frame>
    );
  }

  const maxScore = Math.max(...zips.map((zip) => zip.score), 1);
  const chartLeft = 48;
  const chartRight = 622;
  const baseline = 294;
  const maxHeight = 210;
  const slot = (chartRight - chartLeft) / Math.max(zips.length, 1);
  const barWidth = Math.max(5, Math.min(42, slot * 0.64));

  return (
    <Frame label={`ZIP score bar chart for ${zips.length} ZIP codes`}>
      <text x="24" y="28" fill={C.ink} fontSize="15" fontWeight="700">Community score by ZIP</text>
      <text x="24" y="48" fill={C.muted} fontSize="11">Color indicates urgency; height indicates score.</text>
      {[0, 0.5, 1].map((fraction) => {
        const y = baseline - maxHeight * fraction;
        return (
          <g key={fraction}>
            <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke={C.stroke} strokeWidth="1" />
            <text x={chartLeft - 7} y={y + 4} textAnchor="end" fill={C.muted} fontSize="9">
              {(maxScore * fraction).toFixed(maxScore <= 1 ? 2 : 0)}
            </text>
          </g>
        );
      })}
      {zips.map((zip, index) => {
        const height = Math.max(2, (zip.score / maxScore) * maxHeight);
        const x = chartLeft + index * slot + (slot - barWidth) / 2;
        const color = urgencyColors[zip.urgency] ?? C.slate;
        return (
          <g key={`${zip.zip}-${index}`}>
            <title>{`ZIP ${zip.zip}: score ${zip.score}, grade ${zip.grade}, ${zip.urgency}`}</title>
            <rect x={x} y={baseline - height} width={barWidth} height={height} rx="3" fill={color} />
            <text
              x={x + barWidth / 2}
              y={baseline - height - 7}
              textAnchor="middle"
              fill={C.ink}
              fontSize={zips.length > 12 ? "8" : "10"}
              fontWeight="700"
            >
              {zip.score.toFixed(zip.score < 10 ? 1 : 0)}
            </text>
            <text
              x={x + barWidth / 2}
              y={baseline + 15}
              textAnchor="middle"
              fill={C.ink}
              fontSize={zips.length > 12 ? "7" : "9"}
            >
              {zip.zip}
            </text>
            <text
              x={x + barWidth / 2}
              y={baseline + 28}
              textAnchor="middle"
              fill={color}
              fontSize={zips.length > 12 ? "7" : "9"}
              fontWeight="700"
            >
              {zip.grade}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

export interface TimelineNode {
  age: string;
  milestone: string;
  without: string;
  with: string;
  interventionWindow: string;
}

export interface CascadeWaterfallProps {
  timeline: TimelineNode[];
  totalWithout: number;
  totalWith: number;
  geography: string;
}

export function CascadeFallback(props: CascadeWaterfallProps) {
  const timeline = (Array.isArray(props?.timeline) ? props.timeline : [])
    .filter(isRecord)
    .map((stage) => ({
      age: safeString(stage.age, "Unknown age"),
      milestone: safeString(stage.milestone),
      without: safeString(stage.without),
      with: safeString(stage.with),
      interventionWindow: safeString(stage.interventionWindow),
    }));
  const totalWithout = finiteNumber(props?.totalWithout);
  const totalWith = finiteNumber(props?.totalWith);
  const geography = safeString(props?.geography, "Unknown geography");

  if (timeline.length === 0) {
    return (
      <Frame label={`0-stage investment cascade for ${geography}`}>
        <Unavailable />
      </Frame>
    );
  }

  const stages = timeline.slice(0, 8);
  const rowHeight = 250 / Math.max(stages.length, 1);

  return (
    <Frame label={`${stages.length}-stage investment cascade for ${geography}`}>
      <text x="24" y="28" fill={C.ink} fontSize="15" fontWeight="700">{geography}: cascade stages</text>
      <text x="24" y="48" fill={C.muted} fontSize="11">{stages.length} stages from the community impact model</text>
      <text x="614" y="25" textAnchor="end" fill={C.red} fontSize="11" fontWeight="700">
        Without {formatMoney(totalWithout)}
      </text>
      <text x="614" y="43" textAnchor="end" fill={C.green} fontSize="11" fontWeight="700">
        With {formatMoney(totalWith)}
      </text>
      <line x1="48" y1="76" x2="48" y2="318" stroke={C.blue} strokeWidth="3" />
      {stages.map((stage, index) => {
        const y = 72 + index * rowHeight;
        const x = 48 + index * 13;
        return (
          <g key={`${stage.age}-${index}`}>
            <title>{`${stage.age}: ${stage.milestone}. With investment: ${stage.with}. Without investment: ${stage.without}`}</title>
            <circle cx={x} cy={y + 10} r="10" fill={C.blue} />
            <text x={x} y={y + 14} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">{index + 1}</text>
            {index < stages.length - 1 && (
              <line x1={x + 8} y1={y + 18} x2={x + 21} y2={y + rowHeight} stroke={C.blue} strokeWidth="2" />
            )}
            <text x={x + 20} y={y + 7} fill={C.ink} fontSize="11" fontWeight="700">
              {stage.age} · {shorten(stage.milestone, 48)}
            </text>
            <text x={x + 20} y={y + 22} fill={C.red} fontSize="9">
              Without: {shorten(stage.without, 51)}
            </text>
            <text x={x + 320} y={y + 22} fill={C.green} fontSize="9">
              With: {shorten(stage.with, 45)}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

export interface Vintage {
  year: number;
  povertyRate: number;
  unemploymentRate: number;
  cohortCost: number;
}

export interface HistoricalTimelineProps {
  vintages: Vintage[];
  totalAccumulatedCost: number;
  trendDirection: "improving" | "stagnant" | "worsening";
  forwardCost: number;
  interventionCost: number;
  geography: string;
}

export function HistoricalFallback(props: HistoricalTimelineProps) {
  const vintages = (Array.isArray(props?.vintages) ? props.vintages : [])
    .filter(isRecord)
    .map((vintage) => ({
      year: finiteNumber(vintage.year),
      povertyRate: finiteNumber(vintage.povertyRate),
      unemploymentRate: finiteNumber(vintage.unemploymentRate),
      cohortCost: finiteNumber(vintage.cohortCost),
    }));
  const totalAccumulatedCost = finiteNumber(props?.totalAccumulatedCost);
  const trendDirection =
    props?.trendDirection === "improving" || props?.trendDirection === "worsening"
      ? props.trendDirection
      : "stagnant";
  const forwardCost = finiteNumber(props?.forwardCost);
  const interventionCost = finiteNumber(props?.interventionCost);
  const geography = safeString(props?.geography, "Unknown geography");

  if (vintages.length === 0) {
    return (
      <Frame label={`Historical cost timeline for ${geography}, totaling ${formatMoney(totalAccumulatedCost)}`}>
        <Unavailable />
      </Frame>
    );
  }

  const markers = [
    ...vintages.map((vintage) => ({
      label: String(vintage.year),
      cost: vintage.cohortCost,
      detail: `${vintage.povertyRate.toFixed(1)}% poverty`,
      color: trendDirection === "improving" ? C.green : trendDirection === "worsening" ? C.red : C.amber,
    })),
    { label: "Next 25yr", cost: forwardCost, detail: "without investment", color: C.red },
    { label: "Invest now", cost: interventionCost, detail: "with investment", color: C.green },
  ];
  const slot = 570 / Math.max(markers.length, 1);

  return (
    <Frame label={`Historical cost timeline for ${geography}, totaling ${formatMoney(totalAccumulatedCost)}`}>
      <text x="24" y="28" fill={C.ink} fontSize="15" fontWeight="700">{geography}: historical and projected cost</text>
      <text x="24" y="48" fill={C.muted} fontSize="11">
        Total already accumulated: {formatMoney(totalAccumulatedCost)}
      </text>
      <line x1="36" y1="180" x2="608" y2="180" stroke={C.stroke} strokeWidth="4" />
      {markers.map((marker, index) => {
        const x = 36 + slot * index + slot / 2;
        const isProjected = index >= vintages.length;
        return (
          <g key={`${marker.label}-${index}`}>
            <title>{`${marker.label}: ${formatMoney(marker.cost)}, ${marker.detail}`}</title>
            {isProjected && index === vintages.length && (
              <line x1={x - slot / 2} y1="82" x2={x - slot / 2} y2="292" stroke={C.muted} strokeDasharray="4 4" />
            )}
            <circle cx={x} cy="180" r={isProjected ? "10" : "8"} fill={marker.color} />
            <line x1={x} y1="180" x2={x} y2={index % 2 === 0 ? "125" : "235"} stroke={marker.color} strokeWidth="2" />
            <text
              x={x}
              y={index % 2 === 0 ? "108" : "254"}
              textAnchor="middle"
              fill={C.ink}
              fontSize={markers.length > 10 ? "8" : "10"}
              fontWeight="700"
            >
              {marker.label}
            </text>
            <text
              x={x}
              y={index % 2 === 0 ? "121" : "267"}
              textAnchor="middle"
              fill={marker.color}
              fontSize={markers.length > 10 ? "8" : "10"}
            >
              {formatMoney(marker.cost)}
            </text>
            <text
              x={x}
              y={index % 2 === 0 ? "93" : "282"}
              textAnchor="middle"
              fill={C.muted}
              fontSize={markers.length > 10 ? "7" : "8"}
            >
              {marker.detail}
            </text>
          </g>
        );
      })}
      <text x="36" y="330" fill={C.muted} fontSize="10">
        Trend: {trendDirection}
      </text>
    </Frame>
  );
}