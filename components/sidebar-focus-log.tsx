"use client";

import type { FocusLogTask } from "@/lib/sidebar-data";

const BLOCK_DOT: Record<string, string> = {
  DEEP_WORK: "#4ade80",
  LEARNING: "#f97316",
  PROJECTS: "#a78bfa",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Done",
  LATE: "Done (late)",
  MISSED: "Missed",
  PENDING: "Upcoming",
  IN_PROGRESS: "In progress",
};

function dot(blockType: string, status: string) {
  if (status === "PENDING" || status === "IN_PROGRESS") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="7" cy="7" r="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      </svg>
    );
  }
  const color = BLOCK_DOT[blockType] ?? "#C4AC78";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        marginTop: 3,
        boxShadow: `0 0 6px ${color}88`,
        display: "inline-block",
      }}
    />
  );
}

export function SidebarFocusLog({ tasks }: { tasks: FocusLogTask[] }) {
  const today = new Date();
  const label = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();

  return (
    <div
      style={{
        padding: "14px 12px 16px",
        borderTop: "1px solid rgba(196,172,120,0.09)",
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#EDE6D6",
            letterSpacing: "0.01em",
          }}
        >
          Focus log
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(196,172,120,0.45)",
            marginTop: 1,
          }}
        >
          {label}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            padding: "8px 0",
          }}
        >
          No tasks today yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map((task) => {
            const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "flex-start",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {/* connector line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
                  {dot(task.blockType, task.status)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isPending ? "rgba(255,255,255,0.55)" : "#EDE6D6",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {task.title}
                  </div>
                  {task.details ? (
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "rgba(196,172,120,0.45)",
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.details}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>
                      {STATUS_LABEL[task.status] ?? task.status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
