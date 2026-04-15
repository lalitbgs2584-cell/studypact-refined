export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserX, CheckCircle2, XCircle } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { removeGroupMember } from "@/lib/actions/group";
import { resolveFlaggedSubmission } from "@/lib/actions/leader";

const statBox: React.CSSProperties = {
  background: "rgba(196,172,120,0.04)",
  border: "1px solid rgba(196,172,120,0.10)",
  borderRadius: 12, padding: 16,
};

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      createdBy: { select: { name: true } },
      users: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      checkIns: {
        where: { status: "FLAGGED" },
        include: {
          user: { select: { name: true } },
          tasks: { select: { id: true, title: true } },
          startFiles: true,
          endFiles: true,
          verifications: {
            include: { reviewer: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) return <div style={{ padding: 32, color: "#EDE6D6" }}>Group not found</div>;

  const membership = group.users.find((u) => u.userId === session.user.id);
  if (!membership) return <div style={{ padding: 32, color: "#EDE6D6" }}>Not a member.</div>;

  const isLeader = membership.role === "admin";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/groups/${groupId}`} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#6A7888", textDecoration: "none",
      }}>
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back to Feed
      </Link>

      {/* Group info */}
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
          <CardDescription>{group.name} · created by {group.createdBy.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)", borderRadius: 12, padding: 16, fontSize: 13, color: "#A09880" }}>
            {group.description || "No description provided."}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Members",    value: group.users.length },
              { label: "Your role",  value: isLeader ? "Leader" : "Member" },
              { label: "Invite code", value: group.inviteCode.toUpperCase(), mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} style={statBox}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#6A7888", fontWeight: 600 }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#C4AC78", fontFamily: mono ? "monospace" : undefined, letterSpacing: mono ? "0.2em" : undefined }}>{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Members list — leader can remove */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {isLeader ? "As leader you can remove members from the group." : "Only the leader can manage members."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {group.users.map((member) => {
            const isSelf = member.userId === session.user.id;
            const isAdmin = member.role === "admin";
            return (
              <div key={member.userId} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)",
                borderRadius: 12, padding: "12px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #1E2D40, #886840)",
                    color: "#E8E0CC", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 1px rgba(196,172,120,0.18)",
                  }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE6D6" }}>
                      {member.user.name} {isSelf ? <span style={{ fontSize: 11, color: "#6A7888" }}>(you)</span> : null}
                    </div>
                    <div style={{ fontSize: 11, color: isAdmin ? "#C4AC78" : "#6A7888", marginTop: 2 }}>
                      {isAdmin ? "Leader" : "Member"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isAdmin && <ShieldCheck style={{ width: 16, height: 16, color: "#C4AC78" }} />}
                  {isLeader && !isSelf && !isAdmin && (
                    <form action={removeGroupMember}>
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="memberId" value={member.userId} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                      >
                        <UserX style={{ width: 13, height: 13 }} />
                        Remove
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Flagged submissions — leader only */}
      {isLeader && (
        <Card>
          <CardHeader>
            <CardTitle>Flagged Submissions</CardTitle>
            <CardDescription>
              {group.checkIns.length === 0
                ? "No flagged submissions right now."
                : `${group.checkIns.length} submission(s) need your final verdict.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.checkIns.length === 0 ? (
              <div style={{
                background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)",
                borderRadius: 12, padding: "28px 16px", textAlign: "center", color: "#6A7888", fontSize: 13,
              }}>
                All clear — no flagged submissions.
              </div>
            ) : (
              group.checkIns.map((checkIn) => {
                const targetLabel = checkIn.tasks[0]?.title ?? "Task proof";
                const approvals = checkIn.verifications.filter((v) => v.verdict === "APPROVE").length;
                const flags = checkIn.verifications.filter((v) => v.verdict === "FLAG").length;

                return (
                  <div key={checkIn.id} style={{
                    background: "rgba(160,104,104,0.06)", backdropFilter: "blur(12px)",
                    borderTop: "1px solid rgba(160,104,104,0.22)", borderLeft: "3px solid #A06868",
                    borderRight: "1px solid rgba(160,104,104,0.08)", borderBottom: "1px solid rgba(160,104,104,0.06)",
                    borderRadius: 14, padding: 18,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE6D6" }}>{targetLabel}</div>
                        <div style={{ fontSize: 11, color: "#6A7888", marginTop: 3 }}>
                          by {checkIn.user.name} · {checkIn.createdAt.toLocaleString()}
                        </div>
                      </div>
                      <span style={{
                        background: "rgba(160,104,104,0.12)", border: "1px solid rgba(160,104,104,0.28)",
                        borderRadius: 9999, padding: "2px 10px",
                        fontSize: 10, fontWeight: 700, color: "#C08888", letterSpacing: "0.1em", textTransform: "uppercase",
                      }}>
                        Flagged
                      </span>
                    </div>

                    {/* Proof images */}
                    {(checkIn.startFiles[0] || checkIn.endFiles[0]) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {checkIn.startFiles[0] && (
                          <div style={{ borderRadius: 10, overflow: "hidden" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={checkIn.startFiles[0].url} alt="Before" style={{ width: "100%", height: 120, objectFit: "cover" }} />
                          </div>
                        )}
                        {checkIn.endFiles[0] && (
                          <div style={{ borderRadius: 10, overflow: "hidden" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={checkIn.endFiles[0].url} alt="After" style={{ width: "100%", height: 120, objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    )}

                    {checkIn.proofText && (
                      <div style={{ background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#A09880", marginBottom: 12 }}>
                        {checkIn.proofText}
                      </div>
                    )}

                    {/* Vote tally */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <span style={{ background: "rgba(154,170,120,0.13)", border: "1px solid rgba(154,170,120,0.28)", borderRadius: 9999, padding: "2px 10px", fontSize: 11, color: "#AABB88" }}>
                        {approvals} approval{approvals !== 1 ? "s" : ""}
                      </span>
                      <span style={{ background: "rgba(160,104,104,0.12)", border: "1px solid rgba(160,104,104,0.28)", borderRadius: 9999, padding: "2px 10px", fontSize: 11, color: "#C08888" }}>
                        {flags} flag{flags !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Leader verdict form */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(196,172,120,0.09)" }}>
                      <form action={resolveFlaggedSubmission}>
                        <input type="hidden" name="checkInId" value={checkIn.id} />
                        <input type="hidden" name="groupId" value={groupId} />
                        <input type="hidden" name="finalVerdict" value="APPROVE" />
                        <Button type="submit" size="sm" className="gap-1.5">
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                          Approve
                        </Button>
                      </form>
                      <form action={resolveFlaggedSubmission}>
                        <input type="hidden" name="checkInId" value={checkIn.id} />
                        <input type="hidden" name="groupId" value={groupId} />
                        <input type="hidden" name="finalVerdict" value="REJECT" />
                        <Button type="submit" variant="destructive" size="sm" className="gap-1.5">
                          <XCircle style={{ width: 13, height: 13 }} />
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
