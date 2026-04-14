"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { TaskStatus } from "@prisma/client";

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
    if (key.startsWith("startFileUrl_")) {
      startFiles.push({ url: value as string, name: "Before / Start" });
    }
    if (key.startsWith("endFileUrl_")) {
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

  if (taskId) {
    if (!task || task.userId !== session.user.id) throw new Error("Task not found or you are not the owner");
    if (task.checkIn?.status === "APPROVED") throw new Error("Task already approved");
  }

  if (assignmentQuestionId && !assignmentQuestion) {
    throw new Error("Assignment question not found");
  }

  const proofGroupId = groupId || task?.groupId || assignmentQuestion?.assignment.groupId || "";
  if (!proofGroupId) throw new Error("Group context is required");

  const nextStatus = "PENDING";

  const checkIn = await db.checkIn.create({
    data: {
      day: new Date(),
      reflection,
      proofText: reflection,
      status: nextStatus,
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
    }
  });

  if (taskId) {
    await db.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_PROGRESS,
        checkInId: checkIn.id,
      }
    });
  }

  if (pusherServer) {
    pusherServer.trigger(`group-${proofGroupId}`, "new-submission", {}).catch(console.error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  if (taskId) revalidatePath(`/groups/${proofGroupId}/task/${taskId}`);
  if (assignmentQuestionId) revalidatePath("/assignments");
  redirect(`/tasks`);
}
