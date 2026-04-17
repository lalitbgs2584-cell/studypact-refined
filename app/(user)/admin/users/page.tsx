export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Ban, RefreshCw, Shield, ShieldCheck, Sparkles, User2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { setUserPlatformRole, setUserBlockStatus, resetUserStats } from "@/lib/actions/admin";
import { calculateTrustScore, formatPercent } from "@/lib/role-analytics";

async function fetchAllUsers() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isBlocked: true,
      penaltyCount: true,
      globalTrustScore: true,
      totalReviews: true,
      accurateReviews: true,
      createdAt: true,
      groups: {
        select: {
          groupId: true,
          role: true,
          streak: true,
          bestStreak: true,
          completions: true,
          misses: true,
          points: true,
          reputationScore: true,
          group: { select: { name: true } },
        },
      },
      checkIns: {
        select: { status: true },
      },
      submissionVerifications: {
        select: {
          verdict: true,
          checkIn: { select: { status: true } },
        },
      },
    },
  });

  return users.map((user) => {
    const totalCompletions = user.groups.reduce((s, g) => s + g.completions, 0);
    const totalMisses = user.groups.reduce((s, g) => s + g.misses, 0);
    const maxStreak = Math.max(0, ...user.groups.map((g) => g.bestStreak));
    const currentStreak = Math.max(0, ...user.groups.map((g) => g.streak));
    const totalPoints = user.groups.reduce((s, g) => s + g.points, 0);

    const proofAccepted = user.checkIns.filter((c) => c.status === "APPROVED").length;
    const proofRejected = user.checkIns.filter((c) => c.status === "REJECTED").length;

    const finalizedReviews = user.submissionVerifications.filter(
      (v) => v.checkIn.status === "APPROVED" || v.checkIn.status === "REJECTED"
    );
    const correctVotes = finalizedReviews.filter((v) => {
      if (v.checkIn.status === "APPROVED") return v.verdict === "APPROVE";
      return v.verdict === "FLAG";
    }).length;

    const trustScore = calculateTrustScore({
      proofAccepted,
      proofRejected,
      correctVotes,
      totalVotes: finalizedReviews.length,
      completedTasks: totalCompletions,
      missedTasks: totalMisses,
    });

    return {
      ...user,
      totalCompletions,
      totalMisses,
      maxStreak,
      currentStreak,
      totalPoints,
      proofAccepted,
      proofRejected,
      trustScore,
      reviewAccuracy: finalizedReviews.length > 0 ? correctVotes / finalizedReviews.length : 0,
      totalReviewCount: finalizedReviews.length,
    };
  });
}

export default async function AdminUsersPage() {
  await requireAdminAccess();
  const users = await fetchAllUsers();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <User2 className="h-3.5 w-3.5" />
            User Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            All Users ({users.length})
          </h1>
          <p className="text-sm text-white/50">
            View activity, trust scores, streaks, and take moderation actions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className={cn(user.isBlocked && "opacity-60")}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{user.name}</span>
                      {user.role === "admin" && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Admin
                        </span>
                      )}
                      {user.groups.some((g) => g.role === "admin") && user.role !== "admin" && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                          Leader
                        </span>
                      )}
                      {user.isBlocked && (
                        <span className="badge-risk">Blocked</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">{user.email}</div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-3 text-center">
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-primary">{user.trustScore}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Trust</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-emerald-400">{user.currentStreak}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Streak</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-white">{user.totalCompletions}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Done</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-red-400">{user.totalMisses}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Missed</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-blue-400">{user.proofAccepted}/{user.proofAccepted + user.proofRejected}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Proof</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-amber-400">{formatPercent(user.reviewAccuracy)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Review Acc.</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <form action={setUserPlatformRole}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="role" value={user.role === "admin" ? "member" : "admin"} />
                    <input type="hidden" name="returnTo" value="/admin/users" />
                    <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Shield className="h-3 w-3" />
                      {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </form>

                  <form action={setUserBlockStatus}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="blocked" value={user.isBlocked ? "false" : "true"} />
                    <input type="hidden" name="returnTo" value="/admin/users" />
                    <Button type="submit" variant="outline" size="sm" className={cn("gap-1.5 text-xs", !user.isBlocked && "text-red-400 hover:text-red-300")}>
                      <Ban className="h-3 w-3" />
                      {user.isBlocked ? "Unblock" : "Block"}
                    </Button>
                  </form>

                  <form action={resetUserStats}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value="/admin/users" />
                    <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      Reset Stats
                    </Button>
                  </form>
                </div>
              </div>

              {/* Groups list */}
              {user.groups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {user.groups.map((g) => (
                    <span
                      key={g.groupId}
                      className="rounded-full border border-border bg-secondary/20 px-2.5 py-0.5 text-[11px] text-white/50"
                    >
                      {g.group.name}
                      {g.role === "admin" && " ★"}
                      <span className="ml-1 text-primary">{g.points}pts</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
