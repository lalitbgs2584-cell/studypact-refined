import { TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncTaskTracker } from "@/lib/tracker";

function resolveStatus(value: unknown) {
  if (value === "COMPLETED") return TaskStatus.COMPLETED;
  if (value === "MISSED") return TaskStatus.MISSED;
  return TaskStatus.PENDING;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await request.json().catch(() => ({}));
  const nextStatus = resolveStatus(body.status);

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      userId: true,
      scope: true,
    },
  });

  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.scope === "GROUP" && nextStatus === TaskStatus.COMPLETED) {
    return NextResponse.json({ error: "Group tasks require proof approval" }, { status: 400 });
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
      completedAt: nextStatus === TaskStatus.COMPLETED ? new Date() : null,
    },
  });

  await syncTaskTracker(taskId);

  return NextResponse.json(updatedTask);
}
