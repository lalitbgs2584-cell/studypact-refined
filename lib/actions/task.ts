"use server";

import crypto from "crypto";
import {
  StudyBlock,
  TaskCategory,
  TaskDifficulty,
  TaskPriority,
  TaskScope,
  TaskStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";
import { syncTaskTracker, syncTaskTrackers } from "@/lib/tracker";
import { ACTIVE_GROUP_COOKIE } from "@/lib/workspace";

function resolveTaskDifficulty(value: string | null | undefined) {
  return Object.values(TaskDifficulty).includes(value as TaskDifficulty)
    ? (value as TaskDifficulty)
    : TaskDifficulty.MEDIUM;
}

function resolveStudyBlock(value: string | null | undefined) {
  return Object.values(StudyBlock).includes(value as StudyBlock)
    ? (value as StudyBlock)
    : StudyBlock.DEEP_WORK;
}

function taskStatusPayload(nextStatus: TaskStatus) {
  return {
    status: nextStatus,
    completedAt: nextStatus === TaskStatus.COMPLETED ? new Date() : null,
  };
}

export async function createTask(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const title = ((formData.get("title") as string) || "").trim();
  const details = ((formData.get("details") as string) || "").trim();
  const categoryInput = (formData.get("category") as string) || "CUSTOM";
  const priorityInput = (formData.get("priority") as string) || "MEDIUM";
  const difficulty = resolveTaskDifficulty(formData.get("difficulty") as string);
  const blockType = resolveStudyBlock(formData.get("blockType") as string);
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
  const cookieGroupId = (await cookies()).get(ACTIVE_GROUP_COOKIE)?.value || null;
  const activeGroupId = groupId || cookieGroupId || null;
  const targetGroupIds = scope === "GROUP" ? selectedGroupIds : activeGroupId ? [activeGroupId] : [];

  if (scope === "GROUP" && targetGroupIds.length === 0) redirect("/tasks?error=Select+at+least+one+group");
  if (!activeGroupId) redirect("/tasks?error=Join+a+group+first");

  try {
    const createdTaskIds = await db.$transaction(async (tx) => {
      const taskCopies: Array<{
        title: string;
        details: string | null;
        category: TaskCategory;
        priority: TaskPriority;
        difficulty: TaskDifficulty;
        blockType: StudyBlock;
        day: Date;
        dueAt: Date | null;
        status: TaskStatus;
        userId: string;
        groupId: string;
        scope: TaskScope;
        broadcastKey: string | null;
      }> = [];

      if (scope === "PERSONAL") {
        taskCopies.push({
          title,
          details: details || null,
          category,
          priority,
          difficulty,
          blockType,
          day: dueAt ?? new Date(),
          dueAt,
          status: TaskStatus.PENDING,
          userId: session.user.id,
          groupId: activeGroupId!,
          scope,
          broadcastKey: null,
        });
      } else {
        const broadcastKey = crypto.randomUUID();
        for (const targetGroupId of targetGroupIds) {
          const members = await tx.userGroup.findMany({
            where: { groupId: targetGroupId },
            select: { userId: true },
          });

          if (!members.some((member) => member.userId === session.user.id)) {
            redirect("/tasks?error=You+can+only+broadcast+to+groups+you+belong+to");
          }

          for (const member of members) {
            taskCopies.push({
              title,
              details: details || null,
              category,
              priority,
              difficulty,
              blockType,
              day: dueAt ?? new Date(),
              dueAt,
              status: TaskStatus.PENDING,
              userId: member.userId,
              groupId: targetGroupId,
              scope,
              broadcastKey,
            });
          }
        }
      }

      const createdIds: string[] = [];
      for (const taskCopy of taskCopies) {
        const task = await tx.task.create({
          data: taskCopy,
          select: { id: true },
        });
        createdIds.push(task.id);
      }

      return createdIds;
    });

    await syncTaskTrackers(createdTaskIds);

    for (const targetGroupId of targetGroupIds) {
      emitGroupEvent(targetGroupId, "new-task", { title });
    }

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    revalidatePath("/proof-work");
    revalidatePath("/tracker");
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
      data: taskStatusPayload(newStatus),
    });

    await syncTaskTracker(taskId);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/tracker");
  } catch {
    // silently fail so the UI can self-correct on the next render
  }
}

export async function setTaskStatus(taskId: string, nextStatus: "PENDING" | "MISSED" | "COMPLETED") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const desiredStatus =
    nextStatus === "COMPLETED"
      ? TaskStatus.COMPLETED
      : nextStatus === "MISSED"
        ? TaskStatus.MISSED
        : TaskStatus.PENDING;

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        groupId: true,
        scope: true,
      },
    });

    if (!task || task.userId !== session.user.id) return;
    if (task.scope === "GROUP" && desiredStatus === TaskStatus.COMPLETED) return;

    await db.task.update({
      where: { id: taskId },
      data: taskStatusPayload(desiredStatus),
    });

    await syncTaskTracker(taskId);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/tracker");
    revalidatePath(`/groups/${task.groupId}`);
    revalidatePath(`/groups/${task.groupId}/task/${task.id}`);
  } catch {
    // silently fail so the UI can self-correct on the next render
  }
}
