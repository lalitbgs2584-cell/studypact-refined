import { redirect } from "next/navigation";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;
  
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: {
        include: { user: { select: { name: true } } }
      }
    }
  });

  if (!group || !group.users.some(u => u.userId === session.user.id)) {
    redirect("/dashboard");
  }

  // Fetch approved check-ins that are early birds
  const checkIns = await db.checkIn.findMany({
    where: { 
      groupId,
      status: "APPROVED",
      isEarlyBird: true
    },
    include: {
      user: { select: { name: true, id: true } }
    }
  });

  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const stats = group.users.map((member) => {
    const userCheckIns = checkIns.filter(c => c.userId === member.userId);
    
    return {
      userId: member.userId,
      name: member.user.name,
      daily: userCheckIns.filter(c => c.createdAt >= dayStart).length,
      weekly: userCheckIns.filter(c => c.createdAt >= weekStart).length,
      monthly: userCheckIns.filter(c => c.createdAt >= monthStart).length,
      allTime: member.earlyBirdCount || userCheckIns.length,
    };
  });

  // Sort them for the top lists
  const dailyLeaders = [...stats].sort((a, b) => b.daily - a.daily || b.allTime - a.allTime);
  const weeklyLeaders = [...stats].sort((a, b) => b.weekly - a.weekly || b.allTime - a.allTime);
  const monthlyLeaders = [...stats].sort((a, b) => b.monthly - a.monthly || b.allTime - a.allTime);

  const renderLeaderboard = (title: string, data: typeof stats, prop: "daily" | "weekly" | "monthly") => (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-white text-xl">{title}</CardTitle>
        </div>
        <CardDescription>Most early completions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.filter(d => d[prop] > 0).length === 0 ? (
          <div className="p-6 text-center text-white/40 text-sm bg-secondary/20 rounded-[4px]">
            No speedsters yet this period.
          </div>
        ) : (
          data.filter(d => d[prop] > 0).slice(0, 5).map((user, i) => (
            <div key={user.userId} className="flex justify-between items-center bg-secondary/30 rounded-[4px] p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 text-center font-bold text-white/30 text-sm">#{i + 1}</div>
                <div className="font-semibold text-white text-sm">{user.name}</div>
              </div>
              <div className="text-primary font-bold">{user[prop]}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary border border-primary/20">
            <Trophy className="h-3 w-3" />
            Hall of Fame
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white m-0">Speedster Leaderboard</h1>
          <p className="text-sm text-white/50 max-w-2xl">
            See who leads the pack by actively finishing their tasks and assignments early.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {renderLeaderboard("Today", dailyLeaders, "daily")}
        {renderLeaderboard("This Week", weeklyLeaders, "weekly")}
        {renderLeaderboard("This Month", monthlyLeaders, "monthly")}
      </div>
    </div>
  );
}
