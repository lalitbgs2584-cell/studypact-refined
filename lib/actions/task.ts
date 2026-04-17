"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { emitGroupEvent } from "@/lib/pusher";
import crypto from "crypto";
import { cookies } from "next/headers";
import { ACTIVE_GROUP_COOKIE } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { TaskCategory, TaskPriority, TaskScope, TaskStatus } from "@prisma/client";

export async function createTask(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const title = ((formData.get("title") as string) || "").trim();
  const details = ((formData.get("details") as string) || "").trim();
  const categoryInput = (formData.get("category") as string) || "CUSTOM";
  const priorityInput = (formData.get("priority") as string) || "MEDIUM";
  const scopeInput = (formData.get("scope") as string) || "PERSONAL";
  const category = Object.values(TaskCategory).includes(categoryInput as TaskCategory)
    ? (categoryInput as TaskCategory)
    : TaskCategory.CUSTOM;
  const priority = Object.values(TaskPriority).includes(priorityInput as TaskPriority)
    ? (priorityInput as TaskPriority)
    : TaskPriority.MEDIUM;
  const scope = Object.values(TaskScope).includes(scopeInput as TaskScope)
    ? (scopeInput as TaskScope)
    : TaskScope.PERSONAL;
  const dueAtRaw = (formData.get("dueAt") as string) || "";
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const selectedGroupIds = formData.getAll("groupIds").map((v) => String(v).trim()).filter(Boolean);

  if (!title) redirect("/tasks?error=Title+is+required");

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  const activeGroupId = groupId || (await cookies()).get(ACTIVE_GROUP_COOKIE)?.value || null;
  const targetGroupIds = scope === "GROUP" ? selectedGroupIds : activeGroupId ? [activeGroupId] : [];

  if (scope === "GROUP" && targetGroupIds.length === 0) redirect("/tasks?error=Select+at+least+one+group");
  if (scope === "PERSONAL" && !activeGroupId) redirect("/tasks?error=Join+a+group+first");

  try {
    const taskCopies: Array<{
      title: string; details: string | null; category: TaskCategory;
      priority: TaskPriority; day: Date; dueAt: Date | null;
      status: TaskStatus; userId: string; groupId: string;
      scope: TaskScope; broadcastKey: string | null;
    }> = [];

    if (scope === "PERSONAL") {
      taskCopies.push({
        title, details: details || null, category, priority,
        day: dueAt ?? new Date(), dueAt,
        status: TaskStatus.PENDING, userId: session.user.id,
        groupId: activeGroupId!, scope, broadcastKey: null,
      });
    } else {
      const broadcastKey = crypto.randomUUID();
      for (const targetGroupId of targetGroupIds) {
        const members = await db.userGroup.findMany({
          where: { groupId: targetGroupId },
          select: { userId: true },
        });
        if (!members.some((m) => m.userId === session.user.id)) {
          redirect("/tasks?error=You+can+only+broadcast+to+groups+you+belong+to");
        }
        for (const member of members) {
          taskCopies.push({
            title, details: details || null, category, priority,
            day: dueAt ?? new Date(), dueAt,
            status: TaskStatus.PENDING, userId: member.userId,
            groupId: targetGroupId, scope, broadcastKey,
          });
        }
      }
    }

    await db.task.createMany({ data: taskCopies });

    for (const targetGroupId of targetGroupIds) {
      emitGroupEvent(targetGroupId, "new-task", { title });
    }

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    revalidatePath("/proof-work");
    revalidatePath("/uploads");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create task";
    redirect(`/tasks?error=${encodeURIComponent(msg)}`);
  }

  redirect("/tasks");
}

export async function togglePersonalTask(taskId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  try {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== session.user.id || task.scope !== "PERSONAL") return;

    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;

    await db.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : null,
      },
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  } catch {
    // silently fail — optimistic UI will revert on next render
  }
}
