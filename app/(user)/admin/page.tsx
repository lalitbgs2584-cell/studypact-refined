export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Flag,
  ShieldCheck,
  Sparkles,
  Users,
  Activity,
  TrendingUp,
  FileWarning,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

async function getPlatformStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalUsers,
    totalGroups,
    totalTasks,
    totalCheckIns,
    todayCheckIns,
    approvedCheckIns,
    rejectedCheckIns,
    flaggedCheckIns,
    disputedCheckIns,
    pendingReports,
    recentPenalties,
    activeUsersToday,
    topGroups,
    topUsers,
  ] = await Promise.all([
    db.user.count(),
    db.group.count(),
    db.task.count(),
    db.checkIn.count(),
    db.checkIn.count({ where: { createdAt: { gte: todayStart } } }),
    db.checkIn.count({ where: { status: "APPROVED" } }),
    db.checkIn.count({ where: { status: "REJECTED" } }),
    db.checkIn.count({ where: { status: "FLAGGED" } }),
    db.checkIn.count({ where: { status: "DISPUTED" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.penaltyEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    db.checkIn.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: todayStart } },
    }).then((r) => r.length),
    db.group.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { users: true, tasks: true, checkIns: true } },
      },
      orderBy: { tasks: { _count: "desc" } },
      take: 5,
    }),
    db.userGroup.findMany({
      select: {
        userId: true,
        completions: true,
        streak: true,
        points: true,
        user: { select: { name: true, image: true } },
        group: { select: { name: true } },
      },
      orderBy: { completions: "desc" },
      take: 5,
    }),
  ]);

  const proofTotal = approvedCheckIns + rejectedCheckIns;
  const rejectionRate = proofTotal > 0 ? Math.round((rejectedCheckIns / proofTotal) * 100) : 0;

  return {
    totalUsers,
    totalGroups,
    totalTasks,
    totalCheckIns,
    todayCheckIns,
    approvedCheckIns,
    rejectedCheckIns,
    flaggedCheckIns,
    disputedCheckIns,
    pendingReports,
    recentPenalties,
    activeUsersToday,
    rejectionRate,
    topGroups,
    topUsers,
  };
}

export default async function AdminDashboardPage() {
  await requireAdminAccess();
  const stats = await getPlatformStats();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Active Today", value: stats.activeUsersToday, icon: Activity, color: "text-emerald-400" },
    { label: "Total Groups", value: stats.totalGroups, icon: Users, color: "text-violet-400" },
    { label: "Total Tasks", value: stats.totalTasks, icon: TrendingUp, color: "text-amber-400" },
    { label: "Proofs Today", value: stats.todayCheckIns, icon: ShieldCheck, color: "text-primary" },
    { label: "Rejection Rate", value: `${stats.rejectionRate}%`, icon: FileWarning, color: "text-red-400" },
    { label: "Disputed", value: stats.disputedCheckIns, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Open Reports", value: stats.pendingReports, icon: Flag, color: "text-rose-400" },
  ];

  const quickLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/groups", label: "Manage Groups", icon: Users },
    { href: "/admin/proofs", label: "Proof Queue", icon: ShieldCheck },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/admin/reports", label: "Reports", icon: Flag },
    { href: "/admin/settings", label: "Settings", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Super Admin
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Platform Overview
            </h1>
            <p className="max-w-2xl text-white/60">
              Monitor platform health, moderate content, manage users and groups from a single command center.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stat Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="rounded-[4px] border border-border bg-secondary/30 p-3">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <div className="text-2xl font-black text-primary">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links + Top Groups + Top Users */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-white/50">Jump to admin panels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-white">{link.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Top Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Most Active Groups</CardTitle>
            <CardDescription className="text-white/50">By total tasks created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topGroups.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                No groups yet
              </div>
            ) : (
              stats.topGroups.map((group, i) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{group.name}</div>
                      <div className="text-xs text-white/40">
                        {group._count.users} members · {group._count.tasks} tasks
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-primary">{group._count.checkIns} proofs</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Top Performers</CardTitle>
            <CardDescription className="text-white/50">By completions across all groups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topUsers.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                No activity yet
              </div>
            ) : (
              stats.topUsers.map((entry, i) => (
                <div
                  key={`${entry.userId}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{entry.user.name}</div>
                      <div className="text-xs text-white/40">
                        {entry.group.name} · {entry.streak} streak
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{entry.completions}</div>
                    <div className="text-[10px] text-white/40">{entry.points} pts</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proof Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Proof Pipeline</CardTitle>
          <CardDescription className="text-white/50">
            Distribution of all proof submissions across statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total", value: stats.totalCheckIns, cls: "text-white" },
              { label: "Approved", value: stats.approvedCheckIns, cls: "text-emerald-400" },
              { label: "Rejected", value: stats.rejectedCheckIns, cls: "text-red-400" },
              { label: "Flagged", value: stats.flaggedCheckIns, cls: "text-orange-400" },
              { label: "Disputed", value: stats.disputedCheckIns, cls: "text-yellow-400" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[4px] border border-border bg-secondary/30 p-4 text-center"
              >
                <div className={cn("text-2xl font-black", item.cls)}>{item.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          {stats.totalCheckIns > 0 && (
            <div className="progress-track mt-4 overflow-hidden">
              <div className="flex h-[5px]">
                <div
                  className="h-full rounded-l-full bg-emerald-500"
                  style={{ width: `${(stats.approvedCheckIns / stats.totalCheckIns) * 100}%` }}
                />
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(stats.rejectedCheckIns / stats.totalCheckIns) * 100}%` }}
                />
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(stats.flaggedCheckIns / stats.totalCheckIns) * 100}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-yellow-500"
                  style={{ width: `${(stats.disputedCheckIns / stats.totalCheckIns) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
