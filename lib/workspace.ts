import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACTIVE_GROUP_COOKIE } from "@/lib/constants";

export { ACTIVE_GROUP_COOKIE } from "@/lib/constants"; // re-export so existing imports don't break

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function getUserGroups(userId: string) {
  return db.userGroup.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, image: true } },
      group: {
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          users: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { joinedAt: "asc" },
          },
          _count: { select: { users: true, tasks: true } },
        },
      },
    },
  });
}

export async function getActiveGroupId(userId: string) {
  const groups = await getUserGroups(userId);
  const cookieStore = await cookies();
  const cookieGroupId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;
  if (cookieGroupId && groups.some((m) => m.groupId === cookieGroupId)) {
    return cookieGroupId;
  }
  return groups[0]?.groupId ?? null;
}

export async function getWorkspace(userId: string) {
  const memberships = await getUserGroups(userId);
  const cookieStore = await cookies();
  const cookieGroupId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;
  const activeGroupId =
    cookieGroupId && memberships.some((m) => m.groupId === cookieGroupId)
      ? cookieGroupId
      : memberships[0]?.groupId ?? null;
  const activeGroup =
    memberships.find((m) => m.groupId === activeGroupId)?.group ??
    memberships[0]?.group ??
    null;

  return { memberships, activeGroupId, activeGroup };
}