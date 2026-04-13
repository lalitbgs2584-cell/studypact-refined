"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function createTask(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const details = formData.get("details") as string;
  const groupId = formData.get("groupId") as string;
  const category = formData.get("category") as any || "CUSTOM";
  
  // Basic validation
  if (!title || !groupId) throw new Error("Missing required fields");

  // Verify membership
  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId
      }
    }
  });

  if (!membership) throw new Error("Not a member of this group");

  await db.task.create({
    data: {
      title,
      details,
      category,
      day: new Date(),
      status: "PENDING",
      userId: session.user.id,
      groupId
    }
  });

  if (pusherServer) {
    pusherServer.trigger(`group-${groupId}`, "new-task", {
      title
    }).catch(console.error);
  }

  revalidatePath(`/groups/${groupId}`);
}
