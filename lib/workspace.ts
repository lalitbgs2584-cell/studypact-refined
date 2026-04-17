import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACTIVE_GROUP_COOKIE } from "@/lib/constants";

export { ACTIVE_GROUP_COOKIE } from "@/lib/constants";

export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
});

// Slim query — only role + group identity, no member lists
export const getUserGroups = cache(async (userId: string) => {
  return db.userGroup.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    select: {
      userId: true,
      groupId: true,
      role: true,
      joinedAt: true,
      points: true,
      streak: true,
      bestStreak: true,
      completions: true,
      misses: true,
      reputationScore: true,
      inactivityStrikes: true,
      lastCheckInAt: true,
      earlyBirdCount: true,
      user: { select: { id: true, name: true, image: true } },
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          link: true,
          visibility: true,
          focusType: true,
          taskPostingMode: true,
          penaltyMode: true,
          inviteCode: true,
          inviteExpiresAt: true,
          maxMembers: true,
          dailyPenalty: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: { id: true, name: true, image: true } },
          users: {
            select: {
              userId: true,
              role: true,
              points: true,
              completions: true,
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { joinedAt: "asc" },
          },
          _count: { select: { users: true, tasks: true } },
        },
      },
    },
  });
});

export type Membership = Awaited<ReturnType<typeof getUserGroups>>[number];

export const getWorkspace = cache(async (userId: string) => {
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
});

export async function getActiveGroupId(userId: string) {
  const { activeGroupId } = await getWorkspace(userId);
  return activeGroupId;
}