export const dynamic = "force-dynamic";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Plus, Sparkles } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { PersonalTaskItem } from "@/components/personal-task-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/lib/actions/task";
import { db } from "@/lib/db";
import { getWorkspace, requireSession } from "@/lib/workspace";

type TaskRow = Prisma.TaskGetPayload<{
  include: {
    group: true;
  };
}>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const view = params.view === "personal" ? "personal" : "group";
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const personalTasks: TaskRow[] = await db.task.findMany({
    where: { userId: session.user.id, scope: "PERSONAL" },
    include: { group: true },
    orderBy: { createdAt: "desc" },
    distinct: ["id"],
  });

  const groupTasks: TaskRow[] = activeGroupId
    ? await db.task.findMany({
        where: { userId: session.user.id, groupId: activeGroupId, scope: "GROUP", dueAt: { lte: today } },
        include: { group: true },
        orderBy: { createdAt: "desc" },
        distinct: ["id"],
      })
    : [];

  const taskCards = view === "personal" ? personalTasks : groupTasks;
  const targetGroups = memberships.map((m) => m.group);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDueDate = `${todayEnd.getFullYear()}-${pad(todayEnd.getMonth() + 1)}-${pad(todayEnd.getDate())}T23:59`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(196,172,120,0.08)", border: "1px solid rgba(196,172,120,0.20)",
            borderRadius: 9999, padding: "5px 14px",
            fontSize: 11, fontWeight: 600, color: "#C4AC78", letterSpacing: "0.2em", textTransform: "uppercase",
          }}>
            <Sparkles style={{ width: 12, height: 12 }} />
            Tasks
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#EDE6D6", margin: 0 }}>Task hub</h1>
          <p style={{ fontSize: 13, color: "#A09880", maxWidth: 480 }}>
            Click personal tasks to mark complete. Group tasks require proof submission.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks?view=personal">
            <Button variant={view === "personal" ? "default" : "outline"} size="sm">Personal</Button>
          </Link>
          <Link href="/tasks?view=group">
            <Button variant={view === "group" ? "default" : "outline"} size="sm">Group</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: CalendarDays, value: personalTasks.length, label: "Personal tasks" },
          { icon: Clock3, value: groupTasks.length, label: "Group tasks" },
          { icon: CheckCircle2, value: taskCards.filter((t) => t.status === "COMPLETED").length, label: "Completed" },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(196,172,120,0.08)", border: "1px solid rgba(196,172,120,0.16)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 18, height: 18, color: "#C4AC78" }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#C4AC78", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#A09880", marginTop: 3 }}>{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>All tasks default to today's end. Personal tasks are click-to-complete.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-5">
              <input type="hidden" name="groupId" value={activeGroupId ?? memberships[0]?.groupId ?? ""} />

              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input id="task-title" name="title" placeholder="Write the project summary" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-details">Details</Label>
                <Textarea id="task-details" name="details" placeholder="What should be done?" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due date</Label>
                  <Input id="task-due" name="dueAt" type="datetime-local" defaultValue={defaultDueDate} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select id="task-priority" name="priority">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-scope">Scope</Label>
                  <Select id="task-scope" name="scope">
                    <option value="PERSONAL">Personal task</option>
                    <option value="GROUP">Group broadcast</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Broadcast groups</Label>
                  <Select name="groupIds" multiple className="min-h-28">
                    {targetGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </Select>
                  <p style={{ fontSize: 11, color: "#6A7888", marginTop: 4 }}>Hold Ctrl / Cmd to select multiple.</p>
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
            <CardTitle>{view === "personal" ? "Personal Tasks" : "Group Tasks"}</CardTitle>
            <CardDescription>
              {view === "personal"
                ? "Click to toggle completion."
                : "Submit proof to complete."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {taskCards.length === 0 ? (
              <div style={{
                background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)",
                borderRadius: 12, padding: "32px 16px", textAlign: "center", color: "#6A7888", fontSize: 13,
              }}>
                No tasks yet.
              </div>
            ) : view === "personal" ? (
              taskCards.map((task) => <PersonalTaskItem key={task.id} task={task} />)
            ) : (
              taskCards.map((task) => (
                <div key={task.id} style={{
                  background: "rgba(196,172,120,0.04)", backdropFilter: "blur(12px)",
                  borderTop: "1px solid rgba(196,172,120,0.14)", borderLeft: "1px solid rgba(196,172,120,0.09)",
                  borderRight: "1px solid rgba(196,172,120,0.05)", borderBottom: "1px solid rgba(196,172,120,0.04)",
                  borderRadius: 14, padding: 16,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#EDE6D6" }}>{task.title}</div>
                  {task.details && <p style={{ fontSize: 13, color: "#A09880", marginTop: 6 }}>{task.details}</p>}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(196,172,120,0.07)" }}>
                    <Link href={`/proof-work?taskId=${task.id}`} style={{ fontSize: 13, fontWeight: 500, color: "#C4AC78" }}>
                      Submit proof →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
