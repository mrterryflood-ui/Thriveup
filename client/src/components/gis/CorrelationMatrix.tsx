import type { GeoPoint, Correlation } from "./GisNeedHeatMap";

interface CorrelationMatrixProps {
  points: GeoPoint[];
  correlations: Correlation[];
}

function rColor(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return r > 0 ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200" : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200";
  if (abs >= 0.4) return r > 0 ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300";
  return "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
}

export default function CorrelationMatrix({ points, correlations }: CorrelationMatrixProps) {
  if (!correlations.length) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No correlations computed yet
      </div>
    );
  }

  // Unique pairs and metrics
  const pairs = Array.from(
    new Set(correlations.map(c => [c.fromId, c.toId].sort().join("|")))
  ).map(key => {
    const [a, b] = key.split("|");
    return { key, a, b };
  });

  const metrics = Array.from(new Set(correlations.map(c => c.metric)));
  const nameOf = (id: string) => points.find(p => p.id === id)?.label ?? id;

  // Build lookup: metric+pair → r
  const lookup = new Map<string, number>();
  for (const c of correlations) {
    const pairKey = [c.fromId, c.toId].sort().join("|");
    lookup.set(`${c.metric}|||${pairKey}`, c.pearsonR);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Metric</th>
            {pairs.map(p => (
              <th key={p.key} className="text-center py-2 px-2 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <div className="max-w-[120px] truncate" title={`${nameOf(p.a)} ↔ ${nameOf(p.b)}`}>
                  {nameOf(p.a).split(",")[0]}
                </div>
                <div className="text-muted-foreground font-normal">↔ {nameOf(p.b).split(",")[0]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric} className="border-t border-border">
              <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{metric}</td>
              {pairs.map(p => {
                const r = lookup.get(`${metric}|||${p.key}`);
                if (r === undefined) {
                  return (
                    <td key={p.key} className="py-1.5 px-2 text-center text-muted-foreground">—</td>
                  );
                }
                return (
                  <td key={p.key} className="py-1.5 px-2 text-center">
                    <span className={`inline-block rounded px-1.5 py-0.5 font-mono font-semibold ${rColor(r)}`}>
                      {r.toFixed(2)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Pearson r: ≥0.7 strong, 0.4–0.7 moderate, &lt;0.4 weak. Blue = positive, Red = negative.
      </p>
    </div>
  );
}
