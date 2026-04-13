import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: { include: { user: true } },
      tasks: { 
        orderBy: { createdAt: "desc" },
        include: { user: true, checkIn: true }
      }
    }
  });

  if (!group) {
    return <div className="text-white p-8">Group not found</div>;
  }

  const isMember = group.users.some(u => u.userId === session.user.id);
  
  if (!isMember) {
    return <div className="text-white p-8 text-center mt-20">You are not a member of this pact.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Group Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              {group.focusType} PACT
            </span>
            <span className="text-white/40 text-sm font-medium">{group.users.length} / {group.maxMembers} Members</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{group.name}</h1>
          <p className="text-white/60 mt-2 max-w-2xl">{group.description}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">Settings</Button>
          </Link>
          <Link href={`/groups/${groupId}/task/create`}>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> POST TASK
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Tab */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Latest Tasks & Questions</h2>
          
          {group.tasks.length === 0 ? (
            <Card className="bg-black/20 border-white/5 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-white/40 mb-4">The feed is quiet. Be the first to post a task.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {group.tasks.map(task => (
                <Card key={task.id} className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                          {task.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{task.user.name}</p>
                          <p className="text-xs text-white/40">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-white/70 uppercase">
                        {task.category}
                      </div>
                    </div>
                    
                    <Link href={`/groups/${groupId}/task/${task.id}`}>
                      <h3 className="text-lg font-bold text-white mb-2 hover:text-primary transition-colors">{task.title}</h3>
                      {task.details && (
                        <p className="text-sm text-white/60 mb-4 line-clamp-3">{task.details}</p>
                      )}
                    </Link>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-sm">
                      {task.status === "PENDING" ? (
                        <div className="flex items-center gap-1.5 text-yellow-500">
                          <Clock className="w-4 h-4" /> Pending Proof
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <CheckCircle className="w-4 h-4" /> Submitted
                        </div>
                      )}
                      
                      <Link href={`/groups/${groupId}/task/${task.id}`} className="ml-auto text-primary hover:text-primary/80 font-medium text-sm">
                        View Details →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.users
                  .sort((a, b) => b.points - a.points)
                  .map((ug, idx) => (
                  <div key={ug.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-white/40 text-sm font-bold w-4">{idx + 1}.</div>
                      <div className="text-sm font-medium text-white">{ug.user.name}</div>
                      {ug.role === "admin" && <span className="text-[10px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1">Leader</span>}
                    </div>
                    <div className="text-sm font-bold text-white/70">{ug.points} <span className="text-white/30 text-xs">pts</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">Invite Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/60 p-3 rounded-lg border border-white/10 text-center flex items-center justify-center font-mono text-xl tracking-widest text-primary">
                {group.inviteCode}
              </div>
              <p className="text-xs text-center text-white/40 mt-3">Share this code with your peers to join the pact.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
