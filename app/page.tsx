"use client";

import { ArrowRight, Flame } from "lucide-react";
import { useState } from "react";

import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "signup">("signup");

  const openAuth = (view: "login" | "signup") => {
    setModalView(view);
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultView={modalView} />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(42,42,64,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,42,64,0.7) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[50vh] w-[80vw] -translate-x-1/2 rounded-full bg-primary/15 blur-[150px]" />

      <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,178,0.28)]">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-[0.25em] text-foreground">STUDYPACT</span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => openAuth("login")}>
            Sign In
          </Button>
          <Button onClick={() => openAuth("signup")}>Get Started</Button>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-8 rounded-[4px] border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.35em] text-primary backdrop-blur-md">
          A new era of accountability
        </div>

        <h1 className="mb-6 text-6xl font-black tracking-[-0.05em] text-foreground md:text-8xl lg:text-9xl">
          COMMIT. <br className="hidden md:block" /> EXECUTE.
        </h1>

        <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-2xl">
          The accountability layer for ambitious teams. Join groups, broadcast work, verify proof, and keep momentum visible.
        </p>

        <Button size="lg" onClick={() => openAuth("signup")} className="group rounded-[4px] px-10 py-6 text-base shadow-[0_0_40px_rgba(0,255,178,0.2)]">
          START YOUR PACT
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>

        <div className="mt-32 grid w-full max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
          <Card className="group relative overflow-hidden text-left">
            <CardContent className="p-8">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl transition-opacity group-hover:opacity-100" />
              <h3 className="relative z-10 mb-3 mt-4 text-2xl font-black tracking-tight">Form Groups</h3>
              <p className="relative z-10 text-muted-foreground">Join specialized pacts tailored to DSA, development, or custom routines.</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-primary/20 bg-primary/10 text-left shadow-[0_0_30px_rgba(0,255,178,0.08)] md:-translate-y-6">
            <CardContent className="p-8">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl" />
              <h3 className="relative z-10 mb-3 mt-4 text-2xl font-black tracking-tight text-primary">Prove It</h3>
              <p className="relative z-10 text-foreground/75">Upload images of your work and let peers verify the result.</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden text-left">
            <CardContent className="p-8">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl transition-opacity group-hover:opacity-100" />
              <h3 className="relative z-10 mb-3 mt-4 text-2xl font-black tracking-tight">Earn Respect</h3>
              <p className="relative z-10 text-muted-foreground">Climb progress feeds and keep every commitment visible.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

