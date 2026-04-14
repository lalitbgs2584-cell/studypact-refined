import Link from "next/link";
import { ArrowRight, CirclePlus, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup, joinGroup, setActiveGroup } from "@/lib/actions/group";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getWorkspace } from "@/lib/workspace";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;
  const totalTasks = memberships.reduce((sum, membership) => sum + membership.group._count.tasks, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Groups
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Group control center</h1>
              <p className="max-w-2xl text-white/60">
                Switch the active context, create a new pact, or join one with an invite code. The group cards now live here instead of inside the sidebar.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Current context</CardTitle>
            <CardDescription className="text-white/50">A quick snapshot of your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Active group</div>
              <div className="mt-1 text-lg font-black text-primary">{activeGroup?.name ?? "No active group"}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Groups</div>
              <div className="mt-1 text-2xl font-black text-primary">{memberships.length}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Tasks</div>
              <div className="mt-1 text-2xl font-black text-primary">{totalTasks}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Active state</div>
              <div className="mt-1 text-sm font-semibold text-white">{activeGroupId ? "Ready" : "Not set yet"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {errorMessage ? <div className="rounded-[4px] bg-accent/10 px-4 py-3 text-sm text-accent">{errorMessage}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Create Group</CardTitle>
            <CardDescription className="text-white/50">Start a new workspace and keep the invite code handy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name" className="text-white/80">
                  Group name
                </Label>
                <Input id="group-name" name="name" placeholder="Study Sprint" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description" className="text-white/80">
                  Description
                </Label>
                <textarea
                  id="group-description"
                  name="description"
                  placeholder="What is this group about?"
                  className="min-h-24 w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-focus" className="text-white/80">
                  Focus
                </Label>
                <select
                  id="group-focus"
                  name="focusType"
                  className="w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="GENERAL">General</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="DSA">DSA</option>
                  <option value="EXAM_PREP">Exam Prep</option>
                  <option value="MACHINE_LEARNING">Machine Learning</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <Button type="submit" className="gap-2">
                <CirclePlus className="h-4 w-4" />
                Create Group
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Join Group</CardTitle>
            <CardDescription className="text-white/50">Use an invite code to enter an existing pact.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={joinGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="text-white/80">
                  Invite code
                </Label>
                <Input id="invite-code" name="inviteCode" placeholder="AB12CD34" className="font-mono uppercase tracking-[0.3em]" required />
              </div>
              <Button type="submit" variant="outline" className="gap-2">
                Join Group
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Your Groups</CardTitle>
          <CardDescription className="text-white/50">Pick the active workspace, then jump into its feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberships.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No groups yet. Create one or join by invite code.</div>
          ) : (
            memberships.map((membership) => {
              const group = membership.group;
              const active = activeGroupId === membership.groupId;

              return (
                <div
                  key={membership.groupId}
                  className={cn(
                    "rounded-lg p-4 shadow-[0_0_30px_-28px_rgba(0,0,0,0.8)]",
                    active ? "bg-primary/10" : "bg-secondary/25"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-white">{group.name}</h2>
                        {active ? (
                          <span className="rounded-[4px] bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                            Active Context
                          </span>
                        ) : null}
                      </div>
                      <p className="max-w-2xl text-sm text-white/60">{group.description || "No description provided."}</p>
                    </div>
                    <div className="text-right text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">{group.focusType}</div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Members</div>
                      <div className="mt-1 text-2xl font-black text-primary">{group._count.users}</div>
                    </div>
                    <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Tasks</div>
                      <div className="mt-1 text-2xl font-black text-primary">{group._count.tasks}</div>
                    </div>
                    <div className="rounded-[4px] bg-secondary/40 p-4 shadow-[0_0_24px_-22px_rgba(0,255,178,0.14)]">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Created by</div>
                      <div className="mt-1 text-sm font-semibold text-white">{group.createdBy.name}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!active ? (
                      <form action={setActiveGroup}>
                        <input type="hidden" name="groupId" value={membership.groupId} />
                        <Button type="submit" variant="outline" size="sm" className="gap-2">
                          Use this group
                        </Button>
                      </form>
                    ) : (
                      <div className="rounded-[4px] bg-secondary/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        Current group
                      </div>
                    )}
                    <Link href={`/groups/${membership.groupId}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        Open group
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
