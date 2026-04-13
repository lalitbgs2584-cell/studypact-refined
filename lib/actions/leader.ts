"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function resolveFlaggedSubmission(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const checkInId = formData.get("checkInId") as string;
  const groupId = formData.get("groupId") as string;
  const finalVerdict = formData.get("finalVerdict") as "APPROVE" | "REJECT";

  // Validate Leadership
  const leaderCheck = await db.userGroup.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } }
  });

  if (leaderCheck?.role !== "admin") {
    throw new Error("Only the group leader can resolve flagged submissions.");
  }

  const checkIn = await db.checkIn.findUnique({ where: { id: checkInId } });
  if (!checkIn) throw new Error("CheckIn missing");

  if (finalVerdict === "APPROVE") {
    await db.checkIn.update({
      where: { id: checkInId },
      data: { status: "APPROVED", verifiedAt: new Date() }
    });

    await db.userGroup.update({
      where: { userId_groupId: { userId: checkIn.userId, groupId } },
      data: { points: { increment: 5 }, completions: { increment: 1 } }
    });
  } else {
    await db.checkIn.update({
      where: { id: checkInId },
      data: { status: "REJECTED", verifiedAt: new Date() }
    });

    await db.userGroup.update({
      where: { userId_groupId: { userId: checkIn.userId, groupId } },
      data: { points: { decrement: 10 } }
    });

    await db.penaltyEvent.create({
      data: {
        points: 10,
        reason: "Submission manually rejected by group leader.",
        userId: checkIn.userId,
        groupId,
        checkInId
      }
    });
  }

  if (pusherServer) {
    pusherServer.trigger(`group-${groupId}`, "new-verification", {}).catch(console.error);
  }

  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
}
