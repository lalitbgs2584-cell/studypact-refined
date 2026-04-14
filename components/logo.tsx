import { Flame } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** render as plain div instead of wrapping in a link */
  asDiv?: boolean;
}

const sizes = {
  sm: { icon: 14, iconBox: 28, boxRadius: 8,  text: 14, gap: 7  },
  md: { icon: 18, iconBox: 36, boxRadius: 10, text: 18, gap: 9  },
  lg: { icon: 22, iconBox: 44, boxRadius: 12, text: 22, gap: 11 },
};

export function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      <div style={{
        width: s.iconBox, height: s.iconBox, borderRadius: s.boxRadius, flexShrink: 0,
        background: "linear-gradient(135deg, #A08840, #C4AC78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 14px rgba(196,172,120,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}>
        <Flame style={{ width: s.icon, height: s.icon, color: "#0D1118" }} />
      </div>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: s.text, fontWeight: 700,
        letterSpacing: "-0.3px", lineHeight: 1,
        background: "linear-gradient(90deg, #A08840 0%, #C4AC78 35%, #EDE6D6 65%, #C4AC78 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        filter: "drop-shadow(0 0 8px rgba(196,172,120,0.35))",
        animation: "logo-glow 3s ease-in-out infinite",
        whiteSpace: "nowrap",
      }}>
        STUDYPACT
      </span>
    </div>
  );
}
