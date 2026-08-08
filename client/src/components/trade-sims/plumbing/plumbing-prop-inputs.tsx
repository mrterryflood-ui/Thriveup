/**
 * Unit-aware property editors for the plumbing canvases.
 *
 * The flow solver stays SI internally; these editors present real-world
 * plumbing units at the UI boundary only:
 *   - Pipe diameters: dropdown of standard nominal sizes (1/2" … 2") with
 *     Schedule 40/80 choice, mapped to correct SI inner diameters.
 *   - Pump head / tank head: entered in feet, psi, or meters.
 * All `onChange` callbacks always receive SI values (meters).
 */

import { useState } from "react";
import {
  NOMINAL_PIPE_SIZES,
  nominalToDiameterM,
  findNominalMatch,
  headFromSI,
  headToSI,
  DIAMETER_PROP_KEYS,
  HEAD_PROP_KEYS,
  type PipeSchedule,
  type HeadUnit,
} from "@/lib/trade-sims/plumbing/component-defs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const M_TO_IN = 1 / 0.0254;

export function isDiameterProp(key: string): boolean {
  return DIAMETER_PROP_KEYS.has(key);
}
export function isHeadProp(key: string): boolean {
  return HEAD_PROP_KEYS.has(key);
}

/** Friendly display labels for props that now have unit-aware editors. */
export function propLabel(key: string): string {
  switch (key) {
    case "diameter":
      return "Pipe size";
    case "largeDiameter":
      return "Large end";
    case "smallDiameter":
      return "Small end";
    case "pumpHead":
      return "Pump head";
    case "head":
      return "Supply pressure";
    default:
      return key;
  }
}

/**
 * Dropdown of nominal pipe sizes + Sch 40/80. Emits SI meters.
 * A non-standard stored value (e.g. legacy 0.019 m seed data) shows as a
 * "Custom" option until the learner picks a standard size.
 */
export function PipeSizeSelect({
  valueM,
  onChangeM,
  testIdPrefix,
}: {
  valueM: number;
  onChangeM: (diameterM: number) => void;
  testIdPrefix: string;
}) {
  const match = findNominalMatch(valueM);
  const [schedule, setSchedule] = useState<PipeSchedule>(match?.schedule ?? "40");
  const effSchedule = match?.schedule ?? schedule;
  const selectValue = match ? match.size.label : "__custom__";

  return (
    <span className="inline-flex items-center gap-1">
      <select
        className="h-7 text-xs rounded-md border border-input bg-background px-2 font-mono"
        value={selectValue}
        onChange={(e) => {
          const size = NOMINAL_PIPE_SIZES.find((s) => s.label === e.target.value);
          if (size) onChangeM(nominalToDiameterM(size, effSchedule));
        }}
        data-testid={`${testIdPrefix}-nominal`}
      >
        {!match && (
          <option value="__custom__" disabled>
            Custom ({(valueM * 1000).toFixed(1)} mm / {(valueM * M_TO_IN).toFixed(3)}" ID)
          </option>
        )}
        {NOMINAL_PIPE_SIZES.map((s) => (
          <option key={s.label} value={s.label}>
            {s.label} nominal
          </option>
        ))}
      </select>
      <select
        className="h-7 text-xs rounded-md border border-input bg-background px-2 font-mono"
        value={effSchedule}
        onChange={(e) => {
          const sch = e.target.value as PipeSchedule;
          setSchedule(sch);
          if (match) onChangeM(nominalToDiameterM(match.size, sch));
        }}
        data-testid={`${testIdPrefix}-schedule`}
      >
        <option value="40">Sch 40</option>
        <option value="80">Sch 80</option>
      </select>
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
        ID {(valueM * M_TO_IN).toFixed(3)}"
      </span>
    </span>
  );
}

/**
 * Head/pressure input with a unit picker (ft / psi / m). Emits SI meters of
 * water head. Local text state lets the learner type freely; the SI value is
 * committed on every valid parse.
 */
export function HeadInput({
  valueM,
  onChangeM,
  defaultUnit = "psi",
  testIdPrefix,
}: {
  valueM: number;
  onChangeM: (headM: number) => void;
  defaultUnit?: HeadUnit;
  testIdPrefix: string;
}) {
  const [unit, setUnit] = useState<HeadUnit>(defaultUnit);
  const [text, setText] = useState<string | null>(null);

  const displayed = text ?? String(Number(headFromSI(valueM, unit).toFixed(2)));

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        type="text"
        inputMode="decimal"
        className="w-20 h-7 text-xs font-mono"
        value={displayed}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChangeM(headToSI(n, unit));
        }}
        onBlur={() => setText(null)}
        data-testid={`${testIdPrefix}-value`}
      />
      <select
        className="h-7 text-xs rounded-md border border-input bg-background px-1.5 font-mono"
        value={unit}
        onChange={(e) => {
          setUnit(e.target.value as HeadUnit);
          setText(null); // re-derive display from SI in the new unit
        }}
        data-testid={`${testIdPrefix}-unit`}
      >
        <option value="psi">psi</option>
        <option value="ft">ft</option>
        <option value="m">m</option>
      </select>
    </span>
  );
}
