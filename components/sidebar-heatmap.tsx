"use client";

const HEAT_COLORS = [
  "rgba(142,207,155,0.10)",
  "rgba(142,207,155,0.22)",
  "rgba(142,207,155,0.40)",
  "rgba(142,207,155,0.58)",
  "rgba(142,207,155,0.80)",
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export type SidebarHeatCell = {
  heat: number; // 0-4
};

export function SidebarHeatmap({ cells }: { cells: SidebarHeatCell[] }) {
  // Show last 7 days
  const week = cells.slice(-7);

  return (
    <div
      style={{
        padding: "12px 12px 14px",
        borderTop: "1px solid rgba(196,172,120,0.09)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.3em",
          color: "rgba(196,172,120,0.35)",
          textTransform: "uppercase",
          padding: "0 6px 8px",
        }}
      >
        This week
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          padding: "0 4px",
        }}
      >
        {week.map((cell, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 5,
                background: HEAT_COLORS[cell.heat] ?? HEAT_COLORS[0],
                minHeight: 18,
                transition: "background 0.3s ease",
              }}
            />
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: "rgba(196,172,120,0.28)",
                lineHeight: 1,
              }}
            >
              {DAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
