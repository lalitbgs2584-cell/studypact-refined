export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Award, Crown, Flame, ShieldCheck, Trophy } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGroupConsistencyLeaderboard } from "@/lib/tracker";

function rankTone(rank: number) {
  if (rank === 1) {
    return {
      border: "border-yellow-400/35",
      background: "bg-yellow-500/10",
      text: "text-yellow-200",
      icon: Crown,
    };
  }

  if (rank === 2) {
    return {
      border: "border-slate-300/30",
      background: "bg-slate-300/10",
      text: "text-slate-100",
      icon: Award,
    };
  }

  if (rank === 3) {
    return {
      border: "border-amber-700/40",
      background: "bg-amber-700/10",
      text: "text-amber-200",
      icon: Award,
    };
  }

  return {
    border: "border-primary/10",
    background: "bg-primary/5",
    text: "text-primary",
    icon: Trophy,
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!group || !group.users.some((member) => member.userId === session.user.id)) {
    redirect("/dashboard");
  }

  const leaderboard = await getGroupConsistencyLeaderboard(groupId);

  return (
    <div className="mx-auto max-w-6xl min-h-0 space-y-8">
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary border border-primary/20">
            <Trophy className="h-3 w-3" />
            Consistency leaderboard
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white m-0">{group.name}</h1>
            <p className="max-w-2xl text-sm text-white/50">
              Ranking is now driven by the consistency engine: completion rate, streak continuity, task difficulty, and late penalties.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <Card key={entry.userId} className={index === 0 ? "border-l-4 border-l-primary" : ""}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  #{entry.rank}
                </div>
                {index === 0 ? <Crown className="h-4 w-4 text-primary" /> : null}
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{entry.name}</div>
                <div className="text-xs text-white/40">{entry.completions} completed · {entry.misses} missed</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-border bg-secondary/20 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Score</div>
                  <div className="mt-1 text-xl font-black text-primary">{entry.consistencyScore}</div>
                </div>
                <div className="rounded-[8px] border border-border bg-secondary/20 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Weekly</div>
                  <div className="mt-1 text-xl font-black text-white">{entry.weeklyConsistency}</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Flame className="h-3.5 w-3.5" />
                {entry.streak} day streak
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Full Ranking</CardTitle>
          <CardDescription className="text-white/45">
            Strong work gets rewarded, but late completions and misses keep the board honest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="rounded-[8px] bg-secondary/30 p-8 text-center text-white/45">No leaderboard data yet.</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {leaderboard.map((entry) => {
                  const tone = rankTone(entry.rank);
                  const Icon = tone.icon;

                  return (
                    <div key={entry.userId} className={`glass-card border ${tone.border} ${tone.background} p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${tone.border} ${tone.text}`}>
                            #{entry.rank}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate font-semibold text-white">{entry.name}</div>
                              {entry.rank <= 3 ? <Icon className={`h-4 w-4 ${tone.text}`} /> : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="badge-muted">{entry.consistencyScore} score</span>
                              <span className="badge-muted">{entry.completions} completions</span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          {entry.weeklyConsistency} weekly
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Streak</div>
                          <div className="mt-1 flex items-center gap-1 text-lg font-black text-white">
                            <Flame className="h-4 w-4 text-primary" />
                            {entry.streak}
                          </div>
                        </div>
                        <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Misses</div>
                          <div className="mt-1 text-lg font-black text-white">{entry.misses}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden space-y-3 md:block">
                {leaderboard.map((entry) => (
                  <div key={entry.userId} className="glass-card p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                          #{entry.rank}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-white">{entry.name}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="badge-muted">{entry.completions} completed</span>
                            <span className={entry.misses > 0 ? "badge-risk" : "badge-active"}>{entry.misses} missed</span>
                            <span className="badge-muted">{entry.bestStreak} best streak</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[8px] border border-border bg-secondary/20 px-3 py-2 text-center">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Consistency</div>
                          <div className="mt-1 text-xl font-black text-primary">{entry.consistencyScore}</div>
                        </div>
                        <div className="rounded-[8px] border border-border bg-secondary/20 px-3 py-2 text-center">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Weekly</div>
                          <div className="mt-1 text-xl font-black text-white">{entry.weeklyConsistency}</div>
                        </div>
                        <div className="rounded-[8px] border border-border bg-secondary/20 px-3 py-2 text-center">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Streak</div>
                          <div className="mt-1 flex items-center justify-center gap-1 text-xl font-black text-white">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {entry.streak}
                          </div>
                        </div>
                      </div>
                    </div>

                    {entry.report?.summary ? (
                      <div className="mt-4 rounded-[10px] border border-primary/10 bg-primary/5 p-3 text-sm text-white/65">
                        {entry.report.summary}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
