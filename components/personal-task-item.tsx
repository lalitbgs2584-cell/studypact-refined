"use client";

import { useOptimistic, useTransition } from "react";
import { togglePersonalTask } from "@/lib/actions/task";

export function PersonalTaskItem({ task }: { task: { id: string; title: string; details: string | null; status: string } }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const isCompleted = optimisticStatus === "COMPLETED";

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setOptimisticStatus(isCompleted ? "PENDING" : "COMPLETED");
          await togglePersonalTask(task.id);
        })
      }
      disabled={isPending}
      style={{
        width: "100%",
        textAlign: "left",
        background: "rgba(196,172,120,0.04)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(196,172,120,0.14)",
        borderLeft: isCompleted ? "3px solid #C4AC78" : "1px solid rgba(196,172,120,0.09)",
        borderRight: "1px solid rgba(196,172,120,0.05)",
        borderBottom: "1px solid rgba(196,172,120,0.04)",
        borderRadius: 14,
        padding: 16,
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            flexShrink: 0,
            marginTop: 2,
            border: isCompleted ? "2px solid #C4AC78" : "2px solid rgba(196,172,120,0.3)",
            background: isCompleted ? "#C4AC78" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="#0D1118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: isCompleted ? "#A09880" : "#EDE6D6",
              textDecoration: isCompleted ? "line-through" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {task.title}
          </div>
          {task.details && (
            <p
              style={{
                fontSize: 13,
                color: "#A09880",
                marginTop: 6,
                textDecoration: isCompleted ? "line-through" : "none",
              }}
            >
              {task.details}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
