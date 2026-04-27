export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListTodo,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskFormFields } from "@/components/task-form-fields";
import { Select } from "@/components/ui/select";
import { postDsaGroupTask } from "@/lib/actions/leader";
import { createTask } from "@/lib/actions/task";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function parseDsaTaskDetails(details: string | null) {
  const result = {
    topic: "",
    link: "",
  };

  if (!details) {
    return result;
  }

  for (const line of details.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === "topic") {
      result.topic = value;
    }

    if (key === "link") {
      result.link = value;
    }
  }

  return result;
}

export default async function LeaderTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const { leaderGroupId, leaderGroup } = await requireLeaderWorkspace();
  const params = (await searchParams) ?? {};
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;
  const successMessage = params.success ? decodeURIComponent(params.success) : null;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  const defaultDueDate = `${todayEnd.getFullYear()}-${pad(todayEnd.getMonth() + 1)}-${pad(todayEnd.getDate())}T23:59`;
  const leaderTaskForm = (
    <>
      <input type="hidden" name="returnTo" value="/leader/tasks" />
      <TaskFormFields
        memberships={[
          {
            groupId: leaderGroupId,
            role: "admin",
            group: {
              id: leaderGroup.id,
              name: leaderGroup.name,
              taskPostingMode: leaderGroup.taskPostingMode,
              users: leaderGroup.users.map((member) => ({
                userId: member.userId,
                name: member.user.name,
                role: member.role,
              })),
            },
          },
        ]}
        activeGroupId={leaderGroupId}
        defaultDueDate={defaultDueDate}
      />
    </>
  );

  const tasks = await db.task.findMany({
    where: {
      groupId: leaderGroupId,
      day: { gte: weekAgo },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      checkIn: {
        select: {
          id: true,
          status: true,
          reflection: true,
        },
      },
    },
    take: 50,
  });

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
  const missed = tasks.filter((t) => t.status === "MISSED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leader">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      {errorMessage ? (
        <div
          style={{
            background: "rgba(160,104,104,0.10)",
            border: "1px solid rgba(160,104,104,0.24)",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: "#C08888",
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          style={{
            background: "rgba(104,160,120,0.10)",
            border: "1px solid rgba(104,160,120,0.24)",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: "#8BC79A",
          }}
        >
          {successMessage}
        </div>
      ) : null}

      <Card className="overflow-hidden border-l-4 border-l-violet-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            <ListTodo className="h-3.5 w-3.5" />
            Task Feed
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {leaderGroup.name} - Tasks (7 days)
          </h1>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">{completed} completed</span>
            <span className="text-blue-400">{pending} pending</span>
            <span className="text-red-400">{missed} missed</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-l-4 border-l-violet-500/70">
          <CardHeader>
            <CardTitle className="text-white">Post Today&apos;s DSA Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={postDsaGroupTask} className="space-y-4">
              <input type="hidden" name="groupId" value={leaderGroupId} />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="questionName"
                  placeholder="e.g. Two Sum"
                  required
                />
                <Input
                  name="questionLink"
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  required
                />
              </div>

              <Select name="topic" defaultValue="" required>
                <option value="" disabled>
                  Select topic
                </option>
                <option value="Arrays">Arrays</option>
                <option value="Strings">Strings</option>
                <option value="Linked List">Linked List</option>
                <option value="Trees">Trees</option>
                <option value="Graphs">Graphs</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
                <option value="Sliding Window">Sliding Window</option>
                <option value="Two Pointers">Two Pointers</option>
                <option value="Binary Search">Binary Search</option>
                <option value="Stack & Queue">Stack & Queue</option>
                <option value="Backtracking">Backtracking</option>
                <option value="Greedy">Greedy</option>
                <option value="Heap">Heap</option>
                <option value="Trie">Trie</option>
                <option value="Math">Math</option>
              </Select>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  Post as Daily DSA Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500/40">
          <CardHeader>
            <CardTitle className="text-white">Assign Group or Member Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-4">
              {leaderTaskForm}

              <div className="flex justify-end">
                <Button type="submit">
                  Create Assignment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ListTodo className="mx-auto mb-3 h-10 w-10 text-violet-400/30" />
            <div className="text-lg font-bold text-white/60">No tasks this week</div>
            <div className="text-sm text-white/40">Members haven&apos;t posted tasks yet.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isDsaGroupTask = task.category === "DSA" && task.scope === "GROUP";
            const dsaMeta = isDsaGroupTask ? parseDsaTaskDetails(task.details) : null;

            return (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {task.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      ) : task.status === "MISSED" ? (
                        <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-white">{task.title}</span>
                          <span className={cn(
                            "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            task.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                            task.status === "MISSED" ? "bg-red-500/15 text-red-400" :
                            task.status === "IN_PROGRESS" ? "bg-blue-500/15 text-blue-400" :
                            "bg-white/10 text-white/40"
                          )}>
                            {task.status}
                          </span>
                        </div>
                        <div className="text-xs text-white/40">
                          {task.user.name} - {task.day.toLocaleDateString()}
                          {task.category !== "CUSTOM" && ` - ${task.category}`}
                          {task.scope === "GROUP" && " - Group Task"}
                        </div>

                        {isDsaGroupTask && (dsaMeta?.topic || dsaMeta?.link) ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {dsaMeta?.topic ? (
                              <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
                                {dsaMeta.topic}
                              </span>
                            ) : null}
                            {dsaMeta?.link ? (
                              <a
                                href={dsaMeta.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
                              >
                                Open Problem &rarr;
                              </a>
                            ) : null}
                          </div>
                        ) : null}

                        {!isDsaGroupTask && task.details ? (
                          <div className="mt-2 text-sm text-white/55">
                            {task.details}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.checkIn ? (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          task.checkIn.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400" :
                          task.checkIn.status === "REJECTED" ? "bg-red-500/15 text-red-400" :
                          "bg-orange-500/15 text-orange-400"
                        )}>
                          Proof: {task.checkIn.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/30">No proof</span>
                      )}
                      <Link href={`/groups/${leaderGroupId}/task/${task.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-400">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
