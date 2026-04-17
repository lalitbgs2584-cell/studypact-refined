import { Flame } from "lucide-react";

type TrackerScoreRingProps = {
  score: number;
  label: string;
  helper: string;
  streak?: number;
};

export function TrackerScoreRing({ score, label, helper, streak }: TrackerScoreRingProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card flex flex-col items-center gap-3 p-5 text-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(196,172,120,0.10)"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="url(#tracker-ring-gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
          <defs>
            <linearGradient id="tracker-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8ECF9B" />
              <stop offset="55%" stopColor="#C4AC78" />
              <stop offset="100%" stopColor="#E18A8A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-white">{score}</div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/35">score</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/50">{helper}</div>
      </div>

      {typeof streak === "number" ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Flame className="h-3.5 w-3.5" />
          {streak} day streak
        </div>
      ) : null}
    </div>
  );
}
