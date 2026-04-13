"use client";

import { ArrowRight, Flame } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "signup">("signup");

  const openAuth = (view: "login" | "signup") => {
    setModalView(view);
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#f97316]/30 overflow-hidden font-sans">
      <AuthModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        defaultView={modalView} 
      />

      {/* Subtle Grid Lines Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
        }}
      />
      
      {/* Orange Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[50vh] bg-[#f97316]/20 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-50 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f97316] flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]">
            <Flame className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">STUDYPACT</span>
        </div>
        <nav className="flex items-center gap-6">
          <button onClick={() => openAuth("login")} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">Sign In</button>
          <button onClick={() => openAuth("signup")} className="bg-[#f97316] text-black hover:bg-[#ff8a3d] px-5 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] transition-all cursor-pointer">Get Started</button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        {/* Badge */}
        <div className="border border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md">
          A new era of accountability
        </div>

        {/* Huge Bold Typography */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-6 drop-shadow-2xl">
          COMMIT. <br className="hidden md:block"/> EXECUTE.
        </h1>
        
        <p className="text-lg md:text-2xl text-white/50 max-w-2xl mx-auto font-medium mb-12 leading-relaxed tracking-tight">
          The ultimate social accountability protocol. Join high-performing groups, stake your reputation, and verify each other. 
        </p>

        {/* CTA Area */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <button onClick={() => openAuth("signup")} className="group relative rounded-2xl bg-[#f97316] p-[2px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_80px_rgba(249,115,22,0.5)] cursor-pointer">
            <div className="rounded-[14px] bg-[#f97316] px-10 py-5 text-black font-black text-lg flex items-center gap-3">
              START YOUR PACT
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Premium Cards Showcase */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full px-6 pb-20">
          {/* Card 1 */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity">
              <div className="w-24 h-24 bg-[#f97316] blur-[60px] rounded-full" />
            </div>
            <h3 className="text-white text-2xl font-bold tracking-tight mb-3 mt-4 relative z-10">Form Groups</h3>
            <p className="text-white/40 font-medium relative z-10">Join specialized pacts tailored to DSA, Development, or custom routines.</p>
          </div>
          {/* Card 2 */}
          <div className="rounded-3xl border border-[#f97316]/20 bg-[#f97316]/5 p-8 backdrop-blur-xl relative overflow-hidden transform md:-translate-y-6 shadow-[0_0_30px_rgba(249,115,22,0.05)] text-left">
            <div className="absolute top-0 right-0 p-8 opacity-40">
              <div className="w-24 h-24 bg-[#f97316] blur-[60px] rounded-full" />
            </div>
            <h3 className="text-[#f97316] text-2xl font-bold tracking-tight mb-3 mt-4 relative z-10">Prove It</h3>
            <p className="text-white/60 font-medium relative z-10">Upload images or videos of your work. Let peers verify your undeniable proof.</p>
          </div>
          {/* Card 3 */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity">
              <div className="w-24 h-24 bg-[#f97316] blur-[60px] rounded-full" />
            </div>
            <h3 className="text-white text-2xl font-bold tracking-tight mb-3 mt-4 relative z-10">Earn Respect</h3>
            <p className="text-white/40 font-medium relative z-10">Climb the leaderboard. Flake out, and watch your reputation burn down.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
