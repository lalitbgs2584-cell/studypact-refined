"use server";

import { CheckInStatus, TaskStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";

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
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath("/dashboard");
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
      data: { points: 0, reason: `⚠️ WARNING: ${reason}`, userId: memberId, groupId },
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