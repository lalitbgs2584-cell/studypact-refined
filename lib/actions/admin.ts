"use server";

import { CheckInStatus, GroupRole, TaskStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";

async function requireAdminActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  });

  if (actor?.role !== "admin") {
    throw new Error("Only admins can perform this action");
  }

  return session;
}

async function requireLeaderOrAdminActor(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const [actor, membership] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
    db.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
      select: { role: true },
    }),
  ]);

  if (actor?.role !== "admin" && membership?.role !== GroupRole.admin) {
    throw new Error("Only a global admin or current group leader can perform this action");
  }

  return session;
}

function resolveReturnTo(formData: FormData, fallback: string) {
  return ((formData.get("returnTo") as string) || "").trim() || fallback;
}

function revalidateModerationPaths(groupId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/proofs");
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/reports");
  revalidatePath("/leader");
  revalidatePath("/leader/members");
  revalidatePath("/leader/proofs");
  revalidatePath("/leader/disputes");
  revalidatePath("/leader/tasks");
  revalidatePath("/leader/alerts");
  revalidatePath("/groups");
  revalidatePath("/dashboard");
  revalidatePath("/uploads");
  revalidatePath("/assignments");

  if (groupId) {
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/settings`);
  }
}

export async function setUserPlatformRole(formData: FormData) {
  const session = await requireAdminActor();
  const userId = ((formData.get("userId") as string) || "").trim();
  const role = ((formData.get("role") as string) || "member").trim() === "admin" ? "admin" : "member";
  const returnTo = resolveReturnTo(formData, "/admin/users");

  if (!userId) {
    throw new Error("Missing user");
  }

  if (session.user.id === userId && role !== "admin") {
    throw new Error("You cannot remove your own admin access");
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidateModerationPaths();
  redirect(returnTo);
}

export async function setUserBlockStatus(formData: FormData) {
  await requireAdminActor();

  const userId = ((formData.get("userId") as string) || "").trim();
  const blocked = ((formData.get("blocked") as string) || "false").trim() === "true";
  const returnTo = resolveReturnTo(formData, "/admin/users");

  if (!userId) {
    throw new Error("Missing user");
  }

  await db.user.update({
    where: { id: userId },
    data: { isBlocked: blocked },
  });

  revalidateModerationPaths();
  redirect(returnTo);
}

export async function resetUserStats(formData: FormData) {
  await requireAdminActor();

  const userId = ((formData.get("userId") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/users");

  if (!userId) {
    throw new Error("Missing user");
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        penaltyCount: 0,
      },
    }),
    db.userGroup.updateMany({
      where: { userId },
      data: {
        points: 0,
        streak: 0,
        bestStreak: 0,
        completions: 0,
        misses: 0,
        reputationScore: 60,
        inactivityStrikes: 0,
        lastCheckInAt: null,
        earlyBirdCount: 0,
      },
    }),
  ]);

  revalidateModerationPaths();
  redirect(returnTo);
}

export async function deleteGroupAsAdmin(formData: FormData) {
  await requireAdminActor();

  const groupId = ((formData.get("groupId") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/groups");

  if (!groupId) {
    throw new Error("Missing group");
  }

  await db.group.delete({
    where: { id: groupId },
  });

  revalidateModerationPaths(groupId);
  redirect(returnTo);
}

export async function forceRemoveGroupMember(formData: FormData) {
  await requireAdminActor();

  const groupId = ((formData.get("groupId") as string) || "").trim();
  const memberId = ((formData.get("memberId") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/groups");

  if (!groupId || !memberId) {
    throw new Error("Missing required fields");
  }

  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new Error("Member not found");
  }

  if (membership.role === GroupRole.admin) {
    throw new Error("Transfer leadership before removing the current leader");
  }

  await db.userGroup.delete({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
  });

  revalidateModerationPaths(groupId);
  redirect(returnTo);
}

export async function reassignGroupLeader(formData: FormData) {
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const newLeaderId = ((formData.get("newLeaderId") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, groupId ? `/groups/${groupId}/settings` : "/leader/members");

  if (!groupId || !newLeaderId) {
    throw new Error("Missing required fields");
  }

  await requireLeaderOrAdminActor(groupId);

  await db.$transaction(async (tx) => {
    const targetMembership = await tx.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: newLeaderId,
          groupId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!targetMembership) {
      throw new Error("New leader must already be a member of the group");
    }

    await tx.userGroup.updateMany({
      where: {
        groupId,
        role: GroupRole.admin,
      },
      data: {
        role: GroupRole.member,
      },
    });

    await tx.userGroup.update({
      where: {
        userId_groupId: {
          userId: newLeaderId,
          groupId,
        },
      },
      data: {
        role: GroupRole.admin,
      },
    });

    await tx.group.update({
      where: { id: groupId },
      data: {
        createdById: newLeaderId,
      },
    });
  });

  revalidateModerationPaths(groupId);
  redirect(returnTo);
}

export async function resolveSubmissionAsAdmin(formData: FormData) {
  const session = await requireAdminActor();
  const checkInId = ((formData.get("checkInId") as string) || "").trim();
  const finalVerdict = ((formData.get("finalVerdict") as string) || "APPROVE").trim().toUpperCase();
  const note = ((formData.get("note") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/proofs");

  if (!checkInId) {
    throw new Error("Missing submission");
  }

  const status =
    finalVerdict === "APPROVE"
      ? CheckInStatus.APPROVED
      : CheckInStatus.REJECTED;

  const defaultNote =
    finalVerdict === "SPAM"
      ? "Marked as spam by admin."
      : status === CheckInStatus.APPROVED
        ? "Approved by admin moderation."
        : "Rejected by admin moderation.";

  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const checkIn = await tx.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        tasks: {
          select: {
            id: true,
            userId: true,
            groupId: true,
          },
        },
      },
    });

    if (!checkIn) {
      throw new Error("Submission not found");
    }

    if (checkIn.status === CheckInStatus.APPROVED || checkIn.status === CheckInStatus.REJECTED) {
      throw new Error("Only pending or disputed submissions can be finalized from the admin queue");
    }

    await tx.checkIn.update({
      where: { id: checkInId },
      data: {
        status,
        reviewedAt: now,
        reviewedById: session.user.id,
        verifiedAt: status === CheckInStatus.APPROVED ? now : null,
        reviewNote: note || defaultNote,
      },
    });

    const task = checkIn.tasks[0];

    if (task) {
      await tx.task.update({
        where: { id: task.id },
        data: {
          status: status === CheckInStatus.APPROVED ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
          completedAt: status === CheckInStatus.APPROVED ? now : null,
        },
      });

      if (status === CheckInStatus.APPROVED) {
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
              userId: task.userId,
              groupId: task.groupId,
            },
          },
          data: {
            points: { decrement: 10 },
            misses: { increment: 1 },
          },
        });

        await tx.penaltyEvent.create({
          data: {
            points: 10,
            reason: finalVerdict === "SPAM" ? "Submission marked as spam by admin." : "Submission rejected by admin.",
            userId: task.userId,
            groupId: task.groupId,
            checkInId,
          },
        });
      }
    }

    return {
      groupId: checkIn.groupId,
      status,
    };
  });

  emitGroupEvent(result.groupId, "new-verification", { checkInId, status: result.status });
  revalidateModerationPaths(result.groupId);
  redirect(returnTo);
}

export async function actionReport(formData: FormData) {
  const session = await requireAdminActor();

  const reportId = ((formData.get("reportId") as string) || "").trim();
  const action = ((formData.get("action") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/reports");

  if (!reportId || !action) {
    throw new Error("Missing required fields");
  }

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, targetType: true, targetId: true, status: true },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  if (report.status !== "PENDING") {
    throw new Error("Report already resolved");
  }

  if (action === "ban" && report.targetType === "USER") {
    await db.user.update({
      where: { id: report.targetId },
      data: { isBlocked: true },
    });
  }

  await db.report.update({
    where: { id: reportId },
    data: {
      status: action === "dismiss" ? "DISMISSED" : "RESOLVED",
      resolvedById: session.user.id,
    },
  });

  revalidateModerationPaths();
  redirect(returnTo);
}

export async function updateSystemSettings(formData: FormData) {
  await requireAdminActor();

  const key = ((formData.get("key") as string) || "").trim();
  const value = ((formData.get("value") as string) || "").trim();
  const returnTo = resolveReturnTo(formData, "/admin/settings");

  if (!key) {
    throw new Error("Missing setting key");
  }

  await db.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
    },
    update: {
      value,
    },
  });

  revalidateModerationPaths();
  redirect(returnTo);
}
