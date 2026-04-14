import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      createdBy: { select: { name: true } },
      users: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) return <div className="p-8 text-white">Group not found</div>;

  const membership = group.users.find((item) => item.userId === session.user.id);
  if (!membership) return <div className="p-8 text-white">Not a member.</div>;

  const isLeader = membership.role === "admin";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Group Settings</CardTitle>
          <CardDescription className="text-white/50">
            {group.name} · created by {group.createdBy.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[4px] bg-secondary/40 p-4 text-white/80 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
            {group.description || "No description provided."}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members</div>
              <div className="mt-1 text-xl font-black text-primary">{group.users.length}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Your role</div>
              <div className="mt-1 text-xl font-black text-white">{isLeader ? "Leader" : "Member"}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Invite code</div>
              <div className="mt-1 font-mono text-xl font-black tracking-[0.25em] text-primary">{group.inviteCode.toUpperCase()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Members</CardTitle>
          <CardDescription className="text-white/50">
            {isLeader ? "The sidebar already lets you remove members directly." : "Only the leader can manage members."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {group.users.map((member) => (
            <div key={member.userId} className="flex items-center justify-between rounded-[4px] bg-secondary/25 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-primary/15 text-sm font-bold text-primary">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white">{member.user.name}</div>
                  <div className="text-xs text-white/45">{member.role === "admin" ? "Leader" : "Member"}</div>
                </div>
              </div>
              {member.role === "admin" ? (
                <ShieldCheck className="h-4 w-4 text-primary" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
