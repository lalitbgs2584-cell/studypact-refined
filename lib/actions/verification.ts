"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckInStatus, TaskStatus } from "@prisma/client";

export async function submitVerification(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const taskId = ((formData.get("taskId") as string) || "").trim();
  const groupId = (formData.get("groupId") as string) || "";
  const checkInId = (formData.get("checkInId") as string) || "";
  const verdict = ((formData.get("verdict") as string) || "APPROVE").toUpperCase();
  const note = ((formData.get("note") as string) || "").trim();

  if (!checkInId || !groupId) throw new Error("Missing required fields");

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: true,
    },
  });

  if (!group) throw new Error("Group not found");

  const membership = group.users.find((userGroup) => userGroup.userId === session.user.id);
  if (!membership || membership.role !== "admin") {
    throw new Error("Only the group leader can review uploads");
  }

  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    include: {
      assignmentQuestion: true,
    },
  });

  if (!checkIn) throw new Error("Check-in not found");
  if (checkIn.userId === session.user.id) throw new Error("Cannot review your own submission");

  const nextStatus = verdict === "REJECT" || verdict === "FLAG" ? CheckInStatus.REJECTED : CheckInStatus.APPROVED;

  await db.checkIn.update({
    where: { id: checkInId },
    data: {
      status: nextStatus,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      reviewNote: note || null,
      verifiedAt: nextStatus === CheckInStatus.APPROVED ? new Date() : null,
    },
  });

  await db.submissionVerification.create({
    data: {
      checkInId,
      reviewerId: session.user.id,
      verdict: nextStatus === CheckInStatus.APPROVED ? "APPROVE" : "FLAG",
      note: note || null,
    },
  });

  const task = await db.task.findFirst({
    where: { checkInId },
  });

  if (task) {
    await db.task.update({
      where: { id: task.id },
      data: {
        status: nextStatus === CheckInStatus.APPROVED ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
        completedAt: nextStatus === CheckInStatus.APPROVED ? new Date() : null,
      },
    });

    if (nextStatus === CheckInStatus.APPROVED) {
      await db.userGroup.update({
        where: {
          userId_groupId: {
            userId: task.userId,
            groupId: task.groupId,
          },
        },
        data: {
          completions: { increment: 1 },
          points: { increment: 5 },
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  const redirectTo = task ? `/groups/${groupId}/task/${task.id}` : "/uploads";

  if (taskId) {
    revalidatePath(`/groups/${groupId}/task/${taskId}`);
  }

  redirect(redirectTo);
}
