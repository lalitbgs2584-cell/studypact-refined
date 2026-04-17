export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  UserMinus,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { removeGroupMember, issueWarning } from "@/lib/actions/leader";
import { reassignGroupLeader } from "@/lib/actions/admin";
import { calculateTrustScore, formatPercent, getValidatorAccuracy } from "@/lib/role-analytics";

export default async function LeaderMembersPage() {
  const { session, leaderGroupId, leaderGroup } = await requireLeaderWorkspace();

  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const members = await db.userGroup.findMany({
    where: { groupId: leaderGroupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          globalTrustScore: true,
          checkIns: {
            where: { groupId: leaderGroupId },
            select: { status: true },
          },
          submissionVerifications: {
            where: { checkIn: { groupId: leaderGroupId } },
            select: {
              verdict: true,
              checkIn: { select: { status: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const enrichedMembers = members.map((m) => {
    const proofAccepted = m.user.checkIns.filter((c) => c.status === "APPROVED").length;
    const proofRejected = m.user.checkIns.filter((c) => c.status === "REJECTED").length;
    const accuracy = getValidatorAccuracy(m.user.submissionVerifications);
    const isInactive = !m.lastCheckInAt || m.lastCheckInAt < threeDaysAgo;

    const trustScore = calculateTrustScore({
      proofAccepted,
      proofRejected,
      correctVotes: accuracy.correct,
      totalVotes: accuracy.total,
      completedTasks: m.completions,
      missedTasks: m.misses,
    });

    return {
      ...m,
      proofAccepted,
      proofRejected,
      accuracy,
      trustScore,
      isInactive,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leader">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-violet-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            <Users className="h-3.5 w-3.5" />
            Member Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {leaderGroup.name} — Members ({enrichedMembers.length})
          </h1>
          <p className="text-sm text-white/50">
            View activity, trust scores, validator accuracy, and take moderation actions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {enrichedMembers.map((m) => (
          <Card key={m.userId} className={cn(m.isInactive && "border-l-4 border-l-orange-500")}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {m.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.user.image} alt={m.user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      m.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{m.user.name}</span>
                      {m.role === "admin" && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                          <Crown className="h-2.5 w-2.5" /> Leader
                        </span>
                      )}
                      {m.isInactive && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                          <AlertTriangle className="h-2.5 w-2.5" /> Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">
                      {m.user.email} · Joined {m.joinedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 text-center">
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-primary">{m.trustScore}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Trust</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-emerald-400">{m.streak}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Streak</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-white">{m.completions}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Done</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-red-400">{m.misses}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Missed</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-amber-400">{formatPercent(m.accuracy.ratio)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Vote Acc.</div>
                  </div>
                  <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-sm font-bold text-white">{m.points}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Points</div>
                  </div>
                </div>

                {/* Actions (only for non-leaders) */}
                {m.role !== "admin" && (
                  <div className="flex flex-wrap gap-2">
                    <form action={issueWarning}>
                      <input type="hidden" name="groupId" value={leaderGroupId} />
                      <input type="hidden" name="memberId" value={m.userId} />
                      <input type="hidden" name="reason" value="Inactivity or rule violation." />
                      <input type="hidden" name="returnTo" value="/leader/members" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-orange-400">
                        <AlertTriangle className="h-3 w-3" />
                        Warn
                      </Button>
                    </form>
                    <form action={reassignGroupLeader}>
                      <input type="hidden" name="groupId" value={leaderGroupId} />
                      <input type="hidden" name="newLeaderId" value={m.userId} />
                      <input type="hidden" name="returnTo" value="/leader/members" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Crown className="h-3 w-3" />
                        Promote
                      </Button>
                    </form>
                    <form action={removeGroupMember}>
                      <input type="hidden" name="groupId" value={leaderGroupId} />
                      <input type="hidden" name="memberId" value={m.userId} />
                      <input type="hidden" name="returnTo" value="/leader/members" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                        <UserMinus className="h-3 w-3" />
                        Remove
                      </Button>
                    </form>
                  </div>
                )}
              </div>

              {/* Warning strikes */}
              {m.inactivityStrikes > 0 && (
                <div className="mt-3 border-t border-border pt-2 text-xs text-orange-400/70">
                  ⚠ {m.inactivityStrikes} warning strike{m.inactivityStrikes > 1 ? "s" : ""}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
