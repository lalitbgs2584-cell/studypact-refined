import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { submitVerification } from "@/lib/actions/verification";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function VerifyProofPage({ params }: { params: Promise<{ groupId: string; taskId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId, taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      user: { select: { name: true } },
      checkIn: {
        include: {
          startFiles: true,
          endFiles: true,
        },
      },
    },
  });

  if (!task || !task.checkIn) return <div className="p-8 text-white">No proof to verify.</div>;
  if (task.userId === session.user.id) redirect(`/groups/${groupId}/task/${taskId}`);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/groups/${groupId}/task/${taskId}`} className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Task
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Review Proof
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{task.title}</h1>
            <p className="text-white/60">Review {task.user.name}&apos;s submission and make a decision.</p>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/80">
              {task.checkIn.proofText || task.checkIn.reflection || "No summary provided."}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {task.checkIn.startFiles[0] ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={task.checkIn.startFiles[0].url} alt={task.checkIn.startFiles[0].name} className="h-44 w-full object-cover" />
                </div>
              ) : null}
              {task.checkIn.endFiles[0] ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={task.checkIn.endFiles[0].url} alt={task.checkIn.endFiles[0].name} className="h-44 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Your Verdict</CardTitle>
            <CardDescription className="text-white/50">Approve clean work or reject it with a note.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={submitVerification} className="space-y-4">
              <input type="hidden" name="groupId" value={groupId} />
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="checkInId" value={task.checkIn.id} />

              <div className="space-y-2">
                <Label htmlFor="note" className="text-white/80">
                  Feedback note
                </Label>
                <textarea
                  id="note"
                  name="note"
                  placeholder="Give constructive feedback..."
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button type="submit" name="verdict" value="APPROVE" className="flex-1 gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button type="submit" name="verdict" value="REJECT" variant="outline" className="flex-1 gap-2 text-red-200">
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
