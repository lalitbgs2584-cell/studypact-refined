type HeatCell = {
  date: Date;
  label: string;
  completed: number;
  total: number;
  heat: number;
  status: string;
};

const HEAT_COLORS = [
  "rgba(196,172,120,0.06)",
  "rgba(196,172,120,0.16)",
  "rgba(196,172,120,0.30)",
  "rgba(142,207,155,0.50)",
  "rgba(142,207,155,0.82)",
];

export function WeeklyHeatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">4-Week Heatmap</div>
          <div className="text-xs text-white/45">GitHub-style consistency view for the last 28 days.</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
          <span>low</span>
          {HEAT_COLORS.map((color) => (
            <span
              key={color}
              className="h-3 w-3 rounded-[4px] border border-white/5"
              style={{ background: color }}
            />
          ))}
          <span>high</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => (
          <div key={cell.date.toISOString()} className="space-y-1">
            <div
              className="rounded-[8px] border border-white/5 p-2 text-center"
              style={{ background: HEAT_COLORS[cell.heat] }}
              title={`${cell.label}: ${cell.completed}/${cell.total || 0} completed`}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                {cell.label.split(" ")[0]}
              </div>
              <div className="mt-1 text-sm font-bold text-white">{cell.completed}</div>
            </div>
            <div className="text-center text-[10px] text-white/35">{cell.label.split(" ")[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
