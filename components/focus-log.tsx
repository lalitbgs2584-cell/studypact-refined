import { TaskStatus } from "@prisma/client";
import type { FocusLogTask } from "@/lib/sidebar-data";

const BLOCK_DOT: Record<string, string> = {
  DEEP_WORK: "#4ade80",
  LEARNING: "#f97316",
  PROJECTS: "#a78bfa",
};

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatusDot({ blockType, status }: { blockType: string; status: string }) {
  const isPending = status === "PENDING" || status === "IN_PROGRESS";
  if (isPending) {
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" style={{ flexShrink: 0 }}>
        <circle cx="6.5" cy="6.5" r="5.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      </svg>
    );
  }
  const color = BLOCK_DOT[blockType] ?? "#C4AC78";
  return (
    <span
      style={{
        width: 11, height: 11, borderRadius: "50%", background: color,
        flexShrink: 0, display: "inline-block", boxShadow: `0 0 7px ${color}99`,
      }}
    />
  );
}

export function FocusLog({ tasks }: { tasks: FocusLogTask[] }) {
  const today = new Date();
  const dateLabel = today
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <div className="glass-card p-5">
      <div className="mb-1">
        <div className="text-sm font-bold text-white">Focus log</div>
        <div className="text-xs text-white/45">Time-blocked activity journal</div>
      </div>

      <div
        className="mt-4 rounded-[10px] p-4 space-y-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-[10px] font-bold tracking-[0.22em] text-white/40 uppercase">
          Today — {dateLabel.split(", ")[1]}
        </div>

        {tasks.length === 0 ? (
          <div className="text-sm text-white/30 py-2">No tasks for today yet.</div>
        ) : (
          <div className="space-y-5">
            {tasks.map((task) => {
              const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";
              const isCompleted = task.status === TaskStatus.COMPLETED;
              const statusText = isCompleted ? null : task.status === "MISSED" ? "Missed" : "Upcoming";

              return (
                <div key={task.id} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <StatusDot blockType={task.blockType} status={task.status} />
                    <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.07)", minHeight: 16 }} />
                  </div>
                  <div className="pb-1" style={{ opacity: isPending ? 0.55 : 1 }}>
                    <div
                      className="text-sm font-semibold leading-snug"
                      style={{ color: isPending ? "rgba(255,255,255,0.6)" : "#EDE6D6" }}
                    >
                      {task.title}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {task.details ?? statusText ?? ""}
                    </div>
                    {task.targetMinutes && !isPending ? (
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {formatMinutes(task.targetMinutes)}
                      </span>
                    ) : isPending ? (
                      <span className="inline-block mt-1 text-[10px] text-white/30">{statusText}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
