"use server";

import crypto from "crypto";
import { GroupFocusType } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACTIVE_GROUP_COOKIE } from "@/lib/workspace";

export async function setActiveGroup(groupIdInput: string | FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const groupId = typeof groupIdInput === "string" ? groupIdInput : String(groupIdInput.get("groupId") || "");
  if (!groupId) throw new Error("Missing groupId");

  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
    select: { groupId: true },
  });

  if (!membership) throw new Error("Not a member of that group");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, { path: "/", sameSite: "lax" });
  revalidatePath("/dashboard");
  revalidatePath("/groups");
}

export async function createGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const focusTypeInput = (formData.get("focusType") as string) || "";
  const focusType = Object.values(GroupFocusType).includes(focusTypeInput as GroupFocusType)
    ? (focusTypeInput as GroupFocusType)
    : GroupFocusType.GENERAL;

  if (!name) {
    redirect("/groups?error=Group%20name%20is%20required");
  }

  const inviteCode = crypto.randomBytes(4).toString("hex");

  const group = await db.group.create({
    data: {
      name,
      description,
      focusType,
      inviteCode,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: session.user.id,
      users: {
        create: {
          userId: session.user.id,
          role: "admin",
        },
      },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, group.id, { path: "/", sameSite: "lax" });
  revalidatePath("/groups");
  redirect("/groups");
}

export async function joinGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const inviteCode = ((formData.get("inviteCode") as string) || "").trim().toLowerCase();

  if (!inviteCode) {
    redirect("/groups?error=Invite%20code%20is%20required");
  }

  const group = await db.group.findUnique({
    where: { inviteCode },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!group) {
    redirect("/groups?error=Invalid%20invite%20code");
  }

  if (group.inviteExpiresAt < new Date()) {
    redirect("/groups?error=This%20invite%20code%20has%20expired");
  }

  const existingMembership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: group.id,
      },
    },
  });

  if (existingMembership) {
    redirect(`/groups/${group.id}`);
  }

  if (group._count.users >= group.maxMembers) {
    redirect("/groups?error=This%20group%20is%20already%20full");
  }

  await db.userGroup.create({
    data: {
      userId: session.user.id,
      groupId: group.id,
      role: "member",
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, group.id, { path: "/", sameSite: "lax" });
  revalidatePath("/groups");
  redirect("/groups");
}

export async function removeGroupMember(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const groupId = (formData.get("groupId") as string) || "";
  const memberId = (formData.get("memberId") as string) || "";

  if (!groupId || !memberId) {
    throw new Error("Missing required fields");
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: true,
    },
  });

  if (!group) throw new Error("Group not found");

  const leader = group.users.find((userGroup) => userGroup.role === "admin" && userGroup.userId === session.user.id);
  if (!leader) throw new Error("Only the leader can remove members");

  if (memberId === session.user.id) throw new Error("Leader cannot remove themselves");

  await db.userGroup.delete({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/proof-work");
  revalidatePath("/uploads");
  revalidatePath("/assignments");
  revalidatePath("/groups");
  redirect("/groups");
}
