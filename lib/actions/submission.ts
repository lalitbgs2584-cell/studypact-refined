"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function submitProof(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const taskId = formData.get("taskId") as string;
  const groupId = formData.get("groupId") as string;
  const reflection = formData.get("reflection") as string;
  
  // Collect all uploaded file URLs based on hidden inputs "fileUrl_0", "fileUrl_1", etc.
  const files: { url: string; name: string }[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith("fileUrl_")) {
      files.push({ url: value as string, name: "Proof File" });
    }
  });

  if (files.length === 0) {
    throw new Error("Must provide at least one proof file");
  }

  const task = await db.task.findUnique({
    where: { id: taskId, userId: session.user.id }
  });

  if (!task) throw new Error("Task not found or you are not the owner");
  if (task.status !== "PENDING" || task.checkInId) throw new Error("Task already submitted");

  // Create CheckIn
  const checkIn = await db.checkIn.create({
    data: {
      day: new Date(),
      reflection,
      status: "PENDING",
      userId: session.user.id,
      groupId,
      startFiles: {
        create: files.map(f => ({
          name: f.name,
          url: f.url,
          userId: session.user.id,
          groupId
        }))
      }
    }
  });

  // Link to task
  await db.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      checkInId: checkIn.id,
    }
  });

  if (pusherServer) {
    pusherServer.trigger(`group-${groupId}`, "new-submission", {}).catch(console.error);
  }

  revalidatePath(`/groups/${groupId}/task/${taskId}`);
  redirect(`/groups/${groupId}/task/${taskId}`);
}
