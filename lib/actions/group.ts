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
  if (!session) redirect("/login");

  const groupId = typeof groupIdInput === "string"
    ? groupIdInput
    : String(groupIdInput.get("groupId") || "");
  if (!groupId) return;

  try {
    const membership = await db.userGroup.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId } },
      select: { groupId: true },
    });
    if (!membership) return;

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, { path: "/", sameSite: "lax" });
    revalidatePath("/dashboard");
    revalidatePath("/groups");
  } catch {
    // ignore
  }
}

export async function createGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const focusTypeInput = (formData.get("focusType") as string) || "";
  const focusType = Object.values(GroupFocusType).includes(focusTypeInput as GroupFocusType)
    ? (focusTypeInput as GroupFocusType)
    : GroupFocusType.GENERAL;

  if (!name) redirect("/groups?error=Group+name+is+required");

  let groupId: string;
  try {
    const inviteCode = crypto.randomBytes(4).toString("hex");
    const group = await db.group.create({
      data: {
        name, description, focusType, inviteCode,
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: session.user.id,
        users: { create: { userId: session.user.id, role: "admin" } },
      },
    });
    groupId = group.id;
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_GROUP_COOKIE, group.id, { path: "/", sameSite: "lax" });
    revalidatePath("/groups");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create group";
    redirect(`/groups?error=${encodeURIComponent(msg)}`);
  }

  redirect(`/groups/${groupId}`);
}

export async function joinGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const inviteCode = ((formData.get("inviteCode") as string) || "").trim().toLowerCase();
  if (!inviteCode) redirect("/groups?error=Invite+code+is+required");

  try {
    const group = await db.group.findUnique({
      where: { inviteCode },
      include: { _count: { select: { users: true } } },
    });

    if (!group) redirect("/groups?error=Invalid+invite+code");
    if (group.inviteExpiresAt < new Date()) redirect("/groups?error=Invite+code+has+expired");

    const existing = await db.userGroup.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
    });
    if (existing) redirect(`/groups/${group.id}`);
    if (group._count.users >= group.maxMembers) redirect("/groups?error=Group+is+full");

    await db.userGroup.create({
      data: { userId: session.user.id, groupId: group.id, role: "member" },
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_GROUP_COOKIE, group.id, { path: "/", sameSite: "lax" });
    revalidatePath("/groups");
    redirect(`/groups/${group.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to join group";
    redirect(`/groups?error=${encodeURIComponent(msg)}`);
  }
}

export async function removeGroupMember(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const groupId = (formData.get("groupId") as string) || "";
  const memberId = (formData.get("memberId") as string) || "";
  if (!groupId || !memberId) redirect("/groups?error=Missing+required+fields");

  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: { users: true },
    });
    if (!group) redirect("/groups?error=Group+not+found");

    const leader = group.users.find((u) => u.role === "admin" && u.userId === session.user.id);
    if (!leader) redirect("/groups?error=Only+the+leader+can+remove+members");
    if (memberId === session.user.id) redirect("/groups?error=Leader+cannot+remove+themselves");

    await db.userGroup.delete({
      where: { userId_groupId: { userId: memberId, groupId } },
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Failed to remove member";
    redirect(`/groups?error=${encodeURIComponent(msg)}`);
  }

  redirect("/groups");
}
