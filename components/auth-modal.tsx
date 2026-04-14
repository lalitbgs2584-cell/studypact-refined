"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signUp } from "@/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultView = "signup" }: AuthModalProps) {
  const router = useRouter();
  const [view, setView] = useState<"login" | "signup">(defaultView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (view === "signup") {
        const { error } = await signUp.email({
          email,
          password,
          name,
          callbackURL: "/dashboard",
        });
        if (error) setError(error.message || "Signup failed");
        else router.push("/dashboard");
      } else {
        const { error } = await signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });
        if (error) setError(error.message || "Login failed");
        else router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const result = await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (result?.error) setError(result.error.message || "Google authentication failed");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-8 shadow-[0_0_40px_-24px_rgba(0,255,178,0.3)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-[50px]" />

          <button onClick={onClose} className="absolute right-6 top-6 text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-5 w-5" />
          </button>

          <div className="mb-8 mt-2 text-center">
            <h1 className="mb-2 text-3xl font-black tracking-tight text-foreground">{view === "signup" ? "Join StudyPact" : "Welcome Back"}</h1>
            <p className="text-sm font-medium text-muted-foreground">
              {view === "signup" ? "Create your account to master your goals." : "Access your pacts and prove your execution."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[4px] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                {view === "login" && <button type="button" className="text-[10px] text-primary hover:underline">Forgot?</button>}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[4px] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
              />
            </div>

            {error ? <div className="rounded-[4px] border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">{error}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-[4px] bg-primary py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-[0_0_20px_rgba(0,255,178,0.25)] transition-all hover:shadow-[0_0_30px_rgba(0,255,178,0.38)] disabled:opacity-50"
            >
              {loading ? "Processing..." : view === "signup" ? "Commit Now" : "Sign In"}
            </button>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute w-full border-t border-border" />
              <span className="relative rounded-[4px] bg-secondary px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Or</span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-border bg-secondary px-4 py-3 text-foreground transition-colors hover:bg-secondary/80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-semibold text-sm">Continue with Google</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
            {view === "signup" ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setView("login")} className="text-primary hover:underline">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setView("signup")} className="text-primary hover:underline">
                  Commit Here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
