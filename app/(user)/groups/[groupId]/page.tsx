export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, MessageCircle, Plus, Sparkles, Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { GroupChatPanel } from "@/components/group-chat-panel";
import { RealtimeGroupSync } from "@/components/realtime-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type GroupTaskCluster = {
  assigneeCount: number;
  assignmentLabel: string;
  completionCount: number;
  createdAt: Date;
  details: string | null;
  difficulty: string;
  isAssignedToEveryone: boolean;
  linkTaskId: string;
  priority: string;
  proofCount: number;
  statusLabel: string;
  title: string;
};

function buildTaskClusters(
  groupTasks: Array<{
    id: string;
    title: string;
    details: string | null;
    priority: string;
    difficulty: string;
    status: string;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      name: string;
    };
    checkIn: {
      id: string;
      status: string;
    } | null;
    broadcastKey: string | null;
  }>,
  currentUserId: string,
  totalGroupMembers: number,
): GroupTaskCluster[] {
  const grouped = new Map<string, typeof groupTasks>();

  for (const task of groupTasks) {
    const key = task.broadcastKey ?? task.id;
    const bucket = grouped.get(key) ?? [];
    bucket.push(task);
    grouped.set(key, bucket);
  }

  return Array.from(grouped.values()).map((taskGroup) => {
    const primaryTask = taskGroup[0];
    const viewerTask = taskGroup.find((task) => task.userId === currentUserId) ?? primaryTask;
    const assigneeNames = Array.from(new Set(taskGroup.map((task) => task.user.name)));
    const completionCount = taskGroup.filter((task) => task.status === "COMPLETED").length;
    const proofCount = taskGroup.filter((task) => task.checkIn).length;
    const isAssignedToEveryone = taskGroup.length === totalGroupMembers;
    const extraAssignees = Math.max(assigneeNames.length - 3, 0);
    const visibleAssignees = assigneeNames.slice(0, 3).join(", ");

    let statusLabel = "Pending";
    if (completionCount === taskGroup.length) {
      statusLabel = "Completed";
    } else if (proofCount > 0 || taskGroup.some((task) => task.status === "IN_PROGRESS")) {
      statusLabel = "In progress";
    } else if (taskGroup.some((task) => task.status === "MISSED")) {
      statusLabel = "Needs attention";
    }

    return {
      assigneeCount: taskGroup.length,
      assignmentLabel: isAssignedToEveryone
        ? `Assigned to everyone (${taskGroup.length})`
        : extraAssignees > 0
          ? `Assigned to ${visibleAssignees} +${extraAssignees} more`
          : `Assigned to ${visibleAssignees}`,
      completionCount,
      createdAt: primaryTask.createdAt,
      details: primaryTask.details,
      difficulty: primaryTask.difficulty,
      isAssignedToEveryone,
      linkTaskId: viewerTask.id,
      priority: primaryTask.priority,
      proofCount,
      statusLabel,
      title: primaryTask.title,
    };
  });
}

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      createdBy: { select: { name: true } },
      users: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tasks: {
        where: {
          scope: "GROUP",
          day: { gte: today },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          checkIn: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        take: 60,
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    return <div className="p-8 text-white">Group not found</div>;
  }

  const membership = group.users.find((item) => item.userId === session.user.id);
  if (!membership) {
    return <div className="p-8 text-white">You are not a member of this group.</div>;
  }

  const completedMembers = group.users.filter((item) => item.completions > 0).length;
  const taskClusters = buildTaskClusters(group.tasks, session.user.id, group.users.length);
  const chatMessages = group.messages
    .slice()
    .reverse()
    .map((message) => ({
      id: message.id,
      groupId: message.groupId,
      content: message.content ?? "",
      createdAt: message.createdAt.toISOString(),
      user: {
        id: message.user.id,
        name: message.user.name,
        image: message.user.image,
      },
    }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <RealtimeGroupSync groupId={groupId} />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Group Feed
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{group.name}</h1>
              <p className="max-w-2xl text-white/60">{group.description || "No description provided."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {membership.role === "admin" ? (
                <Link href={`/groups/${groupId}/settings`}>
                  <Button variant="outline">Settings</Button>
                </Link>
              ) : null}
              <Link href="/tasks">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Group Snapshot</CardTitle>
            <CardDescription className="text-white/50">The live state of this study pact.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] border border-primary/10 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members</div>
              <div className="mt-1 text-2xl font-black text-primary">{group.users.length}</div>
            </div>
            <div className="rounded-[14px] border border-primary/10 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Open assignments</div>
              <div className="mt-1 text-2xl font-black text-primary">{taskClusters.length}</div>
            </div>
            <div className="rounded-[14px] border border-primary/10 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Leader</div>
              <div className="mt-1 text-sm font-semibold text-white">{group.createdBy.name}</div>
            </div>
            <div className="rounded-[14px] border border-primary/10 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members active</div>
              <div className="mt-1 text-2xl font-black text-primary">{completedMembers}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Assignments</CardTitle>
              <CardDescription className="text-white/50">
                Whole-group tasks and targeted assignments live together here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskClusters.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/45">
                  No tasks posted yet.
                </div>
              ) : (
                taskClusters.map((task) => (
                  <div
                    key={task.linkTaskId}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.16)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-bold text-white">{task.title}</div>
                          <span className="badge-muted">{task.statusLabel}</span>
                          {task.isAssignedToEveryone ? <span className="badge-active">Group task</span> : null}
                        </div>
                        <div className="text-xs text-white/45">
                          {task.assignmentLabel} · {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                        </div>
                      </div>

                      <div className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        {task.completionCount}/{task.assigneeCount} completed
                      </div>
                    </div>

                    {task.details ? <p className="mt-3 text-sm text-white/60">{task.details}</p> : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="badge-muted">Priority: {task.priority}</span>
                      <span className="badge-muted">Difficulty: {task.difficulty}</span>
                      <span className="badge-muted">{task.proofCount} proof submission(s)</span>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link href={`/groups/${groupId}/task/${task.linkTaskId}`}>
                        <Button variant="ghost" className="gap-2 text-primary">
                          Open task
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Invite Code</CardTitle>
                <CardDescription className="text-white/50">Share this with members who need access.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-[14px] border border-primary/15 bg-primary/10 p-5 text-center font-mono text-2xl font-black tracking-[0.3em] text-primary">
                  {group.inviteCode.toUpperCase()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-white">Conversation</CardTitle>
                <CardDescription className="text-white/50">
                  Use the chat like a group thread for updates, nudges, and quick coordination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/60">
                <div className="flex items-start gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
                  <MessageCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <div>Messages appear instantly for everyone in the active group.</div>
                </div>
                <div className="flex items-start gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
                  <Users className="mt-0.5 h-4 w-4 text-primary" />
                  <div>Leaders can pair targeted assignments with context right inside the same thread.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <GroupChatPanel
          currentUserId={session.user.id}
          groupId={groupId}
          groupName={group.name}
          initialMessages={chatMessages}
        />
      </div>
    </div>
  );
}
