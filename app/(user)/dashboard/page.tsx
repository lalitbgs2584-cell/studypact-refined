import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Plus, ShieldCheck, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";

export default async function DashboardPage() {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);

  const activeTasks = activeGroupId
    ? await db.task.findMany({
        where: { groupId: activeGroupId },
        include: {
          user: { select: { name: true } },
          checkIn: {
            include: {
              reviewedBy: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      })
    : [];

  const recentSubmissions = activeGroupId
    ? await db.checkIn.findMany({
        where: { groupId: activeGroupId },
        include: {
          user: { select: { name: true } },
          reviewedBy: { select: { name: true } },
          tasks: { select: { id: true, title: true } },
          assignmentQuestion: {
            include: {
              assignment: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const pendingTasks = activeTasks.filter((task) => task.status !== "COMPLETED").length;
  const pendingProof = activeTasks.filter((task) => !task.checkIn || task.checkIn.status !== "APPROVED").length;
  const awaitingReview = recentSubmissions.filter((submission) => submission.status === "PENDING").length;

  const activityFeed = [
    ...activeTasks.map((task) => ({
      kind: "task" as const,
      title: task.title,
      detail: `${task.user.name} posted a task`,
      time: task.createdAt,
      status: task.status,
    })),
    ...recentSubmissions.map((submission) => ({
      kind: "proof" as const,
      title: submission.assignmentQuestion
        ? `${submission.assignmentQuestion.assignment.title} · Question ${submission.assignmentQuestion.order}`
        : submission.tasks[0]?.title ?? "Task proof",
      detail: `${submission.user.name} submitted proof`,
      time: submission.createdAt,
      status: submission.status,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 6);

  const groupProgress = memberships.map((membership) => {
    const members = membership.group._count.users;
    const activeMembers = membership.group.users.filter((groupMember) => groupMember.completions > 0).length;
    const progress = members === 0 ? 0 : Math.round((activeMembers / members) * 100);

    return {
      id: membership.groupId,
      name: membership.group.name,
      members,
      tasks: membership.group._count.tasks,
      progress,
      activeMembers,
      isActive: membership.groupId === activeGroupId,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Welcome back, {session.user.name}
              </h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `You are currently in ${activeGroup.name}. Track work, proof, and reviews from one place.`
                  : "Join a group or create one to activate the accountability workspace."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/tasks">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </Link>
              <Link href="/proof-work">
                <Button variant="outline" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Submit Proof
                </Button>
              </Link>
              <Link href="/dashboard?join=1">
                <Button variant="ghost" className="gap-2">
                  Join Group
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Active Context</CardTitle>
            <CardDescription className="text-white/50">
              {activeGroup ? activeGroup.name : "No active group yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Groups</div>
                <div className="mt-1 text-2xl font-black text-white">{memberships.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Tasks</div>
                <div className="mt-1 text-2xl font-black text-white">{pendingTasks}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Proof</div>
                <div className="mt-1 text-2xl font-black text-white">{pendingProof}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Review</div>
                <div className="mt-1 text-2xl font-black text-white">{awaitingReview}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-white/50">
              Scanned from the active group context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-white/45">
                No activity yet. Start with a task or proof submission.
              </div>
            ) : (
              activityFeed.map((item) => (
                <div key={`${item.kind}-${item.title}-${item.time.toISOString()}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2 text-primary">
                    {item.kind === "task" ? <Plus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-semibold text-white">{item.title}</div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm text-white/50">{item.detail}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Group Progress</CardTitle>
            <CardDescription className="text-white/50">
              A quick look at how each group is moving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupProgress.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-white/45">
                No groups yet. Create or join one to start tracking progress.
              </div>
            ) : (
              groupProgress.map((group) => (
                <div
                  key={group.id}
                  className={cn(
                    "rounded-3xl border p-4",
                    group.isActive ? "border-primary/30 bg-primary/10" : "border-white/10 bg-black/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{group.name}</div>
                      <div className="text-xs text-white/45">
                        {group.activeMembers}/{group.members} members active · {group.tasks} tasks
                      </div>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.2em] text-white/45">{group.progress}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff9b57]" style={{ width: `${group.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-primary">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{pendingTasks}</div>
                <div className="text-sm text-white/50">Pending tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{pendingProof}</div>
                <div className="text-sm text-white/50">Pending proof of work</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{awaitingReview}</div>
                <div className="text-sm text-white/50">Uploads awaiting review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
