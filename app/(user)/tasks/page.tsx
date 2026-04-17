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
import { createTask, setTaskStatus } from "@/lib/actions/task";
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
  searchParams?: Promise<{ view?: string; error?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const view = params.view === "group" ? "group" : "personal";
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;
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
        where: {
          userId: session.user.id,
          groupId: activeGroupId,
          scope: "GROUP",
          OR: [{ dueAt: { lte: today } }, { dueAt: null }],
        },
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
      {errorMessage && (
        <div style={{
          background: "rgba(160,104,104,0.10)", border: "1px solid rgba(160,104,104,0.24)",
          borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C08888",
        }}>{errorMessage}</div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(196,172,120,0.08)",
              border: "1px solid rgba(196,172,120,0.20)",
              borderRadius: 9999,
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: "#C4AC78",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            Tasks
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#EDE6D6", margin: 0 }}>
            Task hub
          </h1>
          <p style={{ fontSize: 13, color: "#A09880", maxWidth: 520 }}>
            Click personal tasks to mark done or missed. Every task now feeds your tracker, streaks, and weekly reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks?view=personal">
            <Button variant={view === "personal" ? "default" : "outline"} size="sm">
              Personal
            </Button>
          </Link>
          <Link href="/tasks?view=group">
            <Button variant={view === "group" ? "default" : "outline"} size="sm">
              Group
            </Button>
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
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: "rgba(196,172,120,0.08)",
                  border: "1px solid rgba(196,172,120,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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
            <CardDescription>
              All tasks default to today&apos;s end. Block + difficulty now power the consistency engine and weekly reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="task-group">Group</Label>
                <Select id="task-group" name="groupId" defaultValue={activeGroupId ?? memberships[0]?.groupId ?? ""}>
                  {memberships.map((m) => (
                    <option key={m.groupId} value={m.groupId}>{m.group.name}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input id="task-title" name="title" placeholder="Solve 2 medium Leetcode questions" required />
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
                  <Select id="task-priority" name="priority" defaultValue="MEDIUM">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-difficulty">Difficulty</Label>
                  <Select id="task-difficulty" name="difficulty" defaultValue="MEDIUM">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-block">Study block</Label>
                  <Select id="task-block" name="blockType" defaultValue="DEEP_WORK">
                    <option value="DEEP_WORK">Block 1 - Deep Work (DSA)</option>
                    <option value="LEARNING">Block 2 - Learning</option>
                    <option value="PROJECTS">Block 3 - Projects</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-scope">Scope</Label>
                  <Select id="task-scope" name="scope" defaultValue="PERSONAL">
                    <option value="PERSONAL">Personal task</option>
                    <option value="GROUP">Group broadcast</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Broadcast groups</Label>
                  <Select name="groupIds" multiple className="min-h-28">
                    {targetGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Select>
                  <p style={{ fontSize: 11, color: "#6A7888", marginTop: 4 }}>Hold Ctrl / Cmd to select multiple.</p>
                </div>
              </div>

              <p style={{ fontSize: 12, color: "#6A7888", marginTop: -4 }}>
                Repeating the same task name builds a longer tracker stream, so habits like DSA reps or project shipping compound over time.
              </p>

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
                ? "Mark done or missed to keep your tracker honest."
                : "Submit proof to complete, or explicitly mark a miss."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {taskCards.length === 0 ? (
              <div
                style={{
                  background: "rgba(196,172,120,0.04)",
                  border: "1px solid rgba(196,172,120,0.09)",
                  borderRadius: 12,
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#6A7888",
                  fontSize: 13,
                }}
              >
                No tasks yet.
              </div>
            ) : view === "personal" ? (
              taskCards.map((task) => <PersonalTaskItem key={task.id} task={task} />)
            ) : (
              taskCards.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: "rgba(196,172,120,0.04)",
                    backdropFilter: "blur(12px)",
                    borderTop: "1px solid rgba(196,172,120,0.14)",
                    borderLeft: "1px solid rgba(196,172,120,0.09)",
                    borderRight: "1px solid rgba(196,172,120,0.05)",
                    borderBottom: "1px solid rgba(196,172,120,0.04)",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#EDE6D6" }}>{task.title}</div>
                    <span className={task.status === "MISSED" ? "badge-risk" : task.status === "COMPLETED" ? "badge-active" : "badge-muted"}>
                      {task.status}
                    </span>
                  </div>

                  {task.details && <p style={{ fontSize: 13, color: "#A09880", marginTop: 6 }}>{task.details}</p>}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <span className="badge-muted">{task.blockType.replace("_", " ")}</span>
                    <span className="badge-muted">{task.difficulty}</span>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(196,172,120,0.07)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <Link href={`/proof-work?taskId=${task.id}`} style={{ fontSize: 13, fontWeight: 500, color: "#C4AC78" }}>
                        Submit proof →
                      </Link>
                      {task.status !== "MISSED" ? (
                        <form action={setTaskStatus.bind(null, task.id, "MISSED")}>
                          <Button type="submit" size="sm" variant="outline" className="text-xs text-red-300">
                            Mark missed
                          </Button>
                        </form>
                      ) : (
                        <form action={setTaskStatus.bind(null, task.id, "PENDING")}>
                          <Button type="submit" size="sm" variant="outline" className="text-xs">
                            Reset
                          </Button>
                        </form>
                      )}
                    </div>
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
