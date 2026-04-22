import { cn } from "@/lib/utils";

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
    ring: "border-l-emerald-500",
    background: "rgba(142,207,155,0.08)",
    text: "#8ECF9B",
    progress: "bg-emerald-500",
    status: "On track",
  },
  yellow: {
    ring: "border-l-amber-400",
    background: "rgba(196,172,120,0.08)",
    text: "#D7BF86",
    progress: "bg-amber-400",
    status: "Needs work",
  },
  red: {
    ring: "border-l-red-500",
    background: "rgba(225,138,138,0.08)",
    text: "#E18A8A",
    progress: "bg-red-500",
    status: "Behind",
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
      className={cn("glass-card border-l-[3px] p-5", style.ring)}
      style={{
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
          <div className="mt-2 text-[11px] font-semibold" style={{ color: style.text }}>
            {style.status}
          </div>
        </div>
      </div>
      <div className="progress-track mt-4 overflow-hidden">
        <div className={cn("progress-fill", style.progress)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
