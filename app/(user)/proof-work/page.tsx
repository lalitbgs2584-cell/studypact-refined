export const dynamic = "force-dynamic";

import { CheckCircle2, ShieldCheck, Sparkles, Upload } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProofWorkForm } from "@/components/proof-work-form";
import { submitProof } from "@/lib/actions/submission";
import { db } from "@/lib/db";
import { getPeerReviewMetrics, getPeerReviewThreshold } from "@/lib/peer-review";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";
import type { Prisma } from "@prisma/client";

type TaskTarget = Prisma.TaskGetPayload<{
  include: {
    checkIn: true;
  };
}>;

type CheckInRow = Prisma.CheckInGetPayload<{
  include: {
    reviewedBy: { select: { name: true } };
    verifications: {
      include: {
        reviewer: { select: { name: true } };
      };
    };
    tasks: { select: { id: true; title: true } };
    startFiles: true;
    endFiles: true;
  };
}>;

export default async function ProofWorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ taskId?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const groupId = activeGroupId ?? memberships[0]?.groupId ?? "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalEligibleReviewers = Math.max((activeGroup?.users.length ?? 0) - 1, 0);
  const quorumThreshold = getPeerReviewThreshold(totalEligibleReviewers);

  const taskTargets: TaskTarget[] = groupId
    ? await db.task.findMany({
        where: {
          groupId,
          userId: session.user.id,
        },
        include: {
          checkIn: true,
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const recentSubmissions: CheckInRow[] = groupId
    ? await db.checkIn.findMany({
        where: { groupId, userId: session.user.id, assignmentQuestionId: null },
        include: {
          reviewedBy: { select: { name: true } },
          verifications: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          tasks: { select: { id: true, title: true } },
          startFiles: true,
          endFiles: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];

  const taskFormTargets = taskTargets.map((task) => ({
    id: task.id,
    label: task.title,
    hint:
      task.checkIn?.status === "REJECTED"
        ? "Rejected. Resubmit with fresh proof."
        : task.checkIn?.status === "APPROVED"
          ? "Completed. This task is already verified."
          : task.checkIn?.status === "PENDING" || task.checkIn?.status === "FLAGGED"
            ? "Already submitted. Votes are still in progress."
            : "Upload before and after proof to finish this task.",
  }));

  const submissionBadgeClass = (status: string) => {
    if (status === "APPROVED") return "badge-active";
    if (status === "REJECTED" || status === "FLAGGED") return "badge-risk";
    return "badge-muted";
  };

  return (
    <div className="mx-auto max-w-6xl min-h-0 space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Proof of Work
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Submit before-and-after evidence</h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `Submit proof for group tasks in ${activeGroup.name}. Upload both photos and add a short summary.`
                  : "Join a group to start submitting proof of work."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40">
          <CardHeader>
            <CardTitle className="text-white">How it works</CardTitle>
            <CardDescription className="text-white/50">Group tasks require proof submission for completion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/60">
            <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-[4px] border border-border bg-secondary/20 p-4">
              <Upload className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0">Every submission needs a before photo, an after photo, and a short reflection.</div>
            </div>
            <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-[4px] border border-border bg-secondary/20 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0">Peer votes close a submission once quorum is met, and rejected work comes back with a note.</div>
            </div>
            <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-[4px] border border-border bg-secondary/20 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0">
                {quorumThreshold} vote(s) are needed from {totalEligibleReviewers} eligible reviewers to close a proof in the active group.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Submit Task Proof</CardTitle>
          <CardDescription className="text-white/50">Submit evidence for an active group task.</CardDescription>
        </CardHeader>
        <CardContent>
          {groupId && taskFormTargets.length > 0 ? (
            <ProofWorkForm
              action={submitProof}
              groupId={groupId}
              targetField="taskId"
              targets={taskFormTargets}
              defaultTargetId={params.taskId}
              title="Task submission"
              description="Pick a task, upload both photos, and summarize the work."
              submitLabel="Submit task proof"
            />
          ) : (
            <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No group tasks available right now.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Recent Submissions</CardTitle>
          <CardDescription className="text-white/50">Your latest uploads in the active group context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentSubmissions.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No proof submitted yet.</div>
          ) : (
            recentSubmissions.map((submission) => {
              const metrics = getPeerReviewMetrics(submission.verifications, totalEligibleReviewers);
              const targetLabel = submission.tasks[0]?.title ?? "Task proof";
              const status =
                submission.status === "APPROVED"
                  ? "Verified"
                  : submission.status === "REJECTED"
                    ? "Rejected"
                    : submission.status === "FLAGGED"
                      ? "Flagged"
                      : "Pending review";
              const reviewSummary = metrics.approved
                ? `Approved by quorum (${metrics.approvalVotes}/${metrics.threshold})`
                : metrics.rejected
                  ? `Rejected by quorum (${metrics.flagVotes}/${metrics.threshold})`
                  : metrics.totalVotes > 0
                    ? `${metrics.approvalVotes} approvals, ${metrics.flagVotes} flags`
                    : "Awaiting votes";

              return (
                <div key={submission.id} className="min-w-0 overflow-hidden rounded-[4px] border border-border bg-card/70 p-4">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{targetLabel}</div>
                      <div className="text-xs text-white/45">
                        Submitted {submission.createdAt.toLocaleString()} - {status}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-end gap-1 text-right">
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", submissionBadgeClass(submission.status))}>
                        {reviewSummary}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {submission.reviewedBy?.name ? `Closed by ${submission.reviewedBy.name}` : metrics.totalVotes > 0 ? "Open for more votes" : "Awaiting quorum"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {submission.startFiles[0] ? (
                      <div className="min-w-0 overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={submission.startFiles[0].url} alt={submission.startFiles[0].name} className="max-w-full h-auto max-h-56 w-full object-contain" />
                      </div>
                    ) : null}
                    {submission.endFiles[0] ? (
                      <div className="min-w-0 overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={submission.endFiles[0].url} alt={submission.endFiles[0].name} className="max-w-full h-auto max-h-56 w-full object-contain" />
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-[4px] bg-secondary/30 p-4 text-sm text-white/70">
                    {submission.proofText || submission.reflection || "No summary provided."}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.verifications.map((verification) => (
                      <span
                        key={`${submission.id}-${verification.reviewer.name}-${verification.verdict}`}
                        className={cn("rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", verification.verdict === "APPROVE" ? "badge-active" : "badge-risk")}
                      >
                        {verification.reviewer.name} - {verification.verdict === "APPROVE" ? "Approve" : "Flag"}
                      </span>
                    ))}
                  </div>
                  {submission.reviewNote ? (
                    <div className={cn("mt-3 rounded-[4px] p-3 text-sm", submission.status === "APPROVED" ? "bg-primary/10 text-primary-foreground" : "bg-accent/10 text-accent")}>
                      {submission.reviewNote}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
