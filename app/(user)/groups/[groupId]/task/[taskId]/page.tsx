import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, UploadCloud, CheckCircle } from "lucide-react";
import { RealtimeGroupSync } from "@/components/realtime-sync";

export default async function TaskDetailPage({ params }: { params: Promise<{ groupId: string, taskId: string }> }) {
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
          verifications: { include: { reviewer: true } }
        }
      }
    }
  });

  if (!task) return <div className="text-white p-8">Task not found.</div>;

  const isOwner = task.userId === session.user.id;
  const hasSubmitted = task.status !== "PENDING" && task.checkInId !== null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <RealtimeGroupSync groupId={groupId} />
      <Link href={`/groups/${groupId}`} className="text-white/50 hover:text-white mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Pact
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
              {task.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(task.day).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-3 mb-2">{task.title}</h1>
          <p className="text-white/60">Posted by {task.user.name}</p>
        </div>
        
        {isOwner && !hasSubmitted && (
          <Link href={`/groups/${groupId}/task/${task.id}/submit`}>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-2 px-6">
              <UploadCloud className="w-4 h-4" /> SUBMIT PROOF
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">Commitment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 whitespace-pre-wrap">{task.details || "No further details provided."}</p>
            </CardContent>
          </Card>

          {hasSubmitted && task.checkIn && (
            <Card className="bg-black/40 border-primary/20 shadow-[0_0_30px_-15px_rgba(232,90,42,0.5)]">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-primary flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Proof Submitted
                  </CardTitle>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase ${
                    task.checkIn.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                    task.checkIn.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {task.checkIn.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">Summary / Reflection</h4>
                  <p className="text-white/90">{task.checkIn.reflection}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {task.checkIn.startFiles.map((file, i) => (
                    <div key={file.id} className="aspect-video bg-black/60 border border-white/10 rounded-lg flex items-center justify-center p-2 relative group overflow-hidden">
                      {file.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={file.url} className="max-w-full max-h-full object-contain" controls />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.url} alt="Proof" className="max-w-full max-h-full object-cover rounded-md" />
                      )}
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-[10px] text-white/70 rounded font-mono">UPLOAD #{i + 1}</div>
                    </div>
                  ))}
                  {task.checkIn.endFiles.map((file, i) => (
                    <div key={file.id} className="aspect-video bg-black/60 border border-white/10 rounded-lg flex items-center justify-center p-2 relative group overflow-hidden">
                      {file.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={file.url} className="max-w-full max-h-full object-contain" controls />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.url} alt="Proof" className="max-w-full max-h-full object-cover rounded-md" />
                      )}
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-[10px] text-white/70 rounded font-mono">UPLOAD #{task.checkIn!.startFiles.length + i + 1}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="space-y-6">
          {hasSubmitted && task.checkIn && (
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Peer Verification</CardTitle>
                <CardDescription className="text-white/50">
                  Reviews from your pact members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.checkIn.verifications.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">No reviews yet.</p>
                ) : (
                  task.checkIn.verifications.map(v => (
                    <div key={v.id} className="bg-black/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                          {v.reviewer.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-white/80">{v.reviewer.name}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${v.verdict === 'APPROVE' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {v.verdict}
                      </span>
                    </div>
                  ))
                )}

                {/* Only show "Verify" button to OTHER members in the group if status is not APPROVED/REJECTED */}
                {!isOwner && task.checkIn.status === "PENDING" && !task.checkIn.verifications.find(v => v.reviewerId === session.user.id) && (
                  <div className="pt-4 border-t border-white/10">
                    <Link href={`/groups/${groupId}/task/${task.id}/verify`}>
                      <Button className="w-full font-bold btn-primary">REVIEW & VERIFY</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
