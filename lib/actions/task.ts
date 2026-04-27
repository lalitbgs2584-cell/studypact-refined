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

function withSearchParam(path: string, key: string, value: string) {
  const [pathname, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  params.set(key, value);
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
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
  const assignmentMode = ((formData.get("assignmentMode") as string) || "SELF").trim().toUpperCase();
  const dueAtRaw = (formData.get("dueAt") as string) || "";
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const returnTo = ((formData.get("returnTo") as string) || "/tasks").trim() || "/tasks";
  const assigneeIds = Array.from(
    new Set(formData.getAll("assigneeIds").map((value) => String(value).trim()).filter(Boolean)),
  );

  if (!title) redirect(withSearchParam(returnTo, "error", "Title is required"));

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  if (dueAtRaw && (!dueAt || Number.isNaN(dueAt.getTime()))) {
    redirect(withSearchParam(returnTo, "error", "Enter a valid due date"));
  }

  const cookieGroupId = (await cookies()).get(ACTIVE_GROUP_COOKIE)?.value || null;
  const activeGroupId = groupId || cookieGroupId || null;

  if (!activeGroupId) redirect(withSearchParam(returnTo, "error", "Join a group first"));

  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: activeGroupId,
      },
    },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          taskPostingMode: true,
          users: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect(withSearchParam(returnTo, "error", "You can only create tasks inside a group you belong to"));
  }

  const isLeader = membership.role === "admin";
  const groupMemberIds = membership.group.users.map((member) => member.userId);
  const taskAssignees =
    scope === TaskScope.PERSONAL
      ? [session.user.id]
      : assignmentMode === "SELECTED_MEMBERS"
        ? assigneeIds
        : groupMemberIds;

  if (scope === TaskScope.GROUP && assignmentMode === "SELECTED_MEMBERS" && !isLeader) {
    redirect(withSearchParam(returnTo, "error", "Only the group leader can assign tasks to selected members"));
  }

  if (
    scope === TaskScope.GROUP &&
    assignmentMode !== "SELECTED_MEMBERS" &&
    !isLeader &&
    membership.group.taskPostingMode === "ADMINS_ONLY"
  ) {
    redirect(withSearchParam(returnTo, "error", "Only the group leader can post group tasks in this group"));
  }

  if (scope === TaskScope.GROUP && taskAssignees.length === 0) {
    redirect(
      withSearchParam(
        returnTo,
        "error",
        assignmentMode === "SELECTED_MEMBERS" ? "Choose at least one member" : "No members found in this group",
      ),
    );
  }

  if (scope === TaskScope.GROUP && taskAssignees.some((userId) => !groupMemberIds.includes(userId))) {
    redirect(withSearchParam(returnTo, "error", "Selected members must belong to the chosen group"));
  }

  try {
    const broadcastKey = scope === TaskScope.GROUP ? crypto.randomUUID() : null;
    const createdTaskIds = await db.$transaction(async (tx) => {
      const createdIds: string[] = [];
      for (const userId of taskAssignees) {
        const task = await tx.task.create({
          data: {
            title,
            details: details || null,
            category,
            priority,
            difficulty,
            blockType,
            day: dueAt ?? new Date(),
            dueAt,
            status: TaskStatus.PENDING,
            userId,
            groupId: activeGroupId,
            scope,
            broadcastKey,
          },
          select: { id: true },
        });
        createdIds.push(task.id);
      }

      return createdIds;
    });

    await syncTaskTrackers(createdTaskIds);

    emitGroupEvent(activeGroupId, "new-task", {
      title,
      scope,
      assigneeCount: taskAssignees.length,
    });

    revalidatePath("/dashboard");
    revalidatePath("/leader");
    revalidatePath("/leader/tasks");
    revalidatePath("/tasks");
    revalidatePath("/proof-work");
    revalidatePath("/tracker");
    revalidatePath("/uploads");
    revalidatePath(`/groups/${activeGroupId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create task";
    redirect(withSearchParam(returnTo, "error", msg));
  }

  const successMessage =
    scope === TaskScope.PERSONAL
      ? "Task created"
      : assignmentMode === "SELECTED_MEMBERS"
        ? `Task assigned to ${taskAssignees.length} member(s)`
        : `Task shared with ${taskAssignees.length} member(s)`;

  redirect(withSearchParam(returnTo, "success", successMessage));
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
