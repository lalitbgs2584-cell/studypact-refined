"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import crypto from "crypto";
import { cookies } from "next/headers";
import { ACTIVE_GROUP_COOKIE } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { TaskCategory, TaskPriority, TaskScope, TaskStatus } from "@prisma/client";

export async function createTask(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

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
  const selectedGroupIds = formData.getAll("groupIds").map((value) => String(value).trim()).filter(Boolean);
  
  if (!title) throw new Error("Missing required fields");

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  const activeGroupId = groupId || (await cookies()).get(ACTIVE_GROUP_COOKIE)?.value || null;
  const targetGroupIds = scope === "GROUP" ? selectedGroupIds : activeGroupId ? [activeGroupId] : [];

  if (scope === "GROUP" && targetGroupIds.length === 0) {
    throw new Error("Select at least one group");
  }

  if (scope === "PERSONAL" && !activeGroupId) {
    throw new Error("Join a group first to create personal tasks");
  }

  const taskCopies: Array<{
    title: string;
    details: string | null;
    category: TaskCategory;
    priority: TaskPriority;
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
      const members = await db.userGroup.findMany({
        where: { groupId: targetGroupId },
        select: { userId: true },
      });

      if (!members.some((member) => member.userId === session.user.id)) {
        throw new Error("You can only broadcast to groups you belong to");
      }

      for (const member of members) {
        taskCopies.push({
          title,
          details: details || null,
          category,
          priority,
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

  await db.task.createMany({
    data: taskCopies,
  });

  if (pusherServer && targetGroupIds.length > 0) {
    for (const targetGroupId of targetGroupIds) {
      pusherServer.trigger(`group-${targetGroupId}`, "new-task", {
        title,
      }).catch(console.error);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  revalidatePath("/assignments");
  redirect("/tasks");
}
