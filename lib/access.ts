import { cache } from "react";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getWorkspace, requireSession } from "@/lib/workspace";

export type PortalRole = "admin" | "leader" | "member";

export const getPortalAccess = cache(async (userId: string) => {
  const [user, workspace] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBlocked: true },
    }),
    getWorkspace(userId),
  ]);

  const memberships = workspace.memberships;
  const leaderMemberships = memberships.filter((m) => m.role === "admin");
  const activeLeaderMembership =
    leaderMemberships.find((m) => m.groupId === workspace.activeGroupId) ??
    leaderMemberships[0] ??
    null;

  const isAdmin = user?.role === "admin";
  const isLeader = leaderMemberships.length > 0;
  const primaryRole: PortalRole = isAdmin ? "admin" : isLeader ? "leader" : "member";
  const landingPath = primaryRole === "admin" ? "/admin" : primaryRole === "leader" ? "/leader" : "/dashboard";

  return {
    user,
    memberships,
    activeGroupId: workspace.activeGroupId,
    activeGroup: workspace.activeGroup,
    leaderMemberships,
    activeLeaderMembership,
    isAdmin,
    isLeader,
    primaryRole,
    landingPath,
  };
});

export const requirePortalSession = cache(async () => {
  const session = await requireSession();
  const access = await getPortalAccess(session.user.id);
  if (access.user?.isBlocked) redirect("/?blocked=1");
  return { session, access };
});

export async function requireAdminAccess() {
  const context = await requirePortalSession();
  if (!context.access.isAdmin) {
    redirect(context.access.isLeader ? "/leader" : "/dashboard");
  }
  return context;
}

export async function requireLeaderAccess() {
  const context = await requirePortalSession();
  if (!context.access.isLeader && !context.access.isAdmin) {
    redirect("/dashboard");
  }
  return context;
}

export async function requireLeaderWorkspace() {
  const context = await requireLeaderAccess();
  const leaderMembership = context.access.activeLeaderMembership;
  if (!leaderMembership) {
    redirect(context.access.isAdmin ? "/admin" : "/dashboard");
  }
  return {
    ...context,
    leaderMembership,
    leaderGroupId: leaderMembership.groupId,
    leaderGroup: leaderMembership.group,
  };
}
