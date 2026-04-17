"use server";

import { CheckInStatus, TaskStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";
import { syncTaskTracker } from "@/lib/tracker";

export async function submitProof(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const taskId = ((formData.get("taskId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const reflection = ((formData.get("reflection") as string) || "").trim();

  const startFiles: { url: string; name: string }[] = [];
  const endFiles: { url: string; name: string }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("startFileUrl")) startFiles.push({ url: value as string, name: "Before / Start" });
    if (key.startsWith("endFileUrl")) endFiles.push({ url: value as string, name: "After / End" });
  });

  if (!reflection) redirect("/proof-work?error=Summary+is+required");
  if (startFiles.length === 0 || endFiles.length === 0) redirect("/proof-work?error=Upload+both+proof+images");

  try {
    const task = taskId
      ? await db.task.findUnique({ where: { id: taskId }, include: { checkIn: true } })
      : null;

    if (taskId) {
      if (!task || task.userId !== session.user.id) redirect("/proof-work?error=Task+not+found");
      if (task.checkIn && task.checkIn.status !== CheckInStatus.REJECTED) {
        redirect("/proof-work?error=Task+already+has+an+active+submission");
      }
    }

    const proofGroupId = groupId || task?.groupId || "";
    if (!proofGroupId) redirect("/proof-work?error=Group+context+required");

    const checkIn = await db.checkIn.create({
      data: {
        day: new Date(),
        reflection,
        proofText: reflection,
        status: CheckInStatus.PENDING,
        userId: session.user.id,
        groupId: proofGroupId,
        startFiles: {
          create: startFiles.map((f) => ({ name: f.name, url: f.url, userId: session.user.id, groupId: proofGroupId })),
        },
        endFiles: {
          create: endFiles.map((f) => ({ name: f.name, url: f.url, userId: session.user.id, groupId: proofGroupId })),
        },
      },
    });

    if (taskId) {
      await db.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS, checkInId: checkIn.id },
      });

      await syncTaskTracker(taskId);
    }

    emitGroupEvent(proofGroupId, "new-submission", {});

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    revalidatePath("/proof-work");
    revalidatePath("/tracker");
    revalidatePath("/uploads");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit proof";
    redirect(`/proof-work?error=${encodeURIComponent(msg)}`);
  }

  redirect("/proof-work");
}
