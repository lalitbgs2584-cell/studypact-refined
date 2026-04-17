"use client";

type GoalBar = {
  label: string;
  percent: number;
  color: string;
};

type HeatCell = {
  label: string;
  heat: number;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const HEAT_COLORS = [
  "rgba(142,207,155,0.12)",
  "rgba(142,207,155,0.25)",
  "rgba(142,207,155,0.42)",
  "rgba(142,207,155,0.62)",
  "rgba(142,207,155,0.85)",
];

export function WeeklyProgress({
  goals,
  heatCells,
}: {
  goals: GoalBar[];
  heatCells: HeatCell[];
}) {
  // Only show the last 7 cells for the weekly view
  const weekCells = heatCells.slice(-7);

  return (
    <div
      style={{
        background: "rgba(18,22,30,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(196,172,120,0.10)",
        borderRadius: 16,
        padding: "24px 28px",
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#EDE6D6", margin: 0, lineHeight: 1.3 }}>
          Weekly progress
        </h2>
        <p style={{ fontSize: 13, color: "#6A7888", margin: "4px 0 0 0" }}>
          Goal completion with daily heatmap
        </p>
      </div>

      {/* Inner card */}
      <div
        style={{
          background: "rgba(26,30,38,0.90)",
          borderRadius: 14,
          border: "1px solid rgba(196,172,120,0.07)",
          padding: "20px 22px",
          marginTop: 16,
        }}
      >
        {/* Goals section header */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(196,172,120,0.55)",
            marginBottom: 16,
          }}
        >
          GOALS THIS WEEK
        </div>

        {/* Goal bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {goals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#6A7888", fontSize: 13 }}>
              No tracked goals this week yet.
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 90,
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#EDE6D6",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {goal.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 5,
                    background: "rgba(196,172,120,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 5,
                      background: goal.color,
                      width: `${Math.min(100, goal.percent)}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 36,
                    flexShrink: 0,
                    textAlign: "right",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#A09880",
                  }}
                >
                  {goal.percent}%
                </div>
              </div>
            ))
          )}
        </div>

        {/* Heatmap section */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(196,172,120,0.55)",
              marginBottom: 12,
            }}
          >
            ACTIVITY HEATMAP
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {weekCells.map((cell, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: HEAT_COLORS[cell.heat] ?? HEAT_COLORS[0],
                    minHeight: 36,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(196,172,120,0.40)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {DAY_LABELS[i] ?? "?"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
