import { NextResponse } from "next/server";

import { TaskStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

type OverdueTaskRow = {
  id: string;
  title: string;
  userId: string;
  groupId: string;
  checkInId: string | null;
  dailyPenalty: number;
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const overdueTasks = await tx.$queryRaw<OverdueTaskRow[]>`
        SELECT
          t.id,
          t.title,
          t."userId",
          t."groupId",
          t."checkInId",
          COALESCE(g."dailyPenalty", 10)::int AS "dailyPenalty"
        FROM "task" t
        INNER JOIN "group" g ON g.id = t."groupId"
        WHERE t.status = ${TaskStatus.PENDING}
          AND t."day" < (date_trunc('day', timezone('Asia/Kolkata', now())) AT TIME ZONE 'Asia/Kolkata')
        ORDER BY t."day" ASC, t."createdAt" ASC
      `;

      if (overdueTasks.length === 0) {
        return {
          penalizedTaskIds: [] as string[],
          affectedGroupIds: [] as string[],
        };
      }

      const penalizedTaskIds = overdueTasks.map((task) => task.id);
      const affectedGroupIds = [...new Set(overdueTasks.map((task) => task.groupId))];
      const groupedPenalties = new Map<string, { userId: string; groupId: string; points: number; misses: number }>();

      for (const task of overdueTasks) {
        const key = `${task.userId}:${task.groupId}`;
        const current = groupedPenalties.get(key) ?? {
          userId: task.userId,
          groupId: task.groupId,
          points: 0,
          misses: 0,
        };

        current.points += task.dailyPenalty;
        current.misses += 1;
        groupedPenalties.set(key, current);
      }

      await tx.task.updateMany({
        where: {
          id: {
            in: penalizedTaskIds,
          },
          status: TaskStatus.PENDING,
        },
        data: {
          status: TaskStatus.MISSED,
        },
      });

      await tx.penaltyEvent.createMany({
        data: overdueTasks.map((task) => ({
          points: task.dailyPenalty,
          reason: `Missed deadline for task: ${task.title}`,
          userId: task.userId,
          groupId: task.groupId,
          checkInId: task.checkInId ?? null,
        })),
      });

      await Promise.all(
        [...groupedPenalties.values()].map((penalty) =>
          tx.userGroup.update({
            where: {
              userId_groupId: {
                userId: penalty.userId,
                groupId: penalty.groupId,
              },
            },
            data: {
              points: { decrement: penalty.points },
              streak: 0,
              misses: { increment: penalty.misses },
            },
          })
        )
      );

      return {
        penalizedTaskIds,
        affectedGroupIds,
      };
    });

    if (result.penalizedTaskIds.length === 0) {
      return NextResponse.json({
        message: "No overdue tasks found.",
      });
    }

    for (const groupId of result.affectedGroupIds) {
      pusherServer.trigger(`group-${groupId}`, "new-verification", { source: "cron" });
    }

    return NextResponse.json({
      message: `Successfully processed ${result.penalizedTaskIds.length} overdue tasks.`,
      penalizedTasks: result.penalizedTaskIds,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}