"use server";

import { CheckInStatus, TaskStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

export async function resolveFlaggedSubmission(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const checkInId = ((formData.get("checkInId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const finalVerdict = (formData.get("finalVerdict") as string) || "APPROVE";

  if (!checkInId || !groupId) throw new Error("Missing required fields");

  const verdict = finalVerdict === "APPROVE" ? CheckInStatus.APPROVED : CheckInStatus.REJECTED;
  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const leaderCheck = await tx.userGroup.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId } },
      select: { role: true },
    });

    if (leaderCheck?.role !== "admin") {
      throw new Error("Only the group leader can resolve flagged submissions.");
    }

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
      select: {
        id: true,
        userId: true,
        groupId: true,
      },
    });

    await tx.checkIn.update({
      where: { id: checkInId },
      data: {
        status: verdict,
        verifiedAt: verdict === CheckInStatus.APPROVED ? now : null,
        reviewedAt: now,
        reviewedById: session.user.id,
        reviewNote: verdict === CheckInStatus.APPROVED ? "Manually approved by the group leader." : "Manually rejected by the group leader.",
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
          where: {
            userId_groupId: {
              userId: task.userId,
              groupId: task.groupId,
            },
          },
          data: {
            points: { increment: 5 },
            completions: { increment: 1 },
          },
        });
      } else {
        await tx.userGroup.update({
          where: {
            userId_groupId: {
              userId: checkIn.userId,
              groupId,
            },
          },
          data: {
            points: { decrement: 10 },
          },
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

    return {
      groupId,
      taskId: task?.id ?? null,
      status: verdict,
    };
  });

  if (pusherServer) {
    pusherServer.trigger(`group-${result.groupId}`, "new-verification", { checkInId, status: result.status }).catch(console.error);
  }

  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
  if (result.taskId) {
    revalidatePath(`/groups/${groupId}/task/${result.taskId}`);
  }

  redirect(`/groups/${groupId}`);
}
