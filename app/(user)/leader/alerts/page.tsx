export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  UserMinus,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { issueWarning, removeGroupMember } from "@/lib/actions/leader";

export default async function LeaderAlertsPage() {
  const { leaderGroupId, leaderGroup } = await requireLeaderWorkspace();

  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Inactive members (on-demand computation)
  const members = await db.userGroup.findMany({
    where: { groupId: leaderGroupId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const inactiveMembers = members.filter(
    (m) => m.role !== "admin" && (!m.lastCheckInAt || m.lastCheckInAt < threeDaysAgo)
  );

  // Suspicious mutual-approval patterns
  const verifications = await db.submissionVerification.findMany({
    where: {
      checkIn: { groupId: leaderGroupId },
      verdict: "APPROVE",
    },
    select: {
      reviewerId: true,
      checkIn: { select: { userId: true } },
    },
  });

  // Build adjacency map: reviewer -> submitter -> count
  const approvalMap: Record<string, Record<string, number>> = {};
  for (const v of verifications) {
    const r = v.reviewerId;
    const s = v.checkIn.userId;
    if (!approvalMap[r]) approvalMap[r] = {};
    approvalMap[r][s] = (approvalMap[r][s] || 0) + 1;
  }

  // Detect mutual approval pairs
  const suspiciousPairs: { userA: string; userB: string; countAtoB: number; countBtoA: number }[] = [];
  const seen = new Set<string>();

  for (const [a, targets] of Object.entries(approvalMap)) {
    for (const [b, countAtoB] of Object.entries(targets)) {
      if (a === b) continue;
      const key = [a, b].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);

      const countBtoA = approvalMap[b]?.[a] ?? 0;
      if (countAtoB >= 3 && countBtoA >= 3) {
        suspiciousPairs.push({ userA: a, userB: b, countAtoB, countBtoA });
      }
    }
  }

  // Get names for suspicious pairs
  const suspiciousUserIds = new Set(suspiciousPairs.flatMap((p) => [p.userA, p.userB]));
  const suspiciousUsers = suspiciousUserIds.size > 0
    ? await db.user.findMany({
        where: { id: { in: [...suspiciousUserIds] } },
        select: { id: true, name: true },
      })
    : [];
  const nameMap: Record<string, string> = {};
  for (const u of suspiciousUsers) nameMap[u.id] = u.name;

  // Members with high warning strikes
  const warnedMembers = members.filter((m) => m.inactivityStrikes >= 2 && m.role !== "admin");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leader">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-orange-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alerts & Suspicious Activity
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {leaderGroup.name} — Alerts
          </h1>
          <p className="text-sm text-white/50">
            Inactive members, suspicious mutual approval patterns, and repeat offenders.
          </p>
        </CardContent>
      </Card>

      {/* Inactive Members */}
      <Card className={cn(inactiveMembers.length > 0 && "border-l-4 border-l-orange-500")}>
        <CardHeader>
          <CardTitle className="text-white">
            Inactive Members ({inactiveMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {inactiveMembers.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
              Everyone is active 🎉
            </div>
          ) : (
            inactiveMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-400">
                    {m.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{m.user.name}</div>
                    <div className="text-xs text-white/40">
                      Last check-in: {m.lastCheckInAt ? m.lastCheckInAt.toLocaleDateString() : "Never"}
                      {" · "}{m.completions} completions · {m.streak} streak
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={issueWarning}>
                    <input type="hidden" name="groupId" value={leaderGroupId} />
                    <input type="hidden" name="memberId" value={m.userId} />
                    <input type="hidden" name="reason" value="Inactivity — no submissions for 3+ days." />
                    <input type="hidden" name="returnTo" value="/leader/alerts" />
                    <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-orange-400">
                      <AlertTriangle className="h-3 w-3" />
                      Warn
                    </Button>
                  </form>
                  <form action={removeGroupMember}>
                    <input type="hidden" name="groupId" value={leaderGroupId} />
                    <input type="hidden" name="memberId" value={m.userId} />
                    <input type="hidden" name="returnTo" value="/leader/alerts" />
                    <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                      <UserMinus className="h-3 w-3" />
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Suspicious Mutual Approval */}
      <Card className={cn(suspiciousPairs.length > 0 && "border-l-4 border-l-red-500")}>
        <CardHeader>
          <CardTitle className="text-white">
            Suspicious Patterns ({suspiciousPairs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {suspiciousPairs.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
              No suspicious mutual approval patterns detected
            </div>
          ) : (
            suspiciousPairs.map((pair, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-4"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-red-400" />
                  <span className="font-medium text-white">
                    {nameMap[pair.userA] ?? pair.userA}
                  </span>
                  <span className="text-white/40">↔</span>
                  <span className="font-medium text-white">
                    {nameMap[pair.userB] ?? pair.userB}
                  </span>
                </div>
                <div className="mt-1 text-xs text-red-400/70">
                  Always approving each other — {nameMap[pair.userA]} approved {nameMap[pair.userB]} {pair.countAtoB}× and vice-versa {pair.countBtoA}×
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Repeat Offenders */}
      <Card className={cn(warnedMembers.length > 0 && "border-l-4 border-l-rose-500")}>
        <CardHeader>
          <CardTitle className="text-white">
            Repeat Offenders ({warnedMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {warnedMembers.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
              No members with 2+ warning strikes
            </div>
          ) : (
            warnedMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-400">
                    {m.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{m.user.name}</div>
                    <div className="text-xs text-white/40">
                      {m.inactivityStrikes} warning strikes · {m.misses} missed tasks
                    </div>
                  </div>
                </div>
                <form action={removeGroupMember}>
                  <input type="hidden" name="groupId" value={leaderGroupId} />
                  <input type="hidden" name="memberId" value={m.userId} />
                  <input type="hidden" name="returnTo" value="/leader/alerts" />
                  <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                    <UserMinus className="h-3 w-3" />
                    Remove
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
