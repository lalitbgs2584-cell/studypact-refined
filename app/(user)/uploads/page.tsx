import Link from "next/link";
import { ArrowRight, CheckCircle2, Upload, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitVerification } from "@/lib/actions/verification";
import { db } from "@/lib/db";
import { getPeerReviewMetrics, getPeerReviewThreshold } from "@/lib/peer-review";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession, type Membership } from "@/lib/workspace";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default async function UploadsPage() {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const groupId = activeGroupId ?? memberships[0]?.groupId ?? "";
  const membership: Membership | undefined = memberships.find((item) => item.groupId === groupId);
  const totalEligibleReviewers = Math.max((activeGroup?.users.length ?? 0) - 1, 0);
  const quorumThreshold = getPeerReviewThreshold(totalEligibleReviewers);

  const uploads = groupId
    ? await db.checkIn.findMany({
        where: { groupId },
        include: {
          user: { select: { id: true, name: true, image: true } },
          reviewedBy: { select: { name: true } },
          verifications: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          tasks: { select: { id: true, title: true } },
          assignmentQuestion: {
            include: {
              assignment: { select: { title: true } },
            },
          },
          startFiles: true,
          endFiles: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const myUploads = uploads.filter((upload) => upload.userId === session.user.id).length;
  const pendingUploads = uploads.filter((upload) => upload.status === "PENDING" || upload.status === "FLAGGED").length;
  const rejectedUploads = uploads.filter((upload) => upload.status === "REJECTED").length;

  const uploadBadgeClass = (status: string) => {
    if (status === "APPROVED") return "badge-active";
    if (status === "REJECTED" || status === "FLAGGED") return "badge-risk";
    return "badge-muted";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Upload className="h-3.5 w-3.5" />
              Uploads
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Review hub for proof submissions</h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `Everyone in ${activeGroup.name} can vote on uploads. Quorum closes submissions automatically once enough peers agree.`
                  : "Join a group to review uploads and proof submissions."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40">
          <CardHeader>
            <CardTitle className="text-white">Current summary</CardTitle>
            <CardDescription className="text-white/50">The active group review queue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">My uploads</div>
              <div className="mt-1 text-2xl font-black text-primary">{myUploads}</div>
            </div>
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Pending</div>
              <div className="mt-1 text-2xl font-black text-primary">{pendingUploads}</div>
            </div>
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Rejected</div>
              <div className="mt-1 text-2xl font-black text-primary">{rejectedUploads}</div>
            </div>
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Quorum</div>
              <div className="mt-1 text-2xl font-black text-primary">{quorumThreshold}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/40">of {totalEligibleReviewers} eligible voters</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Submission Queue</CardTitle>
          <CardDescription className="text-white/50">Uploads from you and other members in the active group context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploads.length === 0 ? (
          <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No uploads yet.</div>
          ) : (
            uploads.map((upload) => {
              const metrics = getPeerReviewMetrics(upload.verifications, totalEligibleReviewers);
              const currentVote = upload.verifications.find((verification) => verification.reviewerId === session.user.id);
              const targetLabel = upload.assignmentQuestion
                ? `${upload.assignmentQuestion.assignment.title} - Q${upload.assignmentQuestion.order}`
                : upload.tasks[0]?.title ?? "Task proof";
              const statusLabel =
                upload.status === "APPROVED"
                  ? "Verified"
                  : upload.status === "REJECTED"
                    ? "Rejected"
                    : upload.status === "FLAGGED"
                      ? "Flagged"
                      : "Pending";
              const reviewSummary = metrics.approved
                ? `Approved by quorum (${metrics.approvalVotes}/${metrics.threshold})`
                : metrics.rejected
                  ? `Rejected by quorum (${metrics.flagVotes}/${metrics.threshold})`
                  : metrics.totalVotes > 0
                    ? `${metrics.approvalVotes} approvals, ${metrics.flagVotes} flags`
                    : "Awaiting votes";
              const canVote = Boolean(membership) && upload.userId !== session.user.id && upload.status !== "APPROVED" && upload.status !== "REJECTED";

              return (
                <div
                  key={upload.id}
                  className={cn(
                    "rounded-[4px] border border-border p-4",
                    upload.userId === session.user.id ? "card-accent-primary bg-primary/10" : "bg-card/70"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{targetLabel}</div>
                      <div className="text-xs text-white/45">
                        {upload.user.name} - {upload.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", uploadBadgeClass(upload.status))}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {upload.startFiles[0] ? (
                      <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upload.startFiles[0].url} alt={upload.startFiles[0].name} className="h-44 w-full object-cover" />
                      </div>
                    ) : null}
                    {upload.endFiles[0] ? (
                      <div className="overflow-hidden rounded-[4px] bg-secondary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upload.endFiles[0].url} alt={upload.endFiles[0].name} className="h-44 w-full object-cover" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[4px] border border-border bg-secondary/20 p-4 text-sm text-white/70">{upload.proofText || "No summary provided."}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                    <span>{reviewSummary}</span>
                    <span className="text-white/20">|</span>
                    <span>{metrics.approvalsRemaining} approval(s) left to close</span>
                    <span className="text-white/20">|</span>
                    <span>{metrics.flagsRemaining} flag(s) left to close</span>
                  </div>

                  {upload.verifications.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {upload.verifications.map((verification) => (
                        <span
                          key={`${upload.id}-${verification.reviewerId}`}
                          className={cn(
                            "rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                            verification.verdict === "APPROVE" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          )}
                        >
                          {verification.reviewer.name} - {verification.verdict === "APPROVE" ? "Approve" : "Flag"}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {upload.reviewNote ? (
                    <div
                      className={cn(
                        "mt-3 rounded-[4px] p-3 text-sm",
                        upload.status === "APPROVED"
                          ? "bg-primary/10 text-primary-foreground"
                          : upload.status === "REJECTED"
                            ? "bg-accent/10 text-accent"
                            : "bg-[#1A1A2E] text-[#AAAAAA]"
                      )}
                    >
                      {upload.status === "APPROVED" ? "Final note: " : upload.status === "REJECTED" ? "Rejection note: " : "Review note: "}
                      {upload.reviewNote}
                    </div>
                  ) : null}

                  {upload.userId === session.user.id && upload.status === "REJECTED" ? (
                    <div className="mt-3">
                      <Link
                        href={upload.assignmentQuestion ? `/proof-work?assignmentQuestionId=${upload.assignmentQuestion.id}` : `/proof-work?taskId=${upload.tasks[0]?.id ?? ""}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                      >
                        Re-upload corrected proof
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : null}

                  {canVote ? (
                    <form action={submitVerification} className="mt-4 space-y-3">
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="checkInId" value={upload.id} />
                      <input type="hidden" name="taskId" value={upload.tasks[0]?.id ?? ""} />
                      <div className="space-y-2">
                        <Label htmlFor={`note-${upload.id}`}>Vote note</Label>
                        <Textarea
                          id={`note-${upload.id}`}
                          name="note"
                          placeholder="Add a short explanation for your vote"
                          className="min-h-20"
                        />
                      </div>
                      {currentVote ? (
                        <div className="rounded-[4px] bg-secondary/30 px-4 py-3 text-sm text-white/70">
                          Your current vote: {currentVote.verdict === "APPROVE" ? "Approve" : "Flag"}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" name="verdict" value="APPROVE" className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button type="submit" name="verdict" value="FLAG" variant="outline" className="gap-2 border-accent/40 text-accent hover:bg-accent/10">
                          <XCircle className="h-4 w-4" />
                          Flag
                        </Button>
                      </div>
                    </form>
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

