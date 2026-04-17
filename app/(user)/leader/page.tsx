export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function LeaderDashboardPage() {
  const { session, leaderGroupId, leaderGroup } = await requireLeaderWorkspace();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [
    members,
    todayTasks,
    todayCheckIns,
    totalCheckIns,
    approvedCheckIns,
    rejectedCheckIns,
    disputedCheckIns,
    weeklyPenalties,
    recentActivity,
  ] = await Promise.all([
    db.userGroup.findMany({
      where: { groupId: leaderGroupId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.task.count({ where: { groupId: leaderGroupId, day: { gte: todayStart } } }),
    db.checkIn.count({ where: { groupId: leaderGroupId, createdAt: { gte: todayStart } } }),
    db.checkIn.count({ where: { groupId: leaderGroupId } }),
    db.checkIn.count({ where: { groupId: leaderGroupId, status: "APPROVED" } }),
    db.checkIn.count({ where: { groupId: leaderGroupId, status: "REJECTED" } }),
    db.checkIn.count({ where: { groupId: leaderGroupId, status: { in: ["DISPUTED", "FLAGGED"] } } }),
    db.penaltyEvent.count({ where: { groupId: leaderGroupId, createdAt: { gte: weekAgo } } }),
    db.checkIn.findMany({
      where: { groupId: leaderGroupId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        tasks: { select: { title: true } },
      },
    }),
  ]);

  const inactiveMembers = members.filter(
    (m) => !m.lastCheckInAt || m.lastCheckInAt < threeDaysAgo
  );

  const completionRate = totalCheckIns > 0 ?
    Math.round((approvedCheckIns / totalCheckIns) * 100) : 0;

  const quickLinks = [
    { href: "/leader/members", label: "Members", icon: Users, count: members.length },
    { href: "/leader/proofs", label: "Proof Queue", icon: ShieldCheck },
    { href: "/leader/disputes", label: "Disputes", icon: AlertTriangle, count: disputedCheckIns },
    { href: "/leader/tasks", label: "Task Feed", icon: Activity },
    { href: "/leader/alerts", label: "Alerts", icon: AlertTriangle, count: inactiveMembers.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <Card className="overflow-hidden border-l-4 border-l-violet-500">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            <Crown className="h-3.5 w-3.5" />
            Leader Hub
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              {leaderGroup.name}
            </h1>
            <p className="max-w-2xl text-white/60">
              Manage your group, resolve disputes, review proofs, and track member activity.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stat Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Members", value: members.length, color: "text-violet-400" },
          { label: "Tasks Today", value: todayTasks, color: "text-blue-400" },
          { label: "Proofs Today", value: todayCheckIns, color: "text-primary" },
          { label: "Completion Rate", value: `${completionRate}%`, color: "text-emerald-400" },
          { label: "Approved", value: approvedCheckIns, color: "text-emerald-400" },
          { label: "Rejected", value: rejectedCheckIns, color: "text-red-400" },
          { label: "Disputed/Flagged", value: disputedCheckIns, color: "text-orange-400" },
          { label: "Penalties (7d)", value: weeklyPenalties, color: "text-rose-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Leader Panels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-3 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5">
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">{link.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.count !== undefined && link.count > 0 && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                        {link.count}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Inactive Alert */}
        <Card className={cn(inactiveMembers.length > 0 && "border-l-4 border-l-orange-500")}>
          <CardHeader>
            <CardTitle className="text-white">Inactive Members</CardTitle>
            <CardDescription className="text-white/50">
              No submissions in 3+ days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveMembers.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                All members are active 🎉
              </div>
            ) : (
              inactiveMembers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-400">
                      {m.user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white">{m.user.name}</span>
                  </div>
                  <div className="text-xs text-orange-400/60">
                    {m.lastCheckInAt
                      ? `Last: ${m.lastCheckInAt.toLocaleDateString()}`
                      : "Never"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentActivity.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
              No submissions yet
            </div>
          ) : (
            recentActivity.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-3">
                <div className="flex items-center gap-3">
                  {c.status === "APPROVED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : c.status === "REJECTED" ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-white/30" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {c.user.name}
                    </div>
                    <div className="text-xs text-white/40">
                      {c.tasks[0]?.title ?? "Submission"}
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  c.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400" :
                  c.status === "REJECTED" ? "bg-red-500/15 text-red-400" :
                  c.status === "FLAGGED" || c.status === "DISPUTED" ? "bg-orange-500/15 text-orange-400" :
                  "bg-blue-500/15 text-blue-400"
                )}>
                  {c.status}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
