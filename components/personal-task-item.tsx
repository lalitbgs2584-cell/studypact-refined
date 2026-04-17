"use client";

import { useOptimistic, useTransition } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

import { setTaskStatus } from "@/lib/actions/task";

export function PersonalTaskItem({
  task,
}: {
  task: { id: string; title: string; details: string | null; status: string };
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const isCompleted = optimisticStatus === "COMPLETED";
  const isMissed = optimisticStatus === "MISSED";

  const applyStatus = (nextStatus: "PENDING" | "MISSED" | "COMPLETED") =>
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      await setTaskStatus(task.id, nextStatus);
    });

  return (
    <div
      style={{
        width: "100%",
        textAlign: "left",
        background: "rgba(196,172,120,0.04)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(196,172,120,0.14)",
        borderLeft: isCompleted
          ? "3px solid #C4AC78"
          : isMissed
            ? "3px solid #C08888"
            : "1px solid rgba(196,172,120,0.09)",
        borderRight: "1px solid rgba(196,172,120,0.05)",
        borderBottom: "1px solid rgba(196,172,120,0.04)",
        borderRadius: 14,
        padding: 16,
        opacity: isPending ? 0.7 : 1,
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
            border: isCompleted
              ? "2px solid #C4AC78"
              : isMissed
                ? "2px solid #C08888"
                : "2px solid rgba(196,172,120,0.3)",
            background: isCompleted ? "#C4AC78" : isMissed ? "rgba(192,136,136,0.18)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {isCompleted ? (
            <CheckCircle2 style={{ width: 12, height: 12, color: "#0D1118" }} />
          ) : isMissed ? (
            <AlertTriangle style={{ width: 11, height: 11, color: "#C08888" }} />
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: isCompleted ? "#A09880" : isMissed ? "#D8B3B3" : "#EDE6D6",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {task.title}
          </div>

          {task.details && (
            <p
              style={{
                fontSize: 13,
                color: isMissed ? "#B78C8C" : "#A09880",
                marginTop: 6,
                textDecoration: isCompleted ? "line-through" : "none",
              }}
            >
              {task.details}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => applyStatus(isCompleted ? "PENDING" : "COMPLETED")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                border: "1px solid rgba(196,172,120,0.18)",
                background: isCompleted ? "rgba(196,172,120,0.14)" : "rgba(196,172,120,0.05)",
                color: "#EDE6D6",
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              <CheckCircle2 style={{ width: 13, height: 13 }} />
              {isCompleted ? "Undo done" : "Mark done"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => applyStatus(isMissed ? "PENDING" : "MISSED")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                border: "1px solid rgba(192,136,136,0.22)",
                background: isMissed ? "rgba(192,136,136,0.14)" : "rgba(192,136,136,0.05)",
                color: "#D8B3B3",
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              <AlertTriangle style={{ width: 13, height: 13 }} />
              {isMissed ? "Undo miss" : "Mark missed"}
            </button>

            {(isCompleted || isMissed) && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => applyStatus("PENDING")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  border: "1px solid rgba(196,172,120,0.12)",
                  background: "transparent",
                  color: "#A09880",
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
