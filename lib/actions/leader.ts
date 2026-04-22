"use server";

import crypto from "crypto";
import {
  CheckInStatus,
  StudyBlock,
  TaskCategory,
  TaskDifficulty,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";
import { syncTaskTracker } from "@/lib/tracker";

async function requireLeaderActor(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const [actor, membership] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
    db.userGroup.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId },
      },
      select: { role: true },
    }),
  ]);

  const isGlobalAdmin = actor?.role === "admin";
  const isGroupLeader = membership?.role === "admin";

  if (!isGlobalAdmin && !isGroupLeader) {
    throw new Error("Only the group leader or a global admin can perform this action");
  }

  return session;
}

function resolveReturnTo(formData: FormData, fallback: string) {
  return ((formData.get("returnTo") as string) || "").trim() || fallback;
}

function revalidateLeaderPaths(groupId: string) {
  revalidatePath("/leader");
  revalidatePath("/leader/members");
  revalidatePath("/leader/proofs");
  revalidatePath("/leader/disputes");
  revalidatePath("/leader/tasks");
  revalidatePath("/leader/alerts");
  revalidatePath("/tracker");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath("/dashboard");
}

function resolveLeaderTaskCategory(value: string | null | undefined) {
  return Object.values(TaskCategory).includes(value as TaskCategory)
    ? (value as TaskCategory)
    : TaskCategory.CUSTOM;
}

function resolveLeaderTaskPriority(value: string | null | undefined) {
  return Object.values(TaskPriority).includes(value as TaskPriority)
    ? (value as TaskPriority)
    : TaskPriority.MEDIUM;
}

function resolveLeaderTaskDifficulty(value: string | null | undefined) {
  return Object.values(TaskDifficulty).includes(value as TaskDifficulty)
    ? (value as TaskDifficulty)
    : TaskDifficulty.MEDIUM;
}

function resolveLeaderStudyBlock(value: string | null | undefined) {
  return Object.values(StudyBlock).includes(value as StudyBlock)
    ? (value as StudyBlock)
    : StudyBlock.DEEP_WORK;
}

export async function resolveFlaggedSubmission(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const checkInId = ((formData.get("checkInId") as string) || "").trim();
  const finalVerdict = (formData.get("finalVerdict") as string) || "APPROVE";
  const returnTo = resolveReturnTo(formData, "/leader/disputes");

  if (!checkInId || !groupId) redirect("/leader/disputes?error=Missing+required+fields");

  const session = await requireLeaderActor(groupId);
  const verdict = finalVerdict === "APPROVE" ? CheckInStatus.APPROVED : CheckInStatus.REJECTED;
  const now = new Date();

  let result: { groupId: string; taskId: string | null; status: CheckInStatus };
  try {
    result = await db.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.findUnique({
        where: { id: checkInId },
        select: {
          id: true,
          userId: true,
          groupId: true,
        },
      });

      if (!checkIn) throw new Error("CheckIn missing");
      if (checkIn.groupId !== groupId) throw new Error("Submission does not belong to this group");

      const task = await tx.task.findFirst({
        where: { checkInId },
        select: { id: true, userId: true, groupId: true },
      });

      await tx.checkIn.update({
        where: { id: checkInId },
        data: {
          status: verdict,
          verifiedAt: verdict === CheckInStatus.APPROVED ? now : null,
          reviewedAt: now,
          reviewedById: session.user.id,
          reviewNote:
            verdict === CheckInStatus.APPROVED
              ? "Manually approved by group leader."
              : "Manually rejected by group leader.",
          isDisputed: false,
        },
      });

      if (task) {
        await tx.task.update({
          where: { id: task.id },
          data: {
            status: verdict === CheckInStatus.APPROVED ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
            completedAt: verdict === CheckInStatus.APPROVED ? now : null,
          },
        });

        if (verdict === CheckInStatus.APPROVED) {
          await tx.userGroup.update({
            where: { userId_groupId: { userId: task.userId, groupId: task.groupId } },
            data: { points: { increment: 5 }, completions: { increment: 1 } },
          });
        } else {
          await tx.userGroup.update({
            where: { userId_groupId: { userId: checkIn.userId, groupId } },
            data: { points: { decrement: 10 } },
          });
        }
      }

      if (verdict === CheckInStatus.REJECTED) {
        await tx.penaltyEvent.create({
          data: {
            points: 10,
            reason: "Submission manually rejected by group leader.",
            userId: checkIn.userId,
            groupId,
            checkInId,
          },
        });
      }

      return { groupId, taskId: task?.id ?? null, status: verdict };
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to resolve submission";
    redirect(`/leader/disputes?error=${encodeURIComponent(msg)}`);
  }

  emitGroupEvent(result.groupId, "new-verification", { checkInId, status: result.status });
  if (result.taskId) {
    await syncTaskTracker(result.taskId);
  }
  revalidateLeaderPaths(groupId);
  redirect(returnTo);
}

export async function removeGroupMember(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const memberId = ((formData.get("memberId") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/leader/members");

  if (!groupId || !memberId) redirect("/leader/members?error=Missing+required+fields");

  await requireLeaderActor(groupId);

  try {
    const membership = await db.userGroup.findUnique({
      where: { userId_groupId: { userId: memberId, groupId } },
      select: { role: true },
    });
    if (!membership) redirect("/leader/members?error=Member+not+found");
    if (membership.role === "admin") redirect("/leader/members?error=Cannot+remove+a+leader");

    await db.userGroup.delete({
      where: { userId_groupId: { userId: memberId, groupId } },
    });
    revalidateLeaderPaths(groupId);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to remove member";
    redirect(`/leader/members?error=${encodeURIComponent(msg)}`);
  }

  redirect(returnTo);
}

export async function issueWarning(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const memberId = ((formData.get("memberId") as string) || "").trim();
  const reason = ((formData.get("reason") as string) || "Warning issued by group leader.").trim();
  const returnTo = resolveReturnTo(formData, "/leader/members");

  if (!groupId || !memberId) redirect("/leader/members?error=Missing+required+fields");

  await requireLeaderActor(groupId);

  try {
    await db.penaltyEvent.create({
      data: { points: 0, reason: `\u26A0\uFE0F WARNING: ${reason}`, userId: memberId, groupId },
    });
    await db.userGroup.update({
      where: { userId_groupId: { userId: memberId, groupId } },
      data: { inactivityStrikes: { increment: 1 } },
    });
    revalidateLeaderPaths(groupId);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to issue warning";
    redirect(`/leader/members?error=${encodeURIComponent(msg)}`);
  }

  redirect(returnTo);
}

export async function postDsaGroupTask(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const questionName = ((formData.get("questionName") as string) || "").trim();
  const questionLink = ((formData.get("questionLink") as string) || "").trim();
  const topic = ((formData.get("topic") as string) || "").trim();

  if (!groupId || !questionName || !questionLink || !topic) {
    redirect("/leader/tasks?error=All+fields+are+required");
  }

  const session = await requireLeaderActor(groupId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const broadcastKey = `dsa-daily-${today.toISOString().split("T")[0]}-${groupId}`;

  try {
    await db.task.create({
      data: {
        title: questionName,
        details: `Topic: ${topic}\nLink: ${questionLink}`,
        category: "DSA",
        priority: "HIGH",
        difficulty: "MEDIUM",
        blockType: "DEEP_WORK",
        status: "PENDING",
        day: today,
        dueAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
        scope: "GROUP",
        userId: session.user.id,
        groupId,
        broadcastKey,
      },
    });

    revalidatePath("/leader/tasks");
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to post DSA task";
    redirect(`/leader/tasks?error=${encodeURIComponent(msg)}`);
  }

  redirect("/leader/tasks?success=DSA+question+posted");
}

export async function assignTaskToMember(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const memberId = ((formData.get("memberId") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const details = ((formData.get("details") as string) || "").trim();
  const dueAtRaw = ((formData.get("dueAt") as string) || "").trim();
  const category = resolveLeaderTaskCategory(formData.get("category") as string);
  const priority = resolveLeaderTaskPriority(formData.get("priority") as string);
  const difficulty = resolveLeaderTaskDifficulty(formData.get("difficulty") as string);
  const blockType = resolveLeaderStudyBlock(formData.get("blockType") as string);

  if (!groupId || !memberId || !title) {
    redirect("/leader/tasks?error=Group,+member,+and+title+are+required");
  }

  await requireLeaderActor(groupId);
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

  if (dueAt && Number.isNaN(dueAt.getTime())) {
    redirect("/leader/tasks?error=Enter+a+valid+due+date");
  }

  const targetMember = await db.userGroup.findUnique({
    where: {
      userId_groupId: { userId: memberId, groupId },
    },
    select: {
      userId: true,
      user: { select: { name: true } },
    },
  });

  if (!targetMember) {
    redirect("/leader/tasks?error=Selected+member+is+not+part+of+this+group");
  }

  try {
    const task = await db.task.create({
      data: {
        title,
        details: details || null,
        category,
        priority,
        difficulty,
        blockType,
        status: "PENDING",
        day: dueAt ?? new Date(),
        dueAt,
        scope: "GROUP",
        userId: targetMember.userId,
        groupId,
        broadcastKey: crypto.randomUUID(),
      },
      select: { id: true },
    });

    await syncTaskTracker(task.id);
    emitGroupEvent(groupId, "new-task", { title });

    revalidateLeaderPaths(groupId);
    revalidatePath("/tasks");
    revalidatePath("/proof-work");
    revalidatePath("/tracker");
    revalidatePath("/uploads");
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to assign task";
    redirect(`/leader/tasks?error=${encodeURIComponent(msg)}`);
  }

  const success = encodeURIComponent(`Task assigned to ${targetMember.user.name}`);
  redirect(`/leader/tasks?success=${success}`);
}
