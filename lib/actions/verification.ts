"use server";

import { CheckInStatus, TaskStatus, VerificationVerdict } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPeerReviewMetrics } from "@/lib/peer-review";
import { emitGroupEvent } from "@/lib/pusher";

const FINAL_STATUSES = new Set<CheckInStatus>([CheckInStatus.APPROVED, CheckInStatus.REJECTED]);

export async function submitVerification(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const taskId = ((formData.get("taskId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const checkInId = ((formData.get("checkInId") as string) || "").trim();
  const rawVerdict = ((formData.get("verdict") as string) || "APPROVE").trim().toUpperCase();
  const note = ((formData.get("note") as string) || "").trim();

  if (!checkInId || !groupId) throw new Error("Missing required fields");

  const verdict =
    rawVerdict === "APPROVE"
      ? VerificationVerdict.APPROVE
      : rawVerdict === "FLAG" || rawVerdict === "REJECT"
        ? VerificationVerdict.FLAG
        : null;

  if (!verdict) throw new Error("Invalid verdict");

  const outcome = await db.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        users: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) throw new Error("Group not found");

    if (!group.users.some((userGroup) => userGroup.userId === session.user.id)) {
      throw new Error("Only group members can review submissions");
    }

    const checkIn = await tx.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        verifications: {
          select: {
            verdict: true,
          },
        },
      },
    });

    if (!checkIn) throw new Error("Check-in not found");
    if (checkIn.groupId !== groupId) throw new Error("Submission does not belong to this group");
    if (checkIn.userId === session.user.id) throw new Error("Cannot review your own submission");
    if (FINAL_STATUSES.has(checkIn.status)) throw new Error("This submission has already been finalized");

    await tx.submissionVerification.upsert({
      where: {
        checkInId_reviewerId: {
          checkInId,
          reviewerId: session.user.id,
        },
      },
      create: {
        checkInId,
        reviewerId: session.user.id,
        verdict,
        note: note || null,
      },
      update: {
        verdict,
        note: note || null,
      },
    });

    const refreshedCheckIn = await tx.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        verifications: {
          select: {
            verdict: true,
          },
        },
      },
    });

    if (!refreshedCheckIn) throw new Error("Check-in not found");

    const totalEligibleReviewers = Math.max(group.users.length - 1, 0);
    const metrics = getPeerReviewMetrics(refreshedCheckIn.verifications, totalEligibleReviewers);
    const now = new Date();
    const linkedTask = await tx.task.findFirst({
      where: { checkInId },
      select: {
        id: true,
        userId: true,
        groupId: true,
      },
    });

    if (metrics.approved || metrics.rejected) {
      const finalStatus = metrics.approved ? CheckInStatus.APPROVED : CheckInStatus.REJECTED;
      const reviewNote = metrics.approved
        ? `Approved by quorum (${metrics.approvalVotes}/${metrics.totalEligibleReviewers} approvals).`
        : `Rejected by quorum (${metrics.flagVotes}/${metrics.totalEligibleReviewers} flags).`;

      const updated = await tx.checkIn.updateMany({
        where: {
          id: checkInId,
          status: {
            in: [CheckInStatus.PENDING, CheckInStatus.FLAGGED],
          },
        },
        data: {
          status: finalStatus,
          reviewedAt: now,
          reviewedById: session.user.id,
          reviewNote,
          verifiedAt: finalStatus === CheckInStatus.APPROVED ? now : null,
        },
      });

      if (updated.count > 0 && linkedTask) {
        await tx.task.updateMany({
          where: {
            id: linkedTask.id,
            checkInId,
          },
          data: {
            status: finalStatus === CheckInStatus.APPROVED ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
            completedAt: finalStatus === CheckInStatus.APPROVED ? now : null,
          },
        });

        if (finalStatus === CheckInStatus.APPROVED) {
          await tx.userGroup.update({
            where: {
              userId_groupId: {
                userId: linkedTask.userId,
                groupId: linkedTask.groupId,
              },
            },
            data: {
              completions: { increment: 1 },
              points: { increment: 5 },
            },
          });
        }
      }

      return {
        groupId,
        taskId: linkedTask?.id ?? taskId,
        status: finalStatus,
      };
    }

    const interimStatus = metrics.flagVotes > 0 ? CheckInStatus.FLAGGED : CheckInStatus.PENDING;

    await tx.checkIn.updateMany({
      where: {
        id: checkInId,
        status: {
          in: [CheckInStatus.PENDING, CheckInStatus.FLAGGED],
        },
      },
      data: {
        status: interimStatus,
        reviewedAt: null,
        reviewedById: null,
        reviewNote: null,
        verifiedAt: null,
      },
    });

    return {
      groupId,
      taskId: linkedTask?.id ?? taskId,
      status: interimStatus,
    };
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");

  if (outcome.taskId) {
    revalidatePath(`/groups/${outcome.groupId}/task/${outcome.taskId}`);
  }

  emitGroupEvent(outcome.groupId, "new-verification", { checkInId, status: outcome.status });

  redirect(outcome.taskId ? `/groups/${outcome.groupId}/task/${outcome.taskId}` : "/uploads");
}