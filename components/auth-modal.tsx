"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { Logo } from "@/components/logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultView = "signup" }: AuthModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [view, setView] = useState<"login" | "signup">(defaultView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      onClose();
      router.replace("/dashboard");
    }
  }, [onClose, router, session]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (view === "signup") {
        const { error } = await signUp.email({ email, password, name, callbackURL: "/dashboard" });
        if (error) setError(error.message || "Signup failed");
        else router.push("/dashboard");
      } else {
        const { error } = await signIn.email({ email, password, callbackURL: "/dashboard" });
        if (error) setError(error.message || "Login failed");
        else router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(196,172,120,0.05)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(196,172,120,0.14)", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#EDE6D6",
    outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.12em", color: "#6A7888", marginBottom: 6,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(13,17,24,0.88)", backdropFilter: "blur(8px)" }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, animation: "g-glass-in 0.35s var(--ease-out) both" }}>
        <div style={{
          background: "rgba(18,24,32,0.95)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(196,172,120,0.22)", borderLeft: "1px solid rgba(196,172,120,0.14)",
          borderRight: "1px solid rgba(196,172,120,0.08)", borderBottom: "1px solid rgba(196,172,120,0.06)",
          borderRadius: 20, padding: "36px 32px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.65), 0 24px 64px rgba(0,0,0,0.60), 0 8px 32px rgba(196,172,120,0.06)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Corner glow */}
          <div style={{
            pointerEvents: "none", position: "absolute", top: -40, right: -40,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(196,172,120,0.08)", filter: "blur(30px)",
          }} />

          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(196,172,120,0.06)", border: "1px solid rgba(196,172,120,0.14)",
            borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#6A7888", transition: "all 0.2s ease",
          }}>
            <X style={{ width: 14, height: 14 }} />
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Logo size="sm" />
            </div>
            <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "#EDE6D6", margin: "0 0 6px" }}>
              {view === "signup" ? "Join StudyPact" : "Welcome Back"}
            </h1>
            <p style={{ fontSize: 13, color: "#A09880", margin: 0 }}>
              {view === "signup" ? "Create your account to master your goals." : "Access your pacts and prove your execution."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
            {view === "signup" && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                {view === "login" && <button type="button" style={{ fontSize: 11, color: "#C4AC78", background: "none", border: "none", cursor: "pointer" }}>Forgot?</button>}
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>

            {error && (
              <div style={{
                background: "rgba(160,104,104,0.12)", border: "1px solid rgba(160,104,104,0.28)",
                borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C08888",
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
              color: "#0D1118",
              background: "linear-gradient(135deg, #A08840 0%, #C4AC78 55%, #D4C090 100%)",
              border: "1px solid rgba(196,172,120,0.45)", borderRadius: 10,
              padding: "13px 0", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 0 14px rgba(196,172,120,0.18), 0 4px 20px rgba(196,172,120,0.10)",
              opacity: loading ? 0.7 : 1, transition: "all 0.2s ease", marginTop: 4,
            }}>
              {loading ? "Processing..." : view === "signup" ? "Commit Now" : "Sign In"}
            </button>

            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: "100%", height: 1, background: "rgba(196,172,120,0.09)" }} />
              <span style={{
                position: "relative", background: "#121820", padding: "0 12px",
                fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6A7888",
              }}>Or</span>
            </div>

            <button
              type="button" disabled={loading}
              onClick={async () => {
                setLoading(true);
                const result = await signIn.social({ provider: "google", callbackURL: "/dashboard" });
                if (result?.error) setError(result.error.message || "Google authentication failed");
                setLoading(false);
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
                color: "#EDE6D6", background: "rgba(196,172,120,0.05)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(196,172,120,0.14)", borderRadius: 10,
                padding: "11px 0", cursor: "pointer", transition: "all 0.2s ease",
              }}
            >
              <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#6A7888", position: "relative" }}>
            {view === "signup" ? (
              <>Already have an account?{" "}
                <button type="button" onClick={() => setView("login")} style={{ color: "#C4AC78", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>Sign In</button>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setView("signup")} style={{ color: "#C4AC78", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>Commit Here</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
