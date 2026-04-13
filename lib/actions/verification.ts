"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function submitVerification(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const taskId = formData.get("taskId") as string;
  const groupId = formData.get("groupId") as string;
  const checkInId = formData.get("checkInId") as string;
  const verdict = formData.get("verdict") as "APPROVE" | "FLAG";
  const note = formData.get("note") as string;
  
  if (!checkInId || !verdict) throw new Error("Missing required fields");

  // Prevent self-verification (already hidden in UI, but good to check)
  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    include: { verifications: true }
  });

  if (!checkIn) throw new Error("Check-in not found");
  if (checkIn.userId === session.user.id) throw new Error("Cannot verify your own submission");
  if (checkIn.verifications.some(v => v.reviewerId === session.user.id)) throw new Error("Already verified");

  await db.submissionVerification.create({
    data: {
      checkInId,
      reviewerId: session.user.id,
      verdict,
      note
    }
  });

  // Simplified decision logic: if 3 votes achieved, determine status
  const allVerifications = await db.submissionVerification.findMany({
    where: { checkInId }
  });

  if (allVerifications.length >= 3) {
    const flags = allVerifications.filter(v => v.verdict === "FLAG").length;
    const approves = allVerifications.filter(v => v.verdict === "APPROVE").length;

    let finalStatus: "APPROVED" | "REJECTED" | "FLAGGED" = "APPROVED";
    
    if (flags > approves) {
      finalStatus = "REJECTED";
      
      // Auto Penalize
      await db.penaltyEvent.create({
        data: {
          points: 10,
          reason: "Submission rejected by peers",
          userId: checkIn.userId,
          groupId: checkIn.groupId,
          checkInId: checkIn.id
        }
      });
      // Deduct points or increase penalty count
      await db.userGroup.update({
        where: { userId_groupId: { userId: checkIn.userId, groupId: checkIn.groupId } },
        data: { points: { decrement: 10 } }
      });
    } else if (flags > 0) {
      finalStatus = "FLAGGED"; // Needs leader review
    } else {
      finalStatus = "APPROVED";
      // Award points
      await db.userGroup.update({
        where: { userId_groupId: { userId: checkIn.userId, groupId: checkIn.groupId } },
        data: { points: { increment: 5 }, completions: { increment: 1 } }
      });
    }

    await db.checkIn.update({
      where: { id: checkInId },
      data: { status: finalStatus, verifiedAt: new Date() }
    });
  }

  if (pusherServer) {
    pusherServer.trigger(`group-${groupId}`, "new-verification", {}).catch(console.error);
  }

  revalidatePath(`/groups/${groupId}/task/${taskId}`);
  redirect(`/groups/${groupId}/task/${taskId}`);
}
