export const dynamic = "force-dynamic";

﻿import Link from "next/link";
import { ArrowLeft, Clock3, ShieldCheck, Upload } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeGroupSync } from "@/components/realtime-sync";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPeerReviewMetrics } from "@/lib/peer-review";
import { cn } from "@/lib/utils";

export default async function TaskDetailPage({ params }: { params: Promise<{ groupId: string; taskId: string }> }) {
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
          reviewedBy: { select: { name: true } },
          startFiles: true,
          endFiles: true,
          verifications: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!task) return <div className="p-8 text-white">Task not found.</div>;

  const isOwner = task.userId === session.user.id;
  const isMember = task.group.users.some((member) => member.userId === session.user.id);
  if (!isMember) redirect("/dashboard");

  const totalEligibleReviewers = Math.max(task.group.users.length - 1, 0);
  const reviewMetrics = getPeerReviewMetrics(task.checkIn?.verifications ?? [], totalEligibleReviewers);
  const hasSubmission = Boolean(task.checkIn);
  const statusLabel =
    task.status === "COMPLETED"
      ? "Completed"
      : task.status === "IN_PROGRESS"
        ? "In progress"
        : task.status === "MISSED"
          ? "Missed"
          : "Not started";
  const canVote = !isOwner && Boolean(task.checkIn) && task.checkIn?.status !== "APPROVED" && task.checkIn?.status !== "REJECTED";
  const myVote = task.checkIn?.verifications.find((verification) => verification.reviewerId === session.user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <RealtimeGroupSync groupId={groupId} />

      <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Group
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Clock3 className="h-3.5 w-3.5" />
              Task Detail
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{task.title}</h1>
              <p className="max-w-2xl text-white/60">{task.details || "No further details provided."}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-[4px] bg-secondary/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">{task.category}</span>
              <span className="rounded-[4px] bg-secondary/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Priority: {task.priority}</span>
              <span className="rounded-[4px] bg-secondary/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">{statusLabel}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwner && !hasSubmission ? (
                <Link href={`/proof-work?taskId=${task.id}`}>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Submit Proof
                  </Button>
                </Link>
              ) : null}
              {canVote ? (
                <Link href={`/groups/${groupId}/task/${task.id}/verify`}>
                  <Button variant="outline" className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {myVote ? "Update vote" : "Vote on Proof"}
                  </Button>
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Task Snapshot</CardTitle>
            <CardDescription className="text-white/50">Quick read on the current submission state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[4px] bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Posted by</div>
              <div className="mt-1 font-semibold text-white">{task.user.name}</div>
            </div>
            <div className="rounded-[4px] bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Submission</div>
              <div className="mt-1 font-semibold text-white">
                {task.checkIn
                  ? task.checkIn.status === "APPROVED"
                    ? "Verified"
                    : task.checkIn.status === "REJECTED"
                      ? "Rejected"
                      : task.checkIn.status === "FLAGGED"
                        ? "Flagged"
                        : "Pending review"
                  : "No proof yet"}
              </div>
            </div>
            <div className="rounded-[4px] bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Peer quorum</div>
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
            {task.dueAt ? (
            <div className="rounded-[4px] bg-secondary/30 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Due date</div>
                <div className="mt-1 font-semibold text-white">{new Date(task.dueAt).toLocaleString()}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {task.checkIn ? (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Proof Submitted</CardTitle>
              <CardDescription className="text-white/50">
                {task.checkIn.status === "APPROVED"
                  ? "This proof has been verified."
                  : task.checkIn.status === "REJECTED"
                    ? "This proof needs another pass."
                    : task.checkIn.status === "FLAGGED"
                      ? "This proof is under peer review."
                      : "Waiting on review."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[4px] bg-secondary/30 p-4 text-white/80">
                {task.checkIn.proofText || task.checkIn.reflection || "No summary provided."}
              </div>
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
              {task.checkIn.reviewNote ? (
                <div className="rounded-[4px] bg-primary/10 p-3 text-sm text-primary-foreground">
                  Review note: {task.checkIn.reviewNote}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Peer Votes</CardTitle>
              <CardDescription className="text-white/50">Voting history for this proof.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.checkIn.verifications.length === 0 ? (
                <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No reviews yet.</div>
              ) : (
                task.checkIn.verifications.map((verification) => (
                  <div key={verification.id} className="rounded-[4px] bg-secondary/25 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white">{verification.reviewer.name}</div>
                      <div className={cn("text-xs font-bold uppercase tracking-[0.2em]", verification.verdict === "APPROVE" ? "text-primary" : "text-accent")}>
                        {verification.verdict === "APPROVE" ? "Approve" : "Flag"}
                      </div>
                    </div>
                    {verification.note ? <div className="mt-2 text-sm text-white/60">{verification.note}</div> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

