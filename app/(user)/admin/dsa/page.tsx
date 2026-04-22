export const dynamic = "force-dynamic";

import {
  Brain,
  CheckCircle2,
  Flame,
  RefreshCcw,
  Target,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

/* ─── Types matching lib/dsa.ts internal vault ─────────────────────────────── */
type VaultProblemProgress = {
  state: string;
  attempts: number;
  failCount: number;
  hardCount: number;
  solvedCount: number;
  reviewCount: number;
  goodProblem: boolean;
  lastResult: string | null;
  lastTouchedAt: string | null;
  nextReviewAt: string | null;
};

type VaultMissionProblem = {
  problemId: number;
  priority: string;
  reason: string;
  status: string;
  assignedFrom: string;
};

type VaultMission = {
  date: string;
  day: number;
  week: number;
  focus: string;
  message: string;
  weekTheme: string;
  phase: string;
  carryForward: boolean;
  problems: VaultMissionProblem[];
};

type DsaVaultStore = {
  version: number;
  createdAt: string;
  streak: number;
  bestStreak: number;
  lastQualifiedDate: string | null;
  dayCursor: number;
  missions: Record<string, VaultMission>;
  problems: Record<string, VaultProblemProgress>;
};

/* ─── Fetch ─────────────────────────────────────────────────────────────────── */
async function getDsaVaults() {
  const settings = await db.systemSetting.findMany({
    where: { key: { startsWith: "dsa:vault:" } },
    select: { key: true, value: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const userIds = settings.map((s) => s.key.replace("dsa:vault:", ""));

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return settings
    .map((s) => {
      const userId = s.key.replace("dsa:vault:", "");
      let vault: DsaVaultStore | null = null;
      try {
        vault = JSON.parse(s.value) as DsaVaultStore;
      } catch {
        vault = null;
      }
      return { userId, user: userMap[userId] ?? null, vault, updatedAt: s.updatedAt };
    })
    .filter((entry) => entry.vault !== null);
}

function statusColor(status: string) {
  if (status === "SOLVED") return "text-emerald-300";
  if (status === "HARD") return "text-amber-300";
  if (status === "FAILED") return "text-red-300";
  if (status === "PENDING") return "text-white/40";
  return "text-white/40";
}

function vaultStateColor(state: string) {
  if (state === "GOOD_PROBLEM") return "text-emerald-300";
  if (state === "SOLVED") return "text-primary";
  if (state === "REVISION") return "text-amber-200";
  if (state === "ATTEMPTED") return "text-red-200";
  return "text-white/35";
}

export default async function AdminDsaHistoryPage() {
  await requireAdminAccess();
  const entries = await getDsaVaults();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-3 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Brain className="h-3.5 w-3.5" />
            DSA Vault History
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Per-User DSA Progress
          </h1>
          <p className="max-w-2xl text-white/60">
            Admin-only view of every user&apos;s DSA adaptive vault — streaks, problem outcomes, mission
            history and topic mastery.
          </p>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-white/45">
            No DSA vaults recorded yet. Users start generating data when they access the DSA mission.
          </CardContent>
        </Card>
      ) : (
        entries.map(({ userId, user, vault, updatedAt }) => {
          if (!vault) return null;

          const totalProblems = Object.keys(vault.problems).length;
          const solvedProblems = Object.values(vault.problems).filter(
            (p) => p.solvedCount > 0 || p.goodProblem,
          ).length;
          const missionDates = Object.keys(vault.missions).sort().reverse();
          const recentMissions = missionDates.slice(0, 7);

          return (
            <Card key={userId} className="overflow-hidden">
              {/* User Header */}
              <CardHeader className="border-b border-border pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #1E2D40, #886840)" }}
                    >
                      {user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (user?.name ?? "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white">{user?.name ?? userId}</CardTitle>
                      <CardDescription className="text-white/45">{user?.email ?? "—"}</CardDescription>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Streak", value: vault.streak, icon: Flame },
                      { label: "Best", value: vault.bestStreak, icon: TrendingUp },
                      { label: "Day", value: vault.dayCursor, icon: RefreshCcw },
                      { label: "Solved", value: `${solvedProblems}/${totalProblems}`, icon: CheckCircle2 },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-[10px] border border-primary/10 bg-primary/5 px-3 py-2 text-center"
                      >
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
                          <Icon className="h-3 w-3 text-primary" />
                          {label}
                        </div>
                        <div className="mt-1 text-lg font-black text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs text-white/30">
                  Last activity: {updatedAt.toLocaleDateString()} ·{" "}
                  {vault.lastQualifiedDate
                    ? `Last qualified: ${vault.lastQualifiedDate}`
                    : "No qualified day yet"}
                </p>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Recent Missions */}
                <div>
                  <div className="mb-3 text-sm font-semibold text-white">
                    Recent Missions{" "}
                    <span className="ml-1 text-xs font-normal text-white/40">
                      (last {recentMissions.length} of {missionDates.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {recentMissions.map((date) => {
                      const m = vault.missions[date]!;
                      const completed = m.problems.filter((p) => p.status !== "PENDING").length;
                      const qualified =
                        m.problems.find((p) => p.priority === "MUST DO")?.status === "SOLVED" ||
                        m.problems.find((p) => p.priority === "MUST DO")?.status === "HARD";

                      return (
                        <div
                          key={date}
                          className="rounded-[12px] border border-border bg-card/60 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                                Day {m.day} · Week {m.week}
                              </span>
                              <span className="text-xs text-white/40">{date}</span>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  qualified
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/5 text-white/35",
                                )}
                              >
                                {qualified ? "Qualified" : "Partial"}
                              </span>
                              {m.carryForward && (
                                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                                  Carry-Forward
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/40">
                              <Target className="mr-1 inline h-3 w-3" />
                              {completed}/{m.problems.length} done · {m.phase}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {m.problems.map((prob, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-[8px] border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs"
                              >
                                <span className="text-white/50">#{prob.problemId}</span>
                                <span className="text-white/70">{prob.priority}</span>
                                <span className={cn("font-bold", statusColor(prob.status))}>
                                  {prob.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Problem Vault Summary (touched problems only) */}
                {totalProblems > 0 && (
                  <div>
                    <div className="mb-3 text-sm font-semibold text-white">
                      Problem Vault{" "}
                      <span className="ml-1 text-xs font-normal text-white/40">
                        ({totalProblems} touched)
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(vault.problems)
                        .sort(([, a], [, b]) => (b.attempts ?? 0) - (a.attempts ?? 0))
                        .slice(0, 12)
                        .map(([id, prog]) => (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2 rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-white/40">#{id}</span>
                              <span className={cn("font-semibold", vaultStateColor(prog.state))}>
                                {prog.state}
                              </span>
                            </div>
                            <div className="flex gap-3 text-white/40">
                              <span title="Attempts">A:{prog.attempts}</span>
                              <span title="Solved" className="text-emerald-300/70">
                                S:{prog.solvedCount}
                              </span>
                              <span title="Failed" className="text-red-300/70">
                                F:{prog.failCount}
                              </span>
                              <span title="Reviews" className="text-amber-300/70">
                                R:{prog.reviewCount}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {totalProblems > 12 && (
                      <p className="mt-2 text-xs text-white/30">
                        Showing top 12 by attempts. {totalProblems - 12} more in vault.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
