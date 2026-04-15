import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/lib/actions/task";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";

type TaskRow = Awaited<ReturnType<typeof db.task.findMany>>[number];

const statusLabels: Record<string, { label: string; style: React.CSSProperties }> = {
  PENDING:     { label: "Not Started", style: { background: "rgba(196,172,120,0.06)", color: "rgba(237,230,214,0.45)", border: "1px solid rgba(196,172,120,0.12)" } },
  IN_PROGRESS: { label: "In Progress", style: { background: "rgba(154,170,120,0.13)", color: "#AABB88",  border: "1px solid rgba(154,170,120,0.28)" } },
  COMPLETED:   { label: "Completed",   style: { background: "rgba(154,170,120,0.13)", color: "#AABB88",  border: "1px solid rgba(154,170,120,0.28)" } },
  MISSED:      { label: "Overdue",     style: { background: "rgba(160,104,104,0.12)", color: "#C08888",  border: "1px solid rgba(160,104,104,0.28)" } },
};

const statBox = "rounded-xl p-4" as const;
const statLabel = "text-[10px] uppercase tracking-[0.2em] text-[#6A7888] font-semibold" as const;
const statValue = "mt-1 text-2xl font-bold text-[#C4AC78]" as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const view = params.view === "personal" ? "personal" : "group";

  const personalTasks: TaskRow[] = await db.task.findMany({
    where: { userId: session.user.id, scope: "PERSONAL" },
    include: { group: true, checkIn: { include: { startFiles: true, endFiles: true } } },
    orderBy: { createdAt: "desc" },
  });

  const groupTasks: TaskRow[] = activeGroupId
    ? await db.task.findMany({
        where: { userId: session.user.id, groupId: activeGroupId, scope: "GROUP" },
        include: { group: true, checkIn: { include: { startFiles: true, endFiles: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const taskCards = view === "personal" ? personalTasks : groupTasks;
  const targetGroups = memberships.map((m) => m.group);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
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
            Personal tasks live beside group broadcasts. Each broadcast task is copied to every member of the selected group.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks?view=personal">
            <Button variant={view === "personal" ? "default" : "outline"} size="sm">Personal Tasks</Button>
          </Link>
          <Link href="/tasks?view=group">
            <Button variant={view === "group" ? "default" : "outline"} size="sm">Group Tasks</Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: CalendarDays, value: personalTasks.length, label: "Personal tasks" },
          { icon: Clock3,       value: groupTasks.length,    label: "Group tasks in active context" },
          { icon: CheckCircle2, value: taskCards.filter((t) => t.status === "COMPLETED").length, label: "Already completed" },
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
        {/* Create form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>Add due date, priority, and select groups for broadcast tasks.</CardDescription>
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
                  <Input id="task-due" name="dueAt" type="datetime-local" />
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

        {/* Task list */}
        <Card>
          <CardHeader>
            <CardTitle>
              {view === "personal" ? "Personal Tasks" : activeGroup?.name ? `${activeGroup.name} tasks` : "Group Tasks"}
            </CardTitle>
            <CardDescription>
              {view === "personal"
                ? "Tasks that belong only to you."
                : activeGroup?.name
                  ? "Tasks broadcast in the active group context."
                  : "Join a group to see group tasks."}
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
            ) : (
              taskCards.map((task) => {
                const status = statusLabels[task.status] ?? statusLabels.PENDING;
                const proofStatus =
                  task.checkIn?.status === "APPROVED" ? "Verified"
                  : task.checkIn?.status === "REJECTED" ? "Rejected"
                  : task.checkIn ? "Pending review"
                  : "No proof yet";

                return (
                  <div key={task.id} style={{
                    background: "rgba(196,172,120,0.04)", backdropFilter: "blur(12px)",
                    borderTop: "1px solid rgba(196,172,120,0.14)", borderLeft: "1px solid rgba(196,172,120,0.09)",
                    borderRight: "1px solid rgba(196,172,120,0.05)", borderBottom: "1px solid rgba(196,172,120,0.04)",
                    borderRadius: 14, padding: 16,
                    ...(task.status === "MISSED" ? { borderLeft: "3px solid #A06868" } : {}),
                    ...(task.status === "COMPLETED" || task.status === "IN_PROGRESS" ? { borderLeft: "3px solid #C4AC78" } : {}),
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#EDE6D6" }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: "#6A7888", marginTop: 3 }}>
                          {task.group.name} · due {task.dueAt ? new Date(task.dueAt).toLocaleString() : new Date(task.day).toLocaleString()}
                        </div>
                      </div>
                      <span style={{
                        ...status.style,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", padding: "3px 10px", borderRadius: 9999,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {status.label}
                      </span>
                    </div>

                    {task.details && <p style={{ fontSize: 13, color: "#A09880", marginTop: 8 }}>{task.details}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {[`Priority: ${task.priority}`, `Proof: ${proofStatus}`].map((tag) => (
                        <span key={tag} style={{
                          background: "rgba(196,172,120,0.06)", border: "1px solid rgba(196,172,120,0.12)",
                          borderRadius: 9999, padding: "2px 10px", fontSize: 11, color: "#A09880",
                        }}>{tag}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(196,172,120,0.07)" }}>
                      <Link href={`/groups/${task.groupId}/task/${task.id}`} style={{ fontSize: 13, fontWeight: 500, color: "#C4AC78" }}>
                        Open task
                      </Link>
                      <Link href={`/proof-work?taskId=${task.id}`} style={{ fontSize: 13, fontWeight: 500, color: "#A09880", display: "flex", alignItems: "center", gap: 4 }}>
                        Submit proof <ArrowRight style={{ width: 14, height: 14 }} />
                      </Link>
                    </div>

                    {task.checkIn?.status === "REJECTED" && (task.checkIn as { reviewNote?: string }).reviewNote ? (
                      <div style={{
                        marginTop: 10, background: "rgba(160,104,104,0.10)", border: "1px solid rgba(160,104,104,0.24)",
                        borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#C08888",
                      }}>
                        Rejected: {(task.checkIn as { reviewNote?: string }).reviewNote}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
