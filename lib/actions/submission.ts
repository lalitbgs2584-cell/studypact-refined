"use server";

import { CheckInStatus, TaskStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "../socket-server";


export async function submitProof(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const taskId = ((formData.get("taskId") as string) || "").trim();
  const assignmentQuestionId = ((formData.get("assignmentQuestionId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const reflection = ((formData.get("reflection") as string) || "").trim();

  const startFiles: { url: string; name: string }[] = [];
  const endFiles: { url: string; name: string }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("startFileUrl")) {
      startFiles.push({ url: value as string, name: "Before / Start" });
    }
    if (key.startsWith("endFileUrl")) {
      endFiles.push({ url: value as string, name: "After / End" });
    }
  });

  if (!reflection) {
    throw new Error("Summary is required");
  }

  if (startFiles.length === 0 || endFiles.length === 0) {
    throw new Error("Upload both start and end proof images");
  }

  const task = taskId
    ? await db.task.findUnique({
        where: { id: taskId },
        include: { checkIn: true },
      })
    : null;

  const assignmentQuestion = assignmentQuestionId
    ? await db.assignmentQuestion.findUnique({
        where: { id: assignmentQuestionId },
        include: { assignment: true },
      })
    : null;

  const latestAssignmentSubmission = assignmentQuestionId
    ? await db.checkIn.findFirst({
        where: {
          assignmentQuestionId,
          userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
        },
      })
    : null;

  if (taskId) {
    if (!task || task.userId !== session.user.id) throw new Error("Task not found or you are not the owner");
    if (task.checkIn && task.checkIn.status !== CheckInStatus.REJECTED) {
      throw new Error("Task already has an active submission");
    }
  }

  if (assignmentQuestionId && !assignmentQuestion) {
    throw new Error("Assignment question not found");
  }

  if (assignmentQuestionId && latestAssignmentSubmission && latestAssignmentSubmission.status !== CheckInStatus.REJECTED) {
    throw new Error("Assignment question already has an active submission");
  }

  const proofGroupId = groupId || task?.groupId || assignmentQuestion?.assignment.groupId || "";
  if (!proofGroupId) throw new Error("Group context is required");

  const checkIn = await db.checkIn.create({
    data: {
      day: new Date(),
      reflection,
      proofText: reflection,
      status: CheckInStatus.PENDING,
      userId: session.user.id,
      groupId: proofGroupId,
      assignmentQuestionId: assignmentQuestionId || null,
      startFiles: {
        create: startFiles.map((file) => ({
          name: file.name,
          url: file.url,
          userId: session.user.id,
          groupId: proofGroupId,
        })),
      },
      endFiles: {
        create: endFiles.map((file) => ({
          name: file.name,
          url: file.url,
          userId: session.user.id,
          groupId: proofGroupId,
        })),
      },
    },
  });

  if (taskId) {
    await db.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_PROGRESS,
        checkInId: checkIn.id,
      },
    });
  }

  emitGroupEvent(proofGroupId, "new-submission", {});

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  if (taskId) revalidatePath(`/groups/${proofGroupId}/task/${taskId}`);
  if (assignmentQuestionId) revalidatePath("/assignments");
  redirect("/tasks");
}