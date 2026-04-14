"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createAssignment(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const groupId = ((formData.get("groupId") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const details = ((formData.get("details") as string) || "").trim();
  const dueAtRaw = ((formData.get("dueAt") as string) || "").trim();
  const questions = formData
    .getAll("questions")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!groupId || !title || questions.length === 0) {
    throw new Error("Missing required fields");
  }

  const membership = await db.userGroup.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  });

  if (!membership || membership.role !== "admin") {
    throw new Error("Only the group leader can create assignments");
  }

  const assignment = await db.assignment.create({
    data: {
      groupId,
      createdById: session.user.id,
      title,
      details: details || null,
      dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
      questions: {
        create: questions.map((prompt, index) => ({
          prompt,
          order: index + 1,
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  revalidatePath("/assignments");

  redirect(`/assignments?created=${assignment.id}`);
}
