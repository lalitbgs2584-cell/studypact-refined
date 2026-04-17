export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { deleteGroupAsAdmin, forceRemoveGroupMember, reassignGroupLeader } from "@/lib/actions/admin";

async function fetchAllGroups() {
  return db.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      users: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: {
          tasks: true,
          checkIns: true,
          penaltyEvents: true,
        },
      },
    },
  });
}

export default async function AdminGroupsPage() {
  await requireAdminAccess();
  const groups = await fetchAllGroups();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Users className="h-3.5 w-3.5" />
            Group Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            All Groups ({groups.length})
          </h1>
          <p className="text-sm text-white/50">
            Monitor group activity, manage memberships, and assign leaders.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.map((group) => {
          const leader = group.users.find((u) => u.role === "admin");
          const completionRate =
            group._count.tasks > 0
              ? Math.round((group._count.checkIns / group._count.tasks) * 100)
              : 0;

          return (
            <Card key={group.id}>
              <CardContent className="space-y-4 p-5">
                {/* Group Header */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{group.name}</h2>
                      <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        {group.visibility}
                      </span>
                    </div>
                    {group.description && (
                      <p className="mt-1 max-w-lg text-sm text-white/50">{group.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/40">
                      <span>Leader: <span className="text-primary">{leader?.user.name ?? "None"}</span></span>
                      <span>Created by: {group.createdBy.name}</span>
                      <span>Focus: {group.focusType}</span>
                      <span>Penalty: {group.penaltyMode}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-center">
                    <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                      <div className="text-sm font-bold text-primary">{group.users.length}/{group.maxMembers}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Members</div>
                    </div>
                    <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                      <div className="text-sm font-bold text-white">{group._count.tasks}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Tasks</div>
                    </div>
                    <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                      <div className="text-sm font-bold text-emerald-400">{completionRate}%</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Completion</div>
                    </div>
                    <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                      <div className="text-sm font-bold text-red-400">{group._count.penaltyEvents}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Penalties</div>
                    </div>
                  </div>
                </div>

                {/* Members Table */}
                <div className="rounded-lg border border-border">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border bg-secondary/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <span>Member</span>
                    <span>Stats</span>
                    <span>Actions</span>
                  </div>
                  {group.users.map((membership) => (
                    <div
                      key={membership.userId}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {membership.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                            {membership.user.name}
                            {membership.role === "admin" && (
                              <Crown className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 text-[11px] text-white/50">
                        <span>{membership.completions}✓</span>
                        <span>{membership.streak}🔥</span>
                        <span>{membership.points}pt</span>
                      </div>

                      <div className="flex gap-1">
                        {membership.role !== "admin" && (
                          <>
                            <form action={reassignGroupLeader}>
                              <input type="hidden" name="groupId" value={group.id} />
                              <input type="hidden" name="newLeaderId" value={membership.userId} />
                              <input type="hidden" name="returnTo" value="/admin/groups" />
                              <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" title="Promote to leader">
                                <Crown className="h-3 w-3" />
                              </Button>
                            </form>
                            <form action={forceRemoveGroupMember}>
                              <input type="hidden" name="groupId" value={group.id} />
                              <input type="hidden" name="memberId" value={membership.userId} />
                              <input type="hidden" name="returnTo" value="/admin/groups" />
                              <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-red-400" title="Remove member">
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </form>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Group Actions */}
                <div className="flex gap-2 border-t border-border pt-3">
                  <form action={deleteGroupAsAdmin}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="returnTo" value="/admin/groups" />
                    <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                      Delete Group
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
