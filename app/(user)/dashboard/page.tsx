export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Plus, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { redirect } from "next/navigation";

import { GroupTaskUploadPopup } from "@/components/group-task-upload-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePortalSession } from "@/lib/access";
import { db } from "@/lib/db";
import { getGroupTaskAlertMeta } from "@/lib/group-task-alert";
import { cn } from "@/lib/utils";
import { getWorkspace } from "@/lib/workspace";

type ActiveTask = Awaited<ReturnType<typeof fetchActiveTasks>>[number];
type RecentSubmission = Awaited<ReturnType<typeof fetchRecentSubmissions>>[number];
type Membership = Awaited<ReturnType<typeof getWorkspace>>["memberships"][number];

async function fetchActiveTasks(activeGroupId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db.task.findMany({
    where: { groupId: activeGroupId, day: { gte: today } },
    select: {
      id: true, title: true, status: true, createdAt: true, updatedAt: true,
      broadcastKey: true, scope: true,
      user: { select: { name: true } },
      checkIn: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
}

async function fetchRecentSubmissions(activeGroupId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db.checkIn.findMany({
    where: { groupId: activeGroupId, day: { gte: today } },
    select: {
      id: true, status: true, createdAt: true,
      user: { select: { name: true } },
      tasks: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export default async function DashboardPage() {
  const { session, access } = await requirePortalSession();

  // Only redirect site-level admins; group admins (leaders) should still
  // be able to use the member dashboard alongside the leader portal.
  if (access.primaryRole === "admin") {
    redirect(access.landingPath);
  }

  const [{ memberships, activeGroupId, activeGroup }, activeTasks, recentSubmissions] =
    await Promise.all([
      getWorkspace(session.user.id),
      access.activeGroupId ? fetchActiveTasks(access.activeGroupId) : Promise.resolve([]),
      access.activeGroupId ? fetchRecentSubmissions(access.activeGroupId) : Promise.resolve([]),
    ]);

  const groupTaskAlert = getGroupTaskAlertMeta(activeTasks as ActiveTask[]);
  const pendingTasks = (activeTasks as ActiveTask[]).filter((t) => t.status !== "COMPLETED").length;
  const pendingProof = (activeTasks as ActiveTask[]).filter((t) => !t.checkIn || t.checkIn.status !== "APPROVED").length;
  const awaitingReview = (recentSubmissions as RecentSubmission[]).filter((s) => s.status !== "APPROVED" && s.status !== "REJECTED").length;

  const activityFeed = [
    ...(activeTasks as ActiveTask[]).map((task) => ({
      kind: "task" as const,
      title: task.title,
      detail: `${task.user.name} posted a task`,
      time: task.createdAt,
      status: task.status,
    })),
    ...(recentSubmissions as RecentSubmission[]).map((s) => ({
      kind: "proof" as const,
      title: s.tasks[0]?.title ?? "Task proof",
      detail: `${s.user.name} submitted proof`,
      time: s.createdAt,
      status: s.status,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 6);

  const groupProgress = memberships.map((m: Membership) => {
    const members = m.group._count.users;
    const activeMembers = m.group.users.filter((u) => u.completions > 0).length;
    const progress = members === 0 ? 0 : Math.round((activeMembers / members) * 100);
    return {
      id: m.groupId,
      name: m.group.name,
      members,
      tasks: m.group._count.tasks,
      progress,
      activeMembers,
      isActive: m.groupId === activeGroupId,
    };
  });

  const activityBadgeClass = (kind: "task" | "proof", status: string) => {
    if ((kind === "task" && (status === "IN_PROGRESS" || status === "COMPLETED")) || (kind === "proof" && status === "APPROVED")) return "badge-active";
    if ((kind === "task" && status === "MISSED") || (kind === "proof" && (status === "REJECTED" || status === "FLAGGED"))) return "badge-risk";
    return "badge-muted";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <GroupTaskUploadPopup
        userId={session.user.id}
        groupId={activeGroupId}
        groupName={activeGroup?.name}
        latestTaskSignature={groupTaskAlert.latestTaskSignature}
        latestTaskTitle={groupTaskAlert.latestTaskTitle}
        taskCount={groupTaskAlert.count}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="space-y-5 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Welcome back, {session.user.name}</h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `You are currently in ${activeGroup.name}. Track work, proof, and reviews from one place.`
                  : "Join a group or create one to activate the accountability workspace."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/tasks"><Button className="gap-2"><Plus className="h-4 w-4" />Create Task</Button></Link>
              <Link href="/proof-work"><Button variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" />Submit Proof</Button></Link>
              <Link href="/groups"><Button variant="ghost" className="gap-2">Join Group<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(activeGroup ? "border-l-4 border-l-primary" : "")}>
          <CardHeader>
            <CardTitle className="text-white">Active Context</CardTitle>
            <CardDescription className="text-white/50">{activeGroup ? activeGroup.name : "No active group yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Groups", value: memberships.length },
                { label: "Tasks", value: pendingTasks },
                { label: "Proof", value: pendingProof },
                { label: "Review", value: awaitingReview },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[4px] border border-border bg-secondary/30 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
                  <div className="mt-1 text-2xl font-black text-primary">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-white/50">Scanned from the active group context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No activity yet.</div>
            ) : (
              activityFeed.map((item) => (
                <div key={`${item.kind}-${item.title}-${item.time.toISOString()}`} className="flex items-start gap-3 rounded-[4px] border border-border bg-card/70 p-4">
                  <div className="mt-0.5 rounded-[4px] border border-border bg-secondary/30 p-2 text-primary">
                    {item.kind === "task" ? <Plus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-semibold text-white">{item.title}</div>
                      <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]", activityBadgeClass(item.kind, item.status))}>{item.status}</span>
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
            <CardDescription className="text-white/50">A quick look at how each group is moving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupProgress.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No groups yet.</div>
            ) : (
              groupProgress.map((group) => (
                <div key={group.id} className={cn("rounded-lg border p-4", group.isActive ? "card-accent-primary bg-primary/10" : group.progress < 40 ? "card-accent-danger bg-accent/10" : "bg-card/70")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{group.name}</div>
                      <div className="text-xs text-white/45">{group.activeMembers}/{group.members} members active · {group.tasks} tasks</div>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.2em] text-primary">{group.progress}%</div>
                  </div>
                  <div className="progress-track mt-3 overflow-hidden">
                    <div className={cn("progress-fill", group.progress < 40 ? "progress-fill-danger" : "")} style={{ width: `${group.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Clock3, value: pendingTasks, label: "Pending tasks" },
          { icon: ShieldCheck, value: pendingProof, label: "Pending proof of work" },
          { icon: CheckCircle2, value: awaitingReview, label: "Uploads awaiting review" },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="rounded-[4px] border border-border bg-secondary/30 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-primary">{value}</div>
                  <div className="text-sm text-white/50">{label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
