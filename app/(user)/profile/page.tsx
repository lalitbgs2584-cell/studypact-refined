export const dynamic = "force-dynamic";

import { MilestoneBadgeKind, TrackerLogStatus } from "@prisma/client";
import { format } from "date-fns";
import {
  Award,
  Flame,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getWorkspace, requireSession } from "@/lib/workspace";

const BADGE_META: Record<
  MilestoneBadgeKind,
  { emoji: string; title: string; description: string }
> = {
  FIRST_COMPLETION: {
    emoji: "✅",
    title: "First Completion",
    description: "You converted your first task into a finished rep.",
  },
  STREAK_7: {
    emoji: "🔥",
    title: "7-Day Streak",
    description: "A full week of consistency without breaking rhythm.",
  },
  ZERO_PENALTIES_MONTH: {
    emoji: "🛡️",
    title: "Clean Month",
    description: "You went a whole month without triggering penalties.",
  },
  EARLY_BIRD_10: {
    emoji: "🌅",
    title: "Early Bird x10",
    description: "Ten early starts logged before the day got noisy.",
  },
  REACTIONS_50: {
    emoji: "👏",
    title: "Community Lift",
    description: "Your work picked up 50 reactions from the group.",
  },
};

function statusMeta(status: TrackerLogStatus) {
  if (status === TrackerLogStatus.COMPLETED) {
    return { label: "Completed", className: "badge-active" };
  }

  if (status === TrackerLogStatus.LATE) {
    return { label: "Late", className: "badge-muted" };
  }

  if (status === TrackerLogStatus.MISSED) {
    return { label: "Missed", className: "badge-risk" };
  }

  return { label: "Pending", className: "badge-muted" };
}

export default async function ProfilePage() {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const activeMembership =
    memberships.find((membership) => membership.groupId === activeGroupId) ?? memberships[0] ?? null;

  const [badges, recentLogs] = await Promise.all([
    db.milestoneBadge.findMany({
      where: {
        userId: session.user.id,
        ...(activeMembership
          ? {
              OR: [{ groupId: activeMembership.groupId }, { groupId: null }],
            }
          : {}),
      },
      orderBy: { earnedAt: "desc" },
      take: 12,
    }),
    db.trackerDailyLog.findMany({
      where: {
        userId: session.user.id,
        ...(activeMembership ? { groupId: activeMembership.groupId } : {}),
      },
      include: {
        trackerEntry: {
          select: {
            title: true,
            blockType: true,
          },
        },
      },
      orderBy: [{ day: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
  ]);

  const stats = [
    {
      label: "Consistency score",
      value: activeMembership?.consistencyScore ?? 0,
      icon: Sparkles,
    },
    {
      label: "Current streak",
      value: activeMembership?.streak ?? 0,
      icon: Flame,
    },
    {
      label: "Total completions",
      value: activeMembership?.completions ?? 0,
      icon: Target,
    },
    {
      label: "Total misses",
      value: activeMembership?.misses ?? 0,
      icon: TrendingDown,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl min-h-0 space-y-8">
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Award className="h-3.5 w-3.5" />
            Profile
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-2xl font-black text-primary">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  session.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <h1 className="truncate text-3xl font-black tracking-tight text-white md:text-4xl">
                  {session.user.name}
                </h1>
                <p className="truncate text-white/60">{session.user.email}</p>
                <p className="text-sm text-white/45">
                  {activeGroup
                    ? `Active accountability room: ${activeGroup.name}`
                    : "Join or create a group to unlock tracker stats and badges."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-white/65">
              {activeGroup ? (
                <>
                  <div className="font-semibold text-white">Group snapshot</div>
                  <div className="mt-1">{activeGroup._count.users} members, {activeGroup._count.tasks} tasks tracked.</div>
                </>
              ) : (
                "No active group selected."
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</div>
                <div className="mt-1 text-2xl font-black text-white">{value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Badges</CardTitle>
            <CardDescription className="text-white/50">
              Milestones earned from consistency, clean execution, and group presence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <div className="rounded-[8px] bg-secondary/30 p-8 text-center text-white/45">
                No badges earned yet. Keep closing tasks and protecting your streak.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {badges.map((badge) => {
                  const meta = BADGE_META[badge.kind];

                  return (
                    <div key={badge.id} className="glass-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-xl">
                          {meta.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{meta.title}</div>
                          <div className="mt-1 text-sm text-white/55">{meta.description}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-primary/80">
                            Earned {format(badge.earnedAt, "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent activity</CardTitle>
            <CardDescription className="text-white/50">
              The last few tracker logs tied to your active group membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="rounded-[8px] bg-secondary/30 p-8 text-center text-white/45">
                No tracker activity yet. Your next completed task will show up here.
              </div>
            ) : (
              recentLogs.map((log) => {
                const status = statusMeta(log.status);

                return (
                  <div key={log.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{log.trackerEntry.title}</div>
                        <div className="mt-1 text-sm text-white/50">
                          {log.trackerEntry.blockType.replace("_", " ")} • {format(log.day, "EEE, MMM d")}
                        </div>
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Active group context</CardTitle>
          <CardDescription className="text-white/50">
            The stats below are pulled from your currently selected accountability group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeGroup ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[10px] border border-primary/10 bg-primary/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/35">Invite code</div>
                <div className="mt-2 font-mono text-2xl font-black tracking-[0.24em] text-primary">
                  {activeGroup.inviteCode.toUpperCase()}
                </div>
              </div>
              <div className="rounded-[10px] border border-primary/10 bg-primary/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/35">Best streak</div>
                <div className="mt-2 text-2xl font-black text-white">{activeMembership?.bestStreak ?? 0} days</div>
              </div>
              <div className="rounded-[10px] border border-primary/10 bg-primary/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/35">Weekly score</div>
                <div className="mt-2 text-2xl font-black text-white">{activeMembership?.weeklyConsistency ?? 0}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-[8px] bg-secondary/30 p-8 text-center text-white/45">
              Create or join a group to populate this section.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
