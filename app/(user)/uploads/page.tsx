import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert, Upload, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { submitVerification } from "@/lib/actions/verification";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession } from "@/lib/workspace";

export default async function UploadsPage() {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const groupId = activeGroupId ?? memberships[0]?.groupId ?? "";
  const membership = memberships.find((item) => item.groupId === groupId);
  const isLeader = membership?.role === "admin";

  const uploads = groupId
    ? await db.checkIn.findMany({
        where: { groupId },
        include: {
          user: { select: { id: true, name: true, image: true } },
          reviewedBy: { select: { name: true } },
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
  const pendingUploads = uploads.filter((upload) => upload.status === "PENDING").length;
  const rejectedUploads = uploads.filter((upload) => upload.status === "REJECTED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Upload className="h-3.5 w-3.5" />
              Uploads
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Review hub for proof submissions
              </h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `Everyone in ${activeGroup.name} can see uploads here. Leaders can approve or reject items without leaving the page.`
                  : "Join a group to review uploads and proof submissions."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Current summary</CardTitle>
            <CardDescription className="text-white/50">The active group review queue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">My uploads</div>
              <div className="mt-1 text-2xl font-black text-white">{myUploads}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Pending</div>
              <div className="mt-1 text-2xl font-black text-white">{pendingUploads}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Rejected</div>
              <div className="mt-1 text-2xl font-black text-white">{rejectedUploads}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Role</div>
              <div className="mt-1 text-2xl font-black text-white">{isLeader ? "Leader" : "Member"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Submission Queue</CardTitle>
          <CardDescription className="text-white/50">
            Uploads from you and other members in the active group context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-white/45">
              No uploads yet.
            </div>
          ) : (
            uploads.map((upload) => {
              const targetLabel = upload.assignmentQuestion
                ? `${upload.assignmentQuestion.assignment.title} · Q${upload.assignmentQuestion.order}`
                : upload.tasks[0]?.title ?? "Task proof";
              const status =
                upload.status === "APPROVED"
                  ? "Verified"
                  : upload.status === "REJECTED"
                    ? "Rejected"
                    : "Pending";

              return (
                <div
                  key={upload.id}
                  className={cn(
                    "rounded-3xl border p-4",
                    upload.userId === session.user.id ? "border-primary/20 bg-primary/5" : "border-white/10 bg-black/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{targetLabel}</div>
                      <div className="text-xs text-white/45">
                        {upload.user.name} · {upload.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                      {status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {upload.startFiles[0] ? (
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upload.startFiles[0].url} alt={upload.startFiles[0].name} className="h-44 w-full object-cover" />
                      </div>
                    ) : null}
                    {upload.endFiles[0] ? (
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upload.endFiles[0].url} alt={upload.endFiles[0].name} className="h-44 w-full object-cover" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                    {upload.proofText || "No summary provided."}
                  </div>

                  {upload.status === "REJECTED" && upload.reviewNote ? (
                    <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                      Rejection note: {upload.reviewNote}
                    </div>
                  ) : null}

                  {upload.userId === session.user.id && upload.status === "REJECTED" ? (
                    <div className="mt-3">
                      <Link
                        href={
                          upload.assignmentQuestion
                            ? `/proof-work?assignmentQuestionId=${upload.assignmentQuestion.id}`
                            : `/proof-work?taskId=${upload.tasks[0]?.id ?? ""}`
                        }
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                      >
                        Re-upload corrected proof
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : null}

                  {isLeader && upload.userId !== session.user.id ? (
                    <form action={submitVerification} className="mt-4 space-y-3">
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="checkInId" value={upload.id} />
                      <input type="hidden" name="taskId" value={upload.tasks[0]?.id ?? ""} />
                      <div className="space-y-2">
                        <Label htmlFor={`note-${upload.id}`} className="text-white/80">
                          Review note
                        </Label>
                        <textarea
                          id={`note-${upload.id}`}
                          name="note"
                          placeholder="Add a short explanation for your decision"
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" name="verdict" value="APPROVE" className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Verify
                        </Button>
                        <Button type="submit" name="verdict" value="REJECT" variant="outline" className="gap-2 text-red-200">
                          <XCircle className="h-4 w-4" />
                          Reject
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
