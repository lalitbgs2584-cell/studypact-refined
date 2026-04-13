import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function PenaltiesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { groupId } = await params;

  const penalties = await db.penaltyEvent.findMany({
    where: { groupId },
    include: {
      user: true,
      checkIn: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-destructive w-8 h-8" /> Penalty Ledger
        </h1>
        <p className="text-white/60 mt-2">A transparent record of all missed deadlines and rejected proofs.</p>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg text-white">Recent Infractions</CardTitle>
          <CardDescription className="text-white/50">Accountability means actions have consequences.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/10">
            {penalties.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                The ledger is clean. Everyone is keeping their pacts!
              </div>
            ) : (
              penalties.map((penalty) => (
                <div key={penalty.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-destructive/20 text-destructive rounded-lg border border-destructive/30 mt-1">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">
                        <span className="text-white/70">{penalty.user.name}</span> penalized
                      </p>
                      <p className="text-xs text-white/60">{penalty.reason}</p>
                      <p className="text-[10px] text-white/40 mt-1 uppercase font-semibold">
                        {formatDistanceToNow(new Date(penalty.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-destructive px-3 py-1 bg-destructive/10 rounded border border-destructive/20">
                    -{penalty.points} PTS
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
