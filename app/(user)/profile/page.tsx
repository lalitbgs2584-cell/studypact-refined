import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspace, requireSession } from "@/lib/workspace";

export default async function ProfilePage() {
  const session = await requireSession();
  const { memberships, activeGroup } = await getWorkspace(session.user.id);

  const totalPoints = memberships.reduce((sum, membership) => sum + membership.group.users.reduce((groupSum, member) => groupSum + member.points, 0), 0);
  const totalCompletions = memberships.reduce((sum, membership) => sum + membership.group.users.reduce((groupSum, member) => groupSum + member.completions, 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Profile
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{session.user.name}</h1>
            <p className="text-white/60">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Groups</div>
            <div className="mt-1 text-2xl font-black text-white">{memberships.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Points</div>
            <div className="mt-1 text-2xl font-black text-white">{totalPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Completions</div>
            <div className="mt-1 text-2xl font-black text-white">{totalCompletions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Active Group</CardTitle>
          <CardDescription className="text-white/50">
            {activeGroup ? activeGroup.name : "No active group selected"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeGroup ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/80">
                {activeGroup.description || "No description provided."}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members</div>
                  <div className="mt-1 text-xl font-black text-white">{activeGroup._count.users}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">Tasks</div>
                  <div className="mt-1 text-xl font-black text-white">{activeGroup._count.tasks}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">Invite code</div>
                  <div className="mt-1 font-mono text-xl font-black tracking-[0.25em] text-primary">{activeGroup.inviteCode.toUpperCase()}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-white/45">
              Create or join a group to populate your profile.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
