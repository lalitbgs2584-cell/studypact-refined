export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { resolveSubmissionAsAdmin } from "@/lib/actions/admin";

async function fetchDisputed() {
  return db.checkIn.findMany({
    where: {
      OR: [
        { status: "DISPUTED" },
        { status: "FLAGGED", isDisputed: true },
        {
          status: "FLAGGED",
          verifications: {
            some: { verdict: "APPROVE" },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      tasks: { select: { id: true, title: true } },
      reviewedBy: { select: { name: true } },
      verifications: {
        select: {
          verdict: true,
          note: true,
          reviewer: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      startFiles: { select: { url: true, name: true } },
      endFiles: { select: { url: true, name: true } },
    },
    take: 50,
  });
}

export default async function AdminDisputesPage() {
  await requireAdminAccess();
  const disputes = await fetchDisputed();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-yellow-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Disputes Panel
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Disputed Submissions ({disputes.length})
          </h1>
          <p className="text-sm text-white/50">
            Submissions with conflicting peer reviews or high rejection rates awaiting final admin decision.
          </p>
        </CardContent>
      </Card>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-primary/30" />
            <div className="text-lg font-bold text-white/60">No disputes</div>
            <div className="text-sm text-white/40">All submissions are settled.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((checkIn) => {
            const approvals = checkIn.verifications.filter((v) => v.verdict === "APPROVE").length;
            const flags = checkIn.verifications.filter((v) => v.verdict !== "APPROVE").length;

            return (
              <Card key={checkIn.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{checkIn.user.name}</span>
                        <span className="text-xs text-white/40">in {checkIn.group.name}</span>
                        <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                          {checkIn.status}
                        </span>
                      </div>
                      {checkIn.tasks[0] && (
                        <div className="mt-1 text-sm text-white/60">
                          Task: <span className="text-white/80">{checkIn.tasks[0].title}</span>
                        </div>
                      )}
                      {checkIn.reflection && (
                        <div className="mt-2 max-w-xl rounded-[4px] bg-secondary/30 p-3 text-sm text-white/70">
                          {checkIn.reflection}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="rounded-[4px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-center">
                        <div className="text-lg font-bold text-emerald-400">{approvals}</div>
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400/60">Approvals</div>
                      </div>
                      <div className="rounded-[4px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-center">
                        <div className="text-lg font-bold text-red-400">{flags}</div>
                        <div className="text-[10px] uppercase tracking-wider text-red-400/60">Flags</div>
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
                          className="flex items-center gap-1.5 rounded-[4px] border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-white/60 hover:border-primary/30 hover:text-primary"
                        >
                          <Eye className="h-3 w-3" />
                          {file.name}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Vote timeline */}
                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                      Vote History
                    </div>
                    {checkIn.verifications.map((v, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className={cn("mt-0.5", v.verdict === "APPROVE" ? "text-emerald-400" : "text-red-400")}>
                          {v.verdict === "APPROVE" ? "✓" : "✕"}
                        </span>
                        <span className="text-white/50">
                          <span className="font-medium text-white/70">{v.reviewer.name}</span>
                          {v.note && ` — "${v.note}"`}
                          <span className="ml-2 text-white/30">
                            {v.createdAt.toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Admin Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <form action={resolveSubmissionAsAdmin}>
                      <input type="hidden" name="checkInId" value={checkIn.id} />
                      <input type="hidden" name="finalVerdict" value="APPROVE" />
                      <input type="hidden" name="note" value="Admin override: approved after dispute review." />
                      <input type="hidden" name="returnTo" value="/admin/disputes" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Override: Approve
                      </Button>
                    </form>
                    <form action={resolveSubmissionAsAdmin}>
                      <input type="hidden" name="checkInId" value={checkIn.id} />
                      <input type="hidden" name="finalVerdict" value="REJECT" />
                      <input type="hidden" name="note" value="Admin override: rejected after dispute review." />
                      <input type="hidden" name="returnTo" value="/admin/disputes" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                        <XCircle className="h-3 w-3" />
                        Override: Reject
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
