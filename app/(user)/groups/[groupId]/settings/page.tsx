import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Flag, CheckCircle, XCircle } from "lucide-react";
import { resolveFlaggedSubmission } from "@/lib/actions/leader";

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: { include: { user: true } },
    }
  });

  if (!group) return <div className="text-white p-8">Group not found</div>;

  const myMembership = group.users.find(u => u.userId === session.user.id);
  if (!myMembership) return <div className="text-white p-8 text-center">Not a member.</div>;

  const isLeader = myMembership.role === "admin";

  // If leader, get flagged submissions
  const flaggedCheckIns = isLeader ? await db.checkIn.findMany({
    where: { groupId, status: "FLAGGED" },
    include: {
      user: true,
      tasks: true,
      verifications: { include: { reviewer: true } }
    }
  }) : [];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link href={`/groups/${groupId}`} className="text-white/50 hover:text-white mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Pact
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Pact Settings</h1>
          <p className="text-white/60 mt-1">Manage configuration and resolve disputes.</p>
        </div>
        {isLeader && (
          <span className="px-3 py-1 bg-primary/20 text-primary uppercase text-xs font-bold rounded">Pact Leader</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-white/50 mb-1 uppercase font-bold">Pact Name</div>
                <div className="text-white bg-black/60 px-3 py-2 rounded-md border border-white/5">{group.name}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1 uppercase font-bold">Focus</div>
                <div className="text-white bg-black/60 px-3 py-2 rounded-md border border-white/5">{group.focusType}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1 uppercase font-bold">Invite Code</div>
                <div className="text-primary font-mono tracking-widest bg-black/60 px-3 py-2 rounded-md border border-white/5">{group.inviteCode}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {isLeader && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-yellow-500" /> Leader Dashboard
              </h2>
              <p className="text-sm text-white/60">As leader, you have the authority to override stalled or heavily disputed submissions.</p>

              {flaggedCheckIns.length === 0 ? (
                <Card className="bg-black/40 border-dashed border-white/10">
                  <CardContent className="p-8 text-center text-white/40 text-sm">
                    No flagged submissions require your attention.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {flaggedCheckIns.map(checkIn => (
                    <Card key={checkIn.id} className="bg-black/40 border-yellow-500/30">
                      <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-base text-white">Flagged Proof from {checkIn.user.name}</CardTitle>
                        <CardDescription className="text-yellow-500/70 text-xs mt-1">
                          Rejects {">"} Approvals. Needs final decision.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="text-sm text-white/80 bg-black/60 p-3 rounded border border-white/5 line-clamp-3">
                          {checkIn.reflection}
                        </div>
                        
                        <form action={resolveFlaggedSubmission} className="flex gap-3">
                          <input type="hidden" name="checkInId" value={checkIn.id} />
                          <input type="hidden" name="groupId" value={groupId} />
                          
                          <Button type="submit" name="finalVerdict" value="APPROVE" className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold border border-green-500/50">
                            <CheckCircle className="w-4 h-4 mr-1" /> OVERRIDE APPROVE
                          </Button>
                          <Button type="submit" name="finalVerdict" value="REJECT" className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold border border-red-500/50">
                            <XCircle className="w-4 h-4 mr-1" /> FINALIZE REJECT
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
