export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListTodo,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function LeaderTasksPage() {
  const { leaderGroupId, leaderGroup } = await requireLeaderWorkspace();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

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

      <Card className="overflow-hidden border-l-4 border-l-violet-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            <ListTodo className="h-3.5 w-3.5" />
            Task Feed
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {leaderGroup.name} — Tasks (7 days)
          </h1>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">{completed} completed</span>
            <span className="text-blue-400">{pending} pending</span>
            <span className="text-red-400">{missed} missed</span>
          </div>
        </CardContent>
      </Card>

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
          {tasks.map((task) => (
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
                        {task.user.name} · {task.day.toLocaleDateString()}
                        {task.category !== "CUSTOM" && ` · ${task.category}`}
                        {task.scope === "GROUP" && " · Group Task"}
                      </div>
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
          ))}
        </div>
      )}
    </div>
  );
}
