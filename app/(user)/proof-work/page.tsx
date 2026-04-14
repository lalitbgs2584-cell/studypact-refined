import { CheckCircle2, ShieldCheck, Sparkles, Upload } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProofWorkForm } from "@/components/proof-work-form";
import { submitProof } from "@/lib/actions/submission";
import { db } from "@/lib/db";
import { getPeerReviewMetrics, getPeerReviewThreshold } from "@/lib/peer-review";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";

export default async function ProofWorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ taskId?: string; assignmentQuestionId?: string }>;
}) {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const params = (await searchParams) ?? {};
  const groupId = activeGroupId ?? memberships[0]?.groupId ?? "";
  const totalEligibleReviewers = Math.max((activeGroup?.users.length ?? 0) - 1, 0);
  const quorumThreshold = getPeerReviewThreshold(totalEligibleReviewers);

  const taskTargets = groupId
    ? await db.task.findMany({
        where: { groupId, userId: session.user.id },
        include: {
          checkIn: true,
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const assignments = groupId
    ? await db.assignment.findMany({
        where: { groupId },
        include: {
          questions: {
            include: {
              checkIns: {
                where: { userId: session.user.id },
                include: {
                  startFiles: true,
                  endFiles: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const recentSubmissions = groupId
    ? await db.checkIn.findMany({
        where: { groupId, userId: session.user.id },
        include: {
          reviewedBy: { select: { name: true } },
          verifications: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          assignmentQuestion: {
            include: {
              assignment: { select: { title: true } },
            },
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

  const questionTargets = assignments.flatMap((assignment) =>
    assignment.questions.map((question) => ({
      id: question.id,
      label: `${assignment.title} - Q${question.order}`,
      hint: question.prompt,
    }))
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
                  ? `Everything here is scoped to ${activeGroup.name}. Choose a task or assignment question, upload both photos, and add a short summary.`
                  : "Join a group to start submitting proof of work."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40">
          <CardHeader>
            <CardTitle className="text-white">Why this page exists</CardTitle>
            <CardDescription className="text-white/50">The proof workflow is shared by tasks and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/60">
            <div className="flex items-start gap-3 rounded-[4px] border border-border bg-secondary/20 p-4">
              <Upload className="mt-0.5 h-4 w-4 text-primary" />
              <div>Every submission needs a before photo, an after photo, and a short reflection.</div>
            </div>
            <div className="flex items-start gap-3 rounded-[4px] border border-border bg-secondary/20 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>Peer votes close a submission once quorum is met, and rejected work comes back with a note.</div>
            </div>
            <div className="flex items-start gap-3 rounded-[4px] border border-border bg-secondary/20 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                {quorumThreshold} vote(s) are needed from {totalEligibleReviewers} eligible reviewers to close a proof in the active group.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Task Proof</CardTitle>
            <CardDescription className="text-white/50">Submit evidence for an active task in the current group.</CardDescription>
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
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No task targets available right now.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Assignment Proof</CardTitle>
            <CardDescription className="text-white/50">Submit evidence for a specific assignment question.</CardDescription>
          </CardHeader>
          <CardContent>
            {groupId && questionTargets.length > 0 ? (
              <ProofWorkForm
                action={submitProof}
                groupId={groupId}
                targetField="assignmentQuestionId"
                targets={questionTargets}
                defaultTargetId={params.assignmentQuestionId}
                title="Question submission"
                description="Each question needs its own before photo, after photo, and summary."
                submitLabel="Submit question proof"
              />
            ) : (
              <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No assignment questions yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

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
              const targetLabel = submission.assignmentQuestion
                ? `${submission.assignmentQuestion.assignment.title} - Q${submission.assignmentQuestion.order}`
                : submission.tasks[0]?.title ?? "Task proof";
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
                <div key={submission.id} className="rounded-[4px] border border-border bg-card/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{targetLabel}</div>
                      <div className="text-xs text-white/45">
                        Submitted {submission.createdAt.toLocaleString()} - {status}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", submissionBadgeClass(submission.status))}>
                        {reviewSummary}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {submission.reviewedBy?.name ? `Closed by ${submission.reviewedBy.name}` : metrics.totalVotes > 0 ? "Open for more votes" : "Awaiting quorum"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {submission.startFiles[0] ? (
                      <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={submission.startFiles[0].url} alt={submission.startFiles[0].name} className="h-40 w-full object-cover" />
                      </div>
                    ) : null}
                    {submission.endFiles[0] ? (
                      <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={submission.endFiles[0].url} alt={submission.endFiles[0].name} className="h-40 w-full object-cover" />
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



