import Link from "next/link";
import { Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAssignment } from "@/lib/actions/assignment";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getWorkspace, requireSession, type Membership } from "@/lib/workspace";

type Assignment = Awaited<ReturnType<typeof fetchAssignments>>[number];
type Question = Assignment["questions"][number];
type CheckIn = Question["checkIns"][number];

async function fetchAssignments(groupId: string) {
  return db.assignment.findMany({
    where: { groupId },
    include: {
      createdBy: { select: { name: true } },
      questions: {
        include: {
          checkIns: {
            include: {
              user: { select: { id: true, name: true } },
              startFiles: true,
              endFiles: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AssignmentsPage() {
  const session = await requireSession();
  const { memberships, activeGroupId, activeGroup } = await getWorkspace(session.user.id);
  const groupId = activeGroupId ?? memberships[0]?.groupId ?? "";
  const membership: Membership | undefined = memberships.find((item: Membership) => item.groupId === groupId);
  const isLeader = membership?.role === "admin";

  const assignments: Assignment[] = groupId ? await fetchAssignments(groupId) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Assignments
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Assignment work packages</h1>
              <p className="max-w-2xl text-white/60">
                {activeGroup
                  ? `Assignments in ${activeGroup.name} are broken into questions, and each question needs its own proof submission.`
                  : "Join a group to create or complete assignments."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40">
          <CardHeader>
            <CardTitle className="text-white">Your role</CardTitle>
            <CardDescription className="text-white/50">Leader tools appear only when you can create assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/60">
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Status</div>
              <div className="mt-1 text-xl font-black text-white">{isLeader ? "Leader" : "Member"}</div>
            </div>
            <div className="rounded-[4px] border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Assignments</div>
              <div className="mt-1 text-xl font-black text-primary">{assignments.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLeader ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Create Assignment</CardTitle>
            <CardDescription className="text-white/50">Build a multi-question work package for the active group.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAssignment} className="space-y-5">
              <input type="hidden" name="groupId" value={groupId} />

              <div className="space-y-2">
                <Label htmlFor="assignment-title">Title</Label>
                <Input id="assignment-title" name="title" placeholder="Assignment title" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-details">Details</Label>
                <Textarea id="assignment-details" name="details" placeholder="Describe the assignment and expected output." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-due">Due date</Label>
                <Input id="assignment-due" name="dueAt" type="datetime-local" />
              </div>

              <div className="space-y-3">
                <Label>Questions</Label>
                <div className="grid gap-3">
                  {[1, 2, 3, 4, 5].map((questionNumber) => (
                    <Textarea key={questionNumber} name="questions" placeholder={`Question ${questionNumber}`} className="min-h-20" />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#6A7888" }}>Fill at least one question. Extra blank rows are ignored.</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  <Target className="h-4 w-4" />
                  Create Assignment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Assignment Queue</CardTitle>
          <CardDescription className="text-white/50">Track progress question by question and jump straight to proof submission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <div className="rounded-[4px] bg-secondary/30 p-8 text-center text-white/45">No assignments yet.</div>
          ) : (
            assignments.map((assignment: Assignment) => {
              const completedQuestions = assignment.questions.filter((question: Question) =>
                question.checkIns.some((checkIn: CheckIn) => checkIn.userId === session.user.id)
              ).length;
              const progress = assignment.questions.length === 0 ? 0 : Math.round((completedQuestions / assignment.questions.length) * 100);
              const submissionBadgeClass = (status: string) =>
                status === "APPROVED" ? "badge-active" : status === "REJECTED" || status === "FLAGGED" ? "badge-risk" : "badge-muted";

              return (
                <div key={assignment.id} className="rounded-lg border border-border bg-card/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{assignment.title}</div>
                      <div className="text-xs text-white/45">
                        Created by {assignment.createdBy.name}
                        {assignment.dueAt ? ` - due ${assignment.dueAt.toLocaleString()}` : ""}
                      </div>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.2em] text-primary">{progress}%</div>
                  </div>

                  {assignment.details ? <p className="mt-3 text-sm text-white/60">{assignment.details}</p> : null}

                  <div className="progress-track mt-4 overflow-hidden">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {assignment.questions.map((question: Question) => {
                      const mySubmission = question.checkIns.find((checkIn: CheckIn) => checkIn.userId === session.user.id);
                      const submissionStatus = mySubmission ? mySubmission.status : "Not Started";

                      return (
                        <div key={question.id} className="rounded-[4px] border border-border bg-secondary/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-white">Question {question.order}</div>
                              <div className="mt-1 text-sm text-white/60">{question.prompt}</div>
                            </div>
                            <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", submissionBadgeClass(submissionStatus))}>
                              {submissionStatus}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Link href={`/proof-work?assignmentQuestionId=${question.id}`}>
                              <Button variant="outline" size="sm">
                                Submit proof
                              </Button>
                            </Link>
                            <div className="text-xs text-primary">{question.checkIns.length} submission(s)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}