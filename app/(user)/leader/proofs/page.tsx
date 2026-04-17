export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireLeaderWorkspace } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { resolveFlaggedSubmission } from "@/lib/actions/leader";

export default async function LeaderProofsPage() {
  const { leaderGroupId, leaderGroup } = await requireLeaderWorkspace();

  const queue = await db.checkIn.findMany({
    where: {
      groupId: leaderGroupId,
      status: { in: ["PENDING", "FLAGGED", "DISPUTED"] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true } },
      tasks: { select: { id: true, title: true } },
      verifications: {
        select: {
          verdict: true,
          note: true,
          reviewer: { select: { name: true } },
        },
      },
      startFiles: { select: { url: true, name: true } },
      endFiles: { select: { url: true, name: true } },
    },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leader">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-violet-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Proof Review
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {leaderGroup.name} — Proof Queue ({queue.length})
          </h1>
          <p className="text-sm text-white/50">
            Review pending and flagged proofs. Your verdict carries higher weight.
          </p>
        </CardContent>
      </Card>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-violet-400/30" />
            <div className="text-lg font-bold text-white/60">Queue is clear</div>
            <div className="text-sm text-white/40">No proofs need your attention right now.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((checkIn) => {
            const approvals = checkIn.verifications.filter((v) => v.verdict === "APPROVE").length;
            const flags = checkIn.verifications.filter((v) => v.verdict !== "APPROVE").length;

            return (
              <Card
                key={checkIn.id}
                className={cn(
                  "border-l-4",
                  checkIn.status === "DISPUTED" ? "border-l-yellow-500" :
                  checkIn.status === "FLAGGED" ? "border-l-orange-500" :
                  "border-l-blue-500"
                )}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{checkIn.user.name}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          checkIn.status === "DISPUTED" ? "bg-yellow-500/15 text-yellow-400" :
                          checkIn.status === "FLAGGED" ? "bg-orange-500/15 text-orange-400" :
                          "bg-blue-500/15 text-blue-400"
                        )}>
                          {checkIn.status}
                        </span>
                      </div>
                      {checkIn.tasks[0] && (
                        <div className="text-sm text-white/60">
                          Task: <span className="text-white/80">{checkIn.tasks[0].title}</span>
                        </div>
                      )}
                      {checkIn.reflection && (
                        <div className="max-w-xl rounded-[4px] bg-secondary/30 p-3 text-sm text-white/70">
                          {checkIn.reflection}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 text-center">
                      <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                        <div className="text-sm font-bold text-emerald-400">{approvals}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/40">Approve</div>
                      </div>
                      <div className="rounded-[4px] border border-border bg-secondary/30 px-3 py-2">
                        <div className="text-sm font-bold text-red-400">{flags}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/40">Flag</div>
                      </div>
                    </div>
                  </div>

                  {/* Proof files */}
                  {(checkIn.startFiles.length > 0 || checkIn.endFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {[...checkIn.startFiles, ...checkIn.endFiles].map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-[4px] border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-white/60 hover:border-violet-500/30 hover:text-violet-400"
                        >
                          <Eye className="h-3 w-3" />
                          {file.name}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Peer reviews */}
                  {checkIn.verifications.length > 0 && (
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Peer Reviews</div>
                      {checkIn.verifications.map((v, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className={cn("mt-0.5", v.verdict === "APPROVE" ? "text-emerald-400" : "text-red-400")}>
                            {v.verdict === "APPROVE" ? "✓" : "✕"}
                          </span>
                          <span className="text-white/50">
                            <span className="font-medium text-white/70">{v.reviewer.name}</span>
                            {v.note && ` — ${v.note}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leader Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <form action={resolveFlaggedSubmission}>
                      <input type="hidden" name="checkInId" value={checkIn.id} />
                      <input type="hidden" name="groupId" value={leaderGroupId} />
                      <input type="hidden" name="finalVerdict" value="APPROVE" />
                      <input type="hidden" name="returnTo" value="/leader/proofs" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Approve
                      </Button>
                    </form>
                    <form action={resolveFlaggedSubmission}>
                      <input type="hidden" name="checkInId" value={checkIn.id} />
                      <input type="hidden" name="groupId" value={leaderGroupId} />
                      <input type="hidden" name="finalVerdict" value="REJECT" />
                      <input type="hidden" name="returnTo" value="/leader/proofs" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
