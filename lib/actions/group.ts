"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const focusType = formData.get("focusType") as any; // e.g., 'DEVELOPMENT'

  if (!name) throw new Error("Name is required");

  // Create unique invite code
  const inviteCode = crypto.randomBytes(4).toString("hex");

  const group = await db.group.create({
    data: {
      name,
      description,
      focusType: focusType || "GENERAL",
      inviteCode,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdById: session.user.id,
      users: {
        create: {
          userId: session.user.id,
          role: "admin", // Creator is automatically Leader/Admin
        }
      }
    }
  });

  redirect(`/groups/${group.id}`);
}
