import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

// Note: This endpoint should be secured by a CRON_SECRET or similar mechanism in production.
export async function GET(req: Request) {
  // Simple check for security token in headers
  if (
    process.env.CRON_SECRET &&
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Determine what constitutes a "missed" deadline.
    // For simplicity: any PENDING task older than 24 hours.
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueTasks = await db.task.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: cutoffDate,
        },
      },
      include: {
        user: true,
        group: true,
      },
    });

    if (overdueTasks.length === 0) {
      return NextResponse.json({ message: "No overdue tasks found." });
    }

    const penaltyUpdates = [];

    for (const task of overdueTasks) {
      // 1. Mark task as MISSED
      await db.task.update({
        where: { id: task.id },
        data: { status: "MISSED" },
      });

      // 2. Create the Penalty Event
      await db.penaltyEvent.create({
        data: {
          points: task.group.dailyPenalty || 10,
          reason: `Missed deadline for task: ${task.title}`,
          userId: task.userId,
          groupId: task.groupId,
        },
      });

      // 3. Deduct points & reset streak, add miss
      await db.userGroup.update({
        where: {
          userId_groupId: {
            userId: task.userId,
            groupId: task.groupId,
          },
        },
        data: {
          points: { decrement: task.group.dailyPenalty || 10 },
          streak: 0,
          misses: { increment: 1 },
        },
      });

      penaltyUpdates.push(task.id);

      // Trigger pusher event for the group to refresh stats
      if (pusherServer) {
        pusherServer
          .trigger(`group-${task.groupId}`, "new-verification", {})
          .catch(console.error);
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${penaltyUpdates.length} overdue tasks.`,
      penalizedTasks: penaltyUpdates,
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
