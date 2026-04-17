type BlockProgressCardProps = {
  label: string;
  shortLabel: string;
  description: string;
  percent: number;
  completed: number;
  total: number;
  accent: "green" | "yellow" | "red";
};

const BLOCK_STYLES = {
  green: {
    ring: "rgba(142,207,155,0.35)",
    background: "rgba(142,207,155,0.08)",
    text: "#8ECF9B",
  },
  yellow: {
    ring: "rgba(196,172,120,0.35)",
    background: "rgba(196,172,120,0.08)",
    text: "#D7BF86",
  },
  red: {
    ring: "rgba(225,138,138,0.32)",
    background: "rgba(225,138,138,0.08)",
    text: "#E18A8A",
  },
} as const;

export function BlockProgressCard({
  label,
  shortLabel,
  description,
  percent,
  completed,
  total,
  accent,
}: BlockProgressCardProps) {
  const style = BLOCK_STYLES[accent];

  return (
    <div
      className="glass-card p-5"
      style={{
        borderLeft: `3px solid ${style.ring}`,
        background: `linear-gradient(180deg, ${style.background}, rgba(13,17,24,0.12))`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: style.text }}>
            {shortLabel}
          </div>
          <div className="text-lg font-semibold text-white">{label}</div>
          <div className="max-w-xs text-xs text-white/45">{description}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black" style={{ color: style.text }}>
            {percent}%
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">
            {completed}/{total} tasks
          </div>
        </div>
      </div>
      <div className="progress-track mt-4 overflow-hidden">
        <div className="progress-fill" style={{ width: `${percent}%`, background: style.text }} />
      </div>
    </div>
  );
}
