import Link from "next/link";
import { ArrowRight, CirclePlus, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGroup, joinGroup, setActiveGroup } from "@/lib/actions/group";
import { auth } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";

const statBox: React.CSSProperties = {
  background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.10)",
  borderRadius: 12, padding: 16,
};

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
  const totalTasks = memberships.reduce((sum, m) => sum + m.group._count.tasks, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page header */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="card-accent-primary">
          <CardContent className="space-y-4 p-6 md:p-8">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(196,172,120,0.08)", border: "1px solid rgba(196,172,120,0.20)",
              borderRadius: 9999, padding: "5px 14px",
              fontSize: 11, fontWeight: 600, color: "#C4AC78", letterSpacing: "0.2em", textTransform: "uppercase",
            }}>
              <Sparkles style={{ width: 12, height: 12 }} />
              Groups
            </div>
            <div className="space-y-2">
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#EDE6D6", margin: 0 }}>Group control center</h1>
              <p style={{ fontSize: 13, color: "#A09880", maxWidth: 480 }}>
                Switch the active context, create a new pact, or join one with an invite code.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current context</CardTitle>
            <CardDescription>A quick snapshot of your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Active group", value: activeGroup?.name ?? "None", large: false },
              { label: "Groups",       value: String(memberships.length),  large: true },
              { label: "Tasks",        value: String(totalTasks),          large: true },
              { label: "Active state", value: activeGroupId ? "Ready" : "Not set", large: false },
            ].map(({ label, value, large }) => (
              <div key={label} style={statBox}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#6A7888", fontWeight: 600 }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: large ? 22 : 14, fontWeight: 700, color: "#C4AC78" }}>{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {errorMessage && (
        <div style={{
          background: "rgba(160,104,104,0.10)", border: "1px solid rgba(160,104,104,0.24)",
          borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C08888",
        }}>{errorMessage}</div>
      )}

      {/* Create / Join */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Group</CardTitle>
            <CardDescription>Start a new workspace and keep the invite code handy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input id="group-name" name="name" placeholder="Study Sprint" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea id="group-description" name="description" placeholder="What is this group about?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-focus">Focus</Label>
                <Select id="group-focus" name="focusType">
                  <option value="GENERAL">General</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="DSA">DSA</option>
                  <option value="EXAM_PREP">Exam Prep</option>
                  <option value="MACHINE_LEARNING">Machine Learning</option>
                  <option value="CUSTOM">Custom</option>
                </Select>
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
            <CardTitle>Join Group</CardTitle>
            <CardDescription>Use an invite code to enter an existing pact.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={joinGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite code</Label>
                <Input id="invite-code" name="inviteCode" placeholder="AB12CD34" className="font-mono uppercase tracking-[0.3em]" required />
              </div>
              <Button type="submit" variant="outline" className="gap-2">
                Join Group
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Group list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>Pick the active workspace, then jump into its feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberships.length === 0 ? (
            <div style={{
              background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)",
              borderRadius: 12, padding: "32px 16px", textAlign: "center", color: "#6A7888", fontSize: 13,
            }}>
              No groups yet. Create one or join by invite code.
            </div>
          ) : (
            memberships.map((membership) => {
              const group = membership.group;
              const active = activeGroupId === membership.groupId;

              return (
                <div key={membership.groupId} style={{
                  background: active ? "rgba(196,172,120,0.07)" : "rgba(196,172,120,0.03)",
                  borderTop: `1px solid ${active ? "rgba(196,172,120,0.28)" : "rgba(196,172,120,0.12)"}`,
                  borderLeft: active ? "3px solid #C4AC78" : "1px solid rgba(196,172,120,0.08)",
                  borderRight: "1px solid rgba(196,172,120,0.05)",
                  borderBottom: "1px solid rgba(196,172,120,0.04)",
                  borderRadius: 14, padding: 20,
                  boxShadow: active ? "0 4px 20px rgba(196,172,120,0.08)" : "none",
                }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#EDE6D6", margin: 0 }}>{group.name}</h2>
                        {active && (
                          <span style={{
                            background: "rgba(196,172,120,0.12)", border: "1px solid rgba(196,172,120,0.24)",
                            borderRadius: 9999, padding: "2px 10px",
                            fontSize: 10, fontWeight: 700, color: "#C4AC78", letterSpacing: "0.15em", textTransform: "uppercase",
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "#A09880", margin: 0 }}>{group.description || "No description provided."}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: "#6A7888",
                      textTransform: "uppercase", letterSpacing: "0.2em",
                    }}>{group.focusType}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Members",    value: group._count.users },
                      { label: "Tasks",      value: group._count.tasks },
                      { label: "Created by", value: group.createdBy.name, small: true },
                    ].map(({ label, value, small }) => (
                      <div key={label} style={statBox}>
                        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#6A7888", fontWeight: 600 }}>{label}</div>
                        <div style={{ marginTop: 4, fontSize: small ? 13 : 20, fontWeight: 700, color: "#C4AC78" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!active ? (
                      <form action={setActiveGroup}>
                        <input type="hidden" name="groupId" value={membership.groupId} />
                        <Button type="submit" variant="outline" size="sm">Use this group</Button>
                      </form>
                    ) : (
                      <span style={{
                        background: "rgba(196,172,120,0.08)", border: "1px solid rgba(196,172,120,0.18)",
                        borderRadius: 9999, padding: "6px 14px",
                        fontSize: 11, fontWeight: 600, color: "#C4AC78", letterSpacing: "0.12em", textTransform: "uppercase",
                      }}>
                        Current group
                      </span>
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
