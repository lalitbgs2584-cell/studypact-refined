import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask } from "@/lib/actions/task";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Not Started", className: "bg-[#1A1A2E] text-[#AAAAAA]" },
  IN_PROGRESS: { label: "In Progress", className: "bg-[#003D2B] text-[#00FFB2]" },
  COMPLETED: { label: "Completed", className: "bg-[#003D2B] text-[#00FFB2]" },
  MISSED: { label: "Overdue", className: "bg-[#3D1A0A] text-[#FF6B35]" },
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const view = params.view === "personal" ? "personal" : "group";

  const personalTasks = await db.task.findMany({
    where: { userId: session.user.id, scope: "PERSONAL" },
    include: {
      group: true,
      checkIn: {
        include: {
          startFiles: true,
          endFiles: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const groupTasks = activeGroupId
    ? await db.task.findMany({
        where: { userId: session.user.id, groupId: activeGroupId, scope: "GROUP" },
        include: {
          group: true,
          checkIn: {
            include: {
              startFiles: true,
              endFiles: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const taskCards = view === "personal" ? personalTasks : groupTasks;
  const targetGroups = memberships.map((membership) => membership.group);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Tasks
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Task hub</h1>
          <p className="max-w-2xl text-white/60">
            Personal tasks live beside group broadcasts. Each broadcast task is copied to every member of the selected group.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/tasks?view=personal">
            <Button variant={view === "personal" ? "default" : "outline"}>Personal Tasks</Button>
          </Link>
          <Link href="/tasks?view=group">
            <Button variant={view === "group" ? "default" : "outline"}>Group Tasks</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <CalendarDays className="h-6 w-6 text-primary" />
            <div>
              <div className="text-2xl font-black text-primary">{personalTasks.length}</div>
              <div className="text-sm text-white/50">Personal tasks</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Clock3 className="h-6 w-6 text-primary" />
            <div>
              <div className="text-2xl font-black text-primary">{groupTasks.length}</div>
              <div className="text-sm text-white/50">Group tasks in active context</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <div className="text-2xl font-black text-primary">
                {taskCards.filter((task) => task.status === "COMPLETED").length}
              </div>
              <div className="text-sm text-white/50">Already completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Create Task</CardTitle>
            <CardDescription className="text-white/50">
              Add due date, priority, and select one or more groups for broadcast tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-5">
              <input type="hidden" name="groupId" value={activeGroupId ?? memberships[0]?.groupId ?? ""} />

              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-white/80">
                  Title
                </Label>
                <Input id="task-title" name="title" placeholder="Write the project summary" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-details" className="text-white/80">
                  Details
                </Label>
                <textarea
                  id="task-details"
                  name="details"
                  className="min-h-28 w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                  placeholder="What should be done?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-due" className="text-white/80">
                    Due date
                  </Label>
                  <Input id="task-due" name="dueAt" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority" className="text-white/80">
                    Priority
                  </Label>
                  <select
                    id="task-priority"
                    name="priority"
                    className="w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-scope" className="text-white/80">
                    Scope
                  </Label>
                  <select
                    id="task-scope"
                    name="scope"
                    className="w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="PERSONAL">Personal task</option>
                    <option value="GROUP">Group broadcast</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Broadcast groups</Label>
                  <select
                    name="groupIds"
                    multiple
                    className="min-h-28 w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    {targetGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/40">Hold Ctrl or Cmd to select multiple groups.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">
              {view === "personal" ? "Personal Tasks" : activeGroup?.name ? `${activeGroup.name} tasks` : "Group Tasks"}
            </CardTitle>
            <CardDescription className="text-white/50">
              {view === "personal"
                ? "Tasks that belong only to you."
                : activeGroup?.name
                  ? "Tasks broadcast in the active group context."
                  : "Join a group to see group tasks."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskCards.length === 0 ? (
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">
                No tasks yet.
              </div>
            ) : (
              taskCards.map((task) => {
                const status = statusLabels[task.status] ?? statusLabels.PENDING;
                const proofStatus =
                  task.checkIn?.status === "APPROVED"
                    ? "Verified"
                    : task.checkIn?.status === "REJECTED"
                      ? "Rejected"
                      : task.checkIn
                        ? "Pending review"
                        : "No proof yet";

                return (
                  <Card key={task.id} className="bg-black/35 shadow-[0_0_30px_-28px_rgba(0,0,0,0.8)]">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold text-white">{task.title}</div>
                          <div className="mt-1 text-xs text-white/45">
                            {task.group.name} • due {task.dueAt ? new Date(task.dueAt).toLocaleString() : new Date(task.day).toLocaleString()}
                          </div>
                        </div>
                        <span className={cn("rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", status.className)}>
                          {status.label}
                        </span>
                      </div>

                      {task.details ? <p className="text-sm text-white/60">{task.details}</p> : null}

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-[4px] bg-white/[0.05] px-2.5 py-1 text-white/60">
                          Priority: {task.priority}
                        </span>
                        <span className="rounded-[4px] bg-white/[0.05] px-2.5 py-1 text-white/60">
                          Proof: {proofStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <Link href={`/groups/${task.groupId}/task/${task.id}`} className="text-sm font-medium text-primary">
                          Open task
                        </Link>
                        <Link href={`/proof-work?taskId=${task.id}`} className="text-sm font-medium text-white/70 hover:text-white">
                          Submit proof <ArrowRight className="inline h-4 w-4" />
                        </Link>
                      </div>

                      {task.checkIn?.status === "REJECTED" && task.checkIn.reviewNote ? (
                        <div className="rounded-[4px] bg-accent/10 p-3 text-sm text-accent shadow-[0_0_24px_-22px_rgba(255,107,53,0.16)]">
                          Rejected: {task.checkIn.reviewNote}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
