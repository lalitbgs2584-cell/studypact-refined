import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitVerification } from "@/lib/actions/verification";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default async function VerifyProofPage({ params }: { params: Promise<{ groupId: string, taskId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { groupId, taskId } = await params;

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      user: true,
      checkIn: {
        include: {
          startFiles: true,
          endFiles: true,
        }
      }
    }
  });

  if (!task || !task.checkIn) return <div className="p-8 text-white">No proof to verify.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href={`/groups/${groupId}/task/${taskId}`} className="text-white/50 hover:text-white mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Task
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Verify Peer Submission</h1>
        <p className="text-white/60 mt-1">Review {task.user.name}&apos;s proof and make a decision.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-black/40 border-white/10 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white">Proof Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-white/90">{task.checkIn.reflection}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[...task.checkIn.startFiles, ...task.checkIn.endFiles].map((file, i) => (
                <div key={file.id} className="aspect-video bg-black/60 border border-white/10 rounded-lg flex items-center justify-center p-2">
                  {file.url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={file.url} className="max-w-full max-h-full object-contain" controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="Proof" className="max-w-full max-h-full object-cover rounded-md" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-primary/30 shadow-[0_0_30px_-15px_rgba(232,90,42,0.3)]">
        <CardHeader>
          <CardTitle className="text-white">Your Verdict</CardTitle>
          <CardDescription className="text-white/50">Does this meet the criteria of the pact?</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitVerification} className="space-y-6">
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="checkInId" value={task.checkIn.id} />

            <div className="space-y-2">
              <Label htmlFor="note" className="text-white/80">Feedback Note (Optional)</Label>
              <textarea 
                id="note" 
                name="note"
                placeholder="Give constructive feedback..." 
                className="w-full min-h-[80px] p-3 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/30 text-sm text-white"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                name="verdict" 
                value="APPROVE" 
                className="flex-1 font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                APPROVE
              </Button>
              <Button 
                type="submit" 
                name="verdict" 
                value="FLAG" 
                className="flex-1 font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                REJECT / FLAG
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
