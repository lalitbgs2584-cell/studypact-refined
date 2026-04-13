"use client";

import { Brain } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signUp, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard"
      });
      if (error) {
        setError(error.message || "Signup failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden selection:bg-[#f97316]/30">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
        }}
      />
      
      {/* Orange Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f97316]/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Internal Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f97316]/20 blur-[50px] rounded-full pointer-events-none" />

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Join StudyPact</h1>
            <p className="text-white/40 text-sm font-medium">Create your account to master your goals.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/50 transition-all"
              />
            </div>

            {error && <div className="text-red-400 text-sm font-medium bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-[#f97316] text-black font-bold uppercase tracking-wider rounded-xl py-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50">
              {loading ? "Preparing Node..." : "Commit Now"}
            </button>

            <div className="relative flex items-center justify-center mt-6 mb-6">
              <div className="absolute w-full border-t border-white/10" />
              <span className="relative bg-black px-4 text-xs font-bold text-white/30 uppercase">Or</span>
            </div>

            <button 
              type="button" 
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const result = await signIn.social({ provider: "google", callbackURL: "/dashboard" });
                if (result?.error) setError(result.error.message || "Google registration failed");
                setLoading(false);
              }}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span className="font-semibold">Sign up with Google</span>
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-white/40">
            Already have an account? <Link href="/login" className="text-[#f97316] hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
