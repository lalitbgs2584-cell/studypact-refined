import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle, ArrowRight, Shield, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const userGroups = await db.userGroup.findMany({
    where: { userId },
    include: { 
      group: {
        include: {
          _count: {
            select: { users: true, tasks: true }
          }
        }
      } 
    }
  });

  const recentTasks = await db.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { group: true }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back, {session?.user.name}</h1>
        <p className="text-white/60 mt-1">Here is the latest from your pacts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{userGroups.length}</div>
              <div className="text-sm font-medium text-primary">Active Pacts</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white/50" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {userGroups.reduce((acc, current) => acc + current.points, 0)}
              </div>
              <div className="text-sm font-medium text-white/50">Total Reputation</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Pacts</h2>
            <Link href="/groups/create" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> Create Pact
            </Link>
          </div>
          
          {userGroups.length === 0 ? (
            <Card className="bg-black/20 border-white/5 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-white/40 mb-4">You haven&apos;t joined any pacts yet.</p>
                <Link href="/groups/discover" className="btn-primary inline-flex px-6 py-2 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/90">
                  Discover Pacts
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userGroups.map((ug) => (
                <Link key={ug.groupId} href={`/groups/${ug.groupId}`}>
                  <Card className="bg-black/40 border-white/10 hover:border-primary/50 transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">{ug.group.name}</CardTitle>
                      <CardDescription className="text-white/50 line-clamp-2">
                        {ug.group.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span>{ug.group._count.users} members</span>
                        <div className="flex items-center gap-1 text-primary">
                          View details <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Recent Postings</h2>
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-0 divide-y divide-white/10">
              {recentTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-white/40">
                  No recent tasks found.
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="text-xs text-primary font-medium mb-1">{task.group.name}</div>
                    <div className="text-sm font-medium text-white mb-1">{task.title}</div>
                    <div className="text-xs text-white/50">Status: {task.status}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
