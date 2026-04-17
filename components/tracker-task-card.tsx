import { Flame, Target } from "lucide-react";

type TrackerTaskCardProps = {
  title: string;
  status: string;
  difficulty: string;
  blockType: string;
  streakCount: number;
  weeklyProgress: number;
  consistencyScore: number;
  totalCompletions: number;
  totalMisses: number;
  dailyLog: Array<{
    day: Date;
    status: string;
    isLate: boolean;
  }>;
};

function logColor(status: string) {
  if (status === "COMPLETED") return "#8ECF9B";
  if (status === "LATE") return "#D7BF86";
  if (status === "MISSED") return "#E18A8A";
  return "rgba(196,172,120,0.16)";
}

export function TrackerTaskCard({
  title,
  status,
  difficulty,
  blockType,
  streakCount,
  weeklyProgress,
  consistencyScore,
  totalCompletions,
  totalMisses,
  dailyLog,
}: TrackerTaskCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="text-base font-semibold text-white">{title}</div>
          <div className="flex flex-wrap gap-2">
            <span className={status === "MISSED" ? "badge-risk" : status === "COMPLETED" || status === "LATE" ? "badge-active" : "badge-muted"}>
              {status}
            </span>
            <span className="badge-muted">{difficulty}</span>
            <span className="badge-muted">{blockType.replace("_", " ")}</span>
          </div>
        </div>
        <div className="rounded-[10px] border border-primary/10 bg-primary/10 px-3 py-2 text-right">
          <div className="text-lg font-black text-primary">{consistencyScore}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">score</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/35">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Streak
          </div>
          <div className="mt-1 text-lg font-black text-white">{streakCount}</div>
        </div>
        <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/35">
            <Target className="h-3.5 w-3.5 text-primary" />
            Weekly %
          </div>
          <div className="mt-1 text-lg font-black text-white">{weeklyProgress}</div>
        </div>
        <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Done / Missed</div>
          <div className="mt-1 text-lg font-black text-white">
            {totalCompletions} / <span className="text-red-300">{totalMisses}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/35">
          <span>Recent log</span>
          <span>{dailyLog.length} day snapshot</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dailyLog.length === 0 ? (
            <span className="text-xs text-white/35">No tracker events yet.</span>
          ) : (
            dailyLog.map((log) => (
              <div key={log.day.toISOString()} className="flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-2.5 py-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: logColor(log.status) }}
                />
                <span className="text-[11px] text-white/55">
                  {log.day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
