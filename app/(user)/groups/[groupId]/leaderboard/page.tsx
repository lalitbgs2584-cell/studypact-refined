import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Target } from "lucide-react";

export default async function LeaderboardPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { groupId } = await params;

  const users = await db.userGroup.findMany({
    where: { groupId },
    include: {
      user: true,
    },
    orderBy: {
      points: "desc"
    }
  });

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Trophy className="text-primary w-8 h-8" /> Leaderboard
        </h1>
        <p className="text-white/60 mt-2">Rankings are based on consistency, verifications, and streak retention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top 3 Podium Cards */}
        {users.slice(0, 3).map((ug, index) => (
          <Card key={ug.userId} className={`bg-black/40 backdrop-blur-md relative overflow-hidden ${index === 0 ? "border-primary/50 shadow-[0_0_30px_-10px_var(--color-primary)] scale-105 z-10" : "border-white/10"}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] pointer-events-none ${index === 0 ? "bg-primary/30" : "bg-white/10"}`} />
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mb-4 ${index === 0 ? "bg-primary text-white" : "bg-white/10 text-white"}`}>
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{ug.user.name}</h3>
              <p className="text-sm font-medium text-primary mb-3">{ug.points} PTS</p>
              
              <div className="flex gap-4 text-white/50 text-xs w-full justify-center">
                <div className="bg-black/50 px-2 py-1 rounded">✅ {ug.completions}</div>
                <div className="bg-black/50 px-2 py-1 rounded">❌ {ug.misses}</div>
                <div className="bg-black/50 px-2 py-1 rounded">🔥 {ug.streak}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length > 3 && (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg text-white">Full Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {users.slice(3).map((ug, index) => (
                <div key={ug.userId} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-white/40 font-bold w-6 text-right">#{index + 4}</div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                      {ug.user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ug.user.name}</h4>
                      <p className="text-xs text-white/40">{ug.completions} completed • {ug.misses} missed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{ug.points} PTS</div>
                    <div className="text-xs text-white/50">🔥 Streak: {ug.streak}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
