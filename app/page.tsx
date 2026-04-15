"use client";

export const dynamic = "force-dynamic";


import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AuthModal } from "@/components/auth-modal";
import { Logo } from "@/components/logo";

const FEATURES = [
  { icon: "🎯", label: "Form Pacts", desc: "Join specialized accountability groups tailored to DSA, development, or custom study routines." },
  { icon: "📸", label: "Prove It", desc: "Upload before-and-after evidence of your work and let peers verify the result." },
  { icon: "🗳️", label: "Peer Review", desc: "Quorum-based voting closes submissions automatically once enough peers agree." },
  { icon: "🏆", label: "Earn Respect", desc: "Climb progress feeds, build streaks, and keep every commitment visible to your group." },
];

const STATS: [string, string][] = [
  ["100%", "Accountability"],
  ["0", "Excuses"],
  ["∞", "Momentum"],
  ["1", "Pact at a time"],
];

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "signup">("signup");

  // Already logged in — middleware handles server-side, this handles client-side hydration
  if (!isPending && session) {
    router.replace("/dashboard");
    return null;
  }

  const openAuth = (view: "login" | "signup") => {
    setModalView(view);
    setModalOpen(true);
  };

  return (
    <main style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", color: "#EDE6D6", background: "transparent" }}>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultView={modalView} />

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 44px", height: "66px",
        borderBottom: "1px solid rgba(196,172,120,0.09)",
        position: "sticky", top: 0,
        background: "rgba(13,17,24,0.85)",
        backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        zIndex: 50,
        boxShadow: "0 1px 0 rgba(196,172,120,0.06), 0 8px 32px rgba(0,0,0,0.50)",
        animation: "g-fade-in 0.45s ease both",
      }}>
        <Logo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => openAuth("login")} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            height: 36, padding: "0 18px",
            color: "rgba(237,230,214,0.75)",
            background: "rgba(196,172,120,0.06)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(196,172,120,0.16)", borderRadius: 10,
            cursor: "pointer",
            boxShadow: "inset 0 1px 0 rgba(196,172,120,0.06), 0 2px 8px rgba(0,0,0,0.35)",
            transition: "all 0.2s ease",
          }}>
            Sign In
          </button>
          <button onClick={() => openAuth("signup")} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
            height: 36, padding: "0 20px",
            color: "#0D1118",
            background: "linear-gradient(135deg, #A08840 0%, #C4AC78 55%, #D4C090 100%)",
            border: "1px solid rgba(196,172,120,0.50)", borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(196,172,120,0.22), 0 4px 20px rgba(196,172,120,0.12)",
            transition: "all 0.2s ease",
          }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", textAlign: "center", padding: "110px 44px 100px", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{
          pointerEvents: "none", position: "absolute", top: -120, left: "50%",
          width: 800, height: 600, transform: "translateX(-50%)",
          background: "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(196,172,120,0.06) 0%, rgba(176,148,100,0.03) 50%, transparent 72%)",
          zIndex: 0, animation: "g-fade-in 1.2s ease 0.2s both, g-float 12s ease-in-out 1.4s infinite",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(196,172,120,0.08)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(196,172,120,0.20)", borderRadius: 9999,
          padding: "7px 18px", fontSize: 12, color: "#D4C090", fontWeight: 600,
          marginBottom: 32, position: "relative", zIndex: 1,
          animation: "g-glass-in 0.65s var(--ease-out) 0.2s both",
          boxShadow: "0 4px 20px rgba(196,172,120,0.10)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#C4AC78", boxShadow: "0 0 6px rgba(196,172,120,0.70)",
            flexShrink: 0, animation: "g-pulse-dot 2s ease-in-out infinite",
            display: "inline-block",
          }} />
          The accountability layer for ambitious teams
        </div>

        <h1 style={{
          fontFamily: "var(--font-sans)", fontSize: "clamp(42px, 6.5vw, 78px)",
          lineHeight: 1.06, letterSpacing: "-2px", color: "#EDE6D6",
          margin: "0 0 26px", position: "relative", zIndex: 1, fontWeight: 700,
          animation: "g-fade-up 0.75s var(--ease-out) 0.30s both",
        }}>
          Commit.{" "}
          <em style={{
            fontStyle: "italic",
            background: "linear-gradient(90deg, #D4C090 0%, #C4AC78 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Execute.</em>
          <br />
          Prove it.
        </h1>

        <p style={{
          fontSize: 18, color: "#A09880", maxWidth: 540, margin: "0 auto 56px",
          lineHeight: 1.75, position: "relative", zIndex: 1,
          animation: "g-fade-up 0.75s var(--ease-out) 0.42s both",
        }}>
          Join groups, broadcast work, upload before-and-after proof, and let peers verify your execution.
        </p>

        {/* CTA */}
        <div style={{
          display: "flex", gap: 16, justifyContent: "center", alignItems: "center",
          flexWrap: "wrap", position: "relative", zIndex: 1,
          animation: "g-fade-up 0.75s var(--ease-out) 0.54s both",
        }}>
          <button onClick={() => openAuth("signup")} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700,
            color: "#0D1118",
            background: "linear-gradient(135deg, #A08840 0%, #C4AC78 60%, #D4C090 100%)",
            border: "1px solid rgba(196,172,120,0.45)", borderRadius: 12,
            padding: "14px 36px", height: 52, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(196,172,120,0.20), 0 8px 40px rgba(196,172,120,0.10)",
            transition: "all 0.25s ease",
          }}>
            Start Your Pact
            <ArrowRight style={{ width: 18, height: 18 }} />
          </button>
          <button onClick={() => openAuth("login")} style={{
            display: "inline-flex", alignItems: "center",
            fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600,
            color: "#EDE6D6",
            background: "rgba(196,172,120,0.05)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(196,172,120,0.14)", borderRadius: 12,
            padding: "13px 32px", height: 52, cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45)",
            transition: "all 0.25s ease",
          }}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", marginTop: 80,
          paddingTop: 52, borderTop: "1px solid rgba(196,172,120,0.09)",
          flexWrap: "wrap", gap: "28px 60px", position: "relative", zIndex: 1,
          animation: "g-fade-up 0.75s var(--ease-out) 0.66s both",
        }}>
          {STATS.map(([value, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <strong style={{
                display: "block", fontFamily: "var(--font-sans)", fontSize: 36,
                fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1px",
                background: "linear-gradient(180deg, #EDE6D6 0%, #A09880 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{value}</strong>
              <span style={{ fontSize: 11, color: "#6A7888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginTop: 4, display: "block" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, padding: "0 44px 80px" }}>
        {FEATURES.map((f, i) => (
          <div key={f.label} style={{
            background: "rgba(196,172,120,0.04)", backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(196,172,120,0.18)", borderLeft: "1px solid rgba(196,172,120,0.12)",
            borderRight: "1px solid rgba(196,172,120,0.06)", borderBottom: "1px solid rgba(196,172,120,0.04)",
            borderRadius: 18, padding: 28,
            boxShadow: "0 2px 4px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45)",
            animation: `g-glass-in 0.6s var(--ease-out) ${0.1 + i * 0.1}s both`,
            transition: "transform 0.4s var(--ease-spring), box-shadow 0.4s ease",
            cursor: "default",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, marginBottom: 16,
              background: "rgba(196,172,120,0.06)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(196,172,120,0.14)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.55)",
            }}>{f.icon}</div>
            <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, color: "#EDE6D6", margin: "0 0 8px", letterSpacing: "-0.3px" }}>{f.label}</h3>
            <p style={{ fontSize: 13, color: "#A09880", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "28px 44px",
        borderTop: "1px solid rgba(196,172,120,0.09)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
        background: "rgba(13,17,24,0.60)", backdropFilter: "blur(8px)",
      }}>
        <span style={{ color: "#6A7888", fontSize: 12.5 }}>© 2025 StudyPact. All rights reserved.</span>
        <nav style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map((link) => (
            <a key={link} href="#" style={{ fontSize: 12.5, color: "#6A7888", transition: "color 0.2s ease" }}>{link}</a>
          ))}
        </nav>
      </footer>
    </main>
  );
}
