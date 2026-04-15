export const dynamic = "force-dynamic";

﻿import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { submitVerification } from "@/lib/actions/verification";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPeerReviewMetrics } from "@/lib/peer-review";
import { cn } from "@/lib/utils";

export default async function VerifyProofPage({ params }: { params: Promise<{ groupId: string; taskId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId, taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      group: {
        include: {
          users: {
            select: { userId: true },
          },
        },
      },
      user: { select: { name: true } },
      checkIn: {
        include: {
          verifications: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          startFiles: true,
          endFiles: true,
        },
      },
    },
  });

  if (!task || !task.checkIn) return <div className="p-8 text-white">No proof to verify.</div>;

  const isMember = task.group.users.some((member) => member.userId === session.user.id);
  if (!isMember) redirect("/dashboard");
  if (task.userId === session.user.id) redirect(`/groups/${groupId}/task/${taskId}`);

  const totalEligibleReviewers = Math.max(task.group.users.length - 1, 0);
  const reviewMetrics = getPeerReviewMetrics(task.checkIn.verifications, totalEligibleReviewers);
  const canVote = task.checkIn.status !== "APPROVED" && task.checkIn.status !== "REJECTED";
  const myVote = task.checkIn.verifications.find((verification) => verification.reviewerId === session.user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/groups/${groupId}/task/${taskId}`} className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Task
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {canVote ? "Vote on Proof" : "Voting Closed"}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{task.title}</h1>
            <p className="text-white/60">Review {task.user.name}&apos;s submission and cast your peer vote.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Proof Details</CardTitle>
            <CardDescription className="text-white/50">Before / after evidence from the submitter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[4px] bg-secondary/30 p-4 text-white/80">{task.checkIn.proofText || task.checkIn.reflection || "No summary provided."}</div>
            <div className="grid gap-3 md:grid-cols-2">
              {task.checkIn.startFiles[0] ? (
                <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={task.checkIn.startFiles[0].url} alt={task.checkIn.startFiles[0].name} className="h-44 w-full object-cover" />
                </div>
              ) : null}
              {task.checkIn.endFiles[0] ? (
                <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={task.checkIn.endFiles[0].url} alt={task.checkIn.endFiles[0].name} className="h-44 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Current Tally</CardTitle>
            <CardDescription className="text-white/50">
              {canVote ? "Approve the work or flag it with a note." : "This proof has already reached a final decision."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[4px] bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Quorum</div>
              <div className="mt-1 font-semibold text-white">
                {reviewMetrics.approved
                  ? "Approved by quorum"
                  : reviewMetrics.rejected
                    ? "Rejected by quorum"
                    : reviewMetrics.totalVotes === 0
                      ? "Awaiting first vote"
                      : `${reviewMetrics.approvalVotes}/${reviewMetrics.threshold} approvals needed`}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {reviewMetrics.totalVotes === 0
                  ? `Need ${reviewMetrics.threshold} vote(s) from ${reviewMetrics.totalEligibleReviewers} eligible reviewers.`
                  : `${reviewMetrics.approvalVotes} approve, ${reviewMetrics.flagVotes} flag, ${reviewMetrics.approvalsRemaining} approval(s) left, ${reviewMetrics.flagsRemaining} flag(s) left.`}
              </div>
            </div>

            {task.checkIn.reviewNote ? (
              <div className="rounded-[4px] bg-primary/10 p-4 text-sm text-primary-foreground">Final note: {task.checkIn.reviewNote}</div>
            ) : null}

            {task.checkIn.verifications.length > 0 ? (
              <div className="space-y-2">
                {task.checkIn.verifications.map((verification) => (
                  <div key={verification.id} className="rounded-[4px] bg-secondary/25 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white">{verification.reviewer.name}</div>
                      <div className={cn("text-xs font-bold uppercase tracking-[0.2em]", verification.verdict === "APPROVE" ? "text-primary" : "text-accent")}>
                        {verification.verdict === "APPROVE" ? "Approve" : "Flag"}
                      </div>
                    </div>
                    {verification.note ? <div className="mt-2 text-sm text-white/60">{verification.note}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
                <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No votes yet.</div>
            )}

            {canVote ? (
              <form action={submitVerification} className="space-y-4 pt-2">
                <input type="hidden" name="groupId" value={groupId} />
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="checkInId" value={task.checkIn.id} />

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-white/80">
                    Vote note
                  </Label>
                  <textarea
                    id="note"
                    name="note"
                    placeholder="Give constructive feedback..."
                  className="min-h-24 w-full rounded-[4px] border border-border/50 bg-secondary/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                  />
                </div>

                {myVote ? (
                  <div className="rounded-[4px] bg-secondary/30 px-4 py-3 text-sm text-white/70">
                    Your current vote: {myVote.verdict === "APPROVE" ? "Approve" : "Flag"}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 md:flex-row">
                  <Button type="submit" name="verdict" value="APPROVE" className="flex-1 gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button type="submit" name="verdict" value="FLAG" variant="outline" className="flex-1 gap-2 text-accent">
                    <XCircle className="h-4 w-4" />
                    Flag
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
