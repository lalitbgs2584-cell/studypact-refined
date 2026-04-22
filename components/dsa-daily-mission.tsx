"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Flame,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DsaMissionPayload } from "@/lib/dsa";

function statusTone(status: DsaMissionPayload["problems"][number]["status"]) {
  if (status === "SOLVED") {
    return "badge-active";
  }

  if (status === "HARD") {
    return "badge-muted";
  }

  if (status === "FAILED") {
    return "badge-risk";
  }

  return "badge-muted";
}

function vaultTone(state: DsaMissionPayload["problems"][number]["vaultState"]) {
  if (state === "GOOD_PROBLEM") return "text-emerald-300";
  if (state === "REVISION") return "text-amber-200";
  if (state === "ATTEMPTED") return "text-red-200";
  if (state === "SOLVED") return "text-primary";
  return "text-white/45";
}

export function DsaDailyMission({ initialMission }: { initialMission: DsaMissionPayload }) {
  const [mission, setMission] = useState(initialMission);
  const [pendingProblemId, setPendingProblemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateProblem(problemId: number, outcome: "FAILED" | "HARD" | "SOLVED") {
    setError(null);
    setPendingProblemId(problemId);

    startTransition(async () => {
      try {
        const response = await fetch("/api/dsa/today", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ problemId, outcome }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Unable to update problem");
        }

        const payload = (await response.json()) as DsaMissionPayload;
        setMission(payload);
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update problem");
      } finally {
        setPendingProblemId(null);
      }
    });
  }

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Brain className="h-3.5 w-3.5" />
              Today&apos;s Mission
            </div>
            <CardTitle className="text-white">
              Day {mission.day} • {mission.focus}
            </CardTitle>
            <CardDescription className="max-w-2xl text-white/55">
              {mission.message}
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Streak", value: mission.tracker.streak, icon: Flame },
              { label: "Complete", value: `${mission.tracker.completionPercent}%`, icon: Target },
              { label: "Week", value: `${mission.tracker.weeklyProgressPercent}%`, icon: RefreshCcw },
              { label: "Done Today", value: `${mission.tracker.completedToday}/${mission.problems.length}`, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[10px] border border-primary/10 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
                <div className="mt-2 text-xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Week {mission.tracker.currentWeek}: {mission.tracker.weekTheme}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/70">
            {mission.tracker.phase}
          </span>
          {mission.tracker.missionCompleted ? (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Daily checkbox complete
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-3">
            {mission.problems.map((problem, index) => {
              const busy = isPending && pendingProblemId === problem.id;

              return (
                <div key={problem.id} className="glass-card p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          {index + 1}. {problem.priority}
                        </span>
                        <span className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]", statusTone(problem.status))}>
                          {problem.status}
                        </span>
                        <span className={cn("text-xs font-semibold", vaultTone(problem.vaultState))}>
                          Vault: {problem.vaultState}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-white">{problem.name}</div>
                        <div className="mt-1 text-sm text-white/45">
                          {problem.platform} • {problem.topic}
                        </div>
                      </div>

                      <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/60">
                        <div>
                          <span className="font-semibold text-white/80">Pattern:</span> {problem.pattern}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold text-white/80">Why today:</span> {problem.reason}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-2">
                      <Link href={problem.url} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="w-full justify-between gap-2">
                          Open problem
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => updateProblem(problem.id, "FAILED")}
                        className="justify-center"
                      >
                        {busy ? "Saving..." : "Stuck"}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => updateProblem(problem.id, "HARD")}
                        className="justify-center"
                      >
                        {busy ? "Saving..." : "Solved With Difficulty"}
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() => updateProblem(problem.id, "SOLVED")}
                        className="justify-center"
                      >
                        {busy ? "Saving..." : "Solved Comfortably"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-[14px] border border-primary/12 bg-primary/5 p-4">
              <div className="text-sm font-semibold text-white">Execution protocol</div>
              <div className="mt-2 space-y-2 text-sm text-white/60">
                <div>25-30 min honest attempt per problem.</div>
                <div>If stuck, take a hint before a full solution.</div>
                <div>Re-code once without looking so the pattern sticks.</div>
              </div>
            </div>

            <div className="rounded-[14px] border border-primary/12 bg-primary/5 p-4">
              <div className="text-sm font-semibold text-white">Weak topics</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {mission.tracker.weakTopics.length > 0 ? (
                  mission.tracker.weakTopics.map((topic) => (
                    <span key={topic} className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/45">No weak topic signal yet. Keep logging outcomes.</span>
                )}
              </div>
            </div>

            <div className="rounded-[14px] border border-primary/12 bg-primary/5 p-4">
              <div className="text-sm font-semibold text-white">Interview-ready topics</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {mission.tracker.interviewReadyTopics.length > 0 ? (
                  mission.tracker.interviewReadyTopics.map((topic) => (
                    <span key={topic} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/45">Nothing marked interview-ready yet. That is normal early on.</span>
                )}
              </div>
            </div>

            {mission.tracker.extraChallenge ? (
              <div className="rounded-[14px] border border-amber-400/20 bg-amber-400/10 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-amber-200" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Extra challenge unlocked</div>
                    <div className="mt-1 text-sm text-white/65">
                      You cleared today&apos;s lane. If energy is still good, take on{" "}
                      <Link
                        href={mission.tracker.extraChallenge.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-amber-200 underline-offset-4 hover:underline"
                      >
                        {mission.tracker.extraChallenge.name}
                      </Link>{" "}
                      from {mission.tracker.extraChallenge.topic}.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  If you miss a day, the engine carries unfinished problems forward and automatically cuts the next mission to 2 problems.
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
