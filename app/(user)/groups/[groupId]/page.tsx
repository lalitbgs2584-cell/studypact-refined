export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
      users: { include: { user: { select: { name: true } } } },
      tasks: {
        where: {
          scope: "GROUP",
          day: { gte: today },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          checkIn: true,
        },
      },
    },
  });

  if (!group) return <div className="p-8 text-white">Group not found</div>;

  const membership = group.users.find((item) => item.userId === session.user.id);
  if (!membership) return <div className="p-8 text-white">You are not a member of this group.</div>;

  const completedMembers = group.users.filter((item) => item.completions > 0).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
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
            <CardTitle className="text-white">Group Stats</CardTitle>
            <CardDescription className="text-white/50">Active context summary for this group.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members</div>
              <div className="mt-1 text-2xl font-black text-primary">{group.users.length}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Tasks</div>
              <div className="mt-1 text-2xl font-black text-primary">{group.tasks.length}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Leader</div>
              <div className="mt-1 text-sm font-semibold text-white">{group.createdBy.name}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members active</div>
              <div className="mt-1 text-2xl font-black text-primary">{completedMembers}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Tasks</CardTitle>
            <CardDescription className="text-white/50">Today&apos;s group broadcasts in this group.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.tasks.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">
                No tasks posted yet.
              </div>
            ) : (
              group.tasks.map((task) => {
                const status = task.status === "COMPLETED" ? "Completed" : task.status === "IN_PROGRESS" ? "In progress" : "Not started";

                return (
                  <Card key={task.id} className="bg-black/30 shadow-[0_0_30px_-28px_rgba(0,0,0,0.8)]">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold text-white">{task.title}</div>
                          <div className="mt-1 text-xs text-white/45">
                            by {task.user.name} · {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <span className="rounded-[4px] bg-secondary/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                          {status}
                        </span>
                      </div>
                      {task.details ? <p className="text-sm text-white/60">{task.details}</p> : null}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-white/45">Priority: {task.priority}</div>
                        <Link href={`/groups/${groupId}/task/${task.id}`} className="text-sm font-medium text-primary">
                          Open task <ArrowRight className="inline h-4 w-4" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Invite Code</CardTitle>
            <CardDescription className="text-white/50">Share this code with members who need access.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[4px] bg-primary/10 p-5 text-center font-mono text-2xl font-black tracking-[0.3em] text-primary shadow-[0_0_24px_-22px_rgba(0,255,178,0.18)]">
              {group.inviteCode.toUpperCase()}
            </div>
            <div className="mt-4 rounded-[4px] bg-secondary/30 p-4 text-sm text-white/60">
              Members can switch active context from the sidebar without leaving the page.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
