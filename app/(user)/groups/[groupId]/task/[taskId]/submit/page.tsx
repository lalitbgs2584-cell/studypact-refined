"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitProof } from "@/lib/actions/submission";
import { UploadDropzone } from "@/utils/uploadthing";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { use } from "react";

export default function SubmitProofPage({ params }: { params: Promise<{ groupId: string, taskId: string }> }) {
  const { groupId, taskId } = use(params);
  const [files, setFiles] = useState<{url: string, name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href={`/groups/${groupId}/task/${taskId}`} className="text-white/50 hover:text-white mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Task
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Submit Your Proof</h1>
        <p className="text-white/60 mt-1">Upload definitive proof for your peers to verify.</p>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-white">Upload & Reflect</CardTitle>
          <CardDescription className="text-white/50">
            You must upload at least one image or video and provide a summary of what you did.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            action={submitProof} 
            className="space-y-6"
            onSubmit={() => setIsSubmitting(true)}
          >
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="taskId" value={taskId} />
            
            {files.map((f, idx) => (
              <input key={idx} type="hidden" name={`fileUrl_${idx}`} value={f.url} />
            ))}

            <div className="space-y-3">
              <Label className="text-white/80">Proof Files</Label>
              {files.length > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center gap-2 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" /> {files.length} file(s) uploaded successfully!
                </div>
              )}
              <UploadDropzone
                endpoint="proofUpload"
                onClientUploadComplete={(res) => {
                  if (res) {
                    setFiles(prev => [...prev, ...res.map(r => ({ url: r.url, name: r.name }))]);
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
                className="ut-button:bg-primary ut-button:hover:bg-primary/90 ut-label:text-primary border-white/10 bg-black/60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reflection" className="text-white/80">Summary / Reflection</Label>
              <textarea 
                id="reflection" 
                name="reflection"
                placeholder="What did you learn? Any challenges?" 
                required
                className="w-full min-h-[120px] p-3 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/30 text-sm text-white"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={files.length === 0 || isSubmitting}
                className={`font-bold px-8 text-white ${files.length > 0 ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)]" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
              >
                {isSubmitting ? "SUBMITTING..." : "CONFIRM SUBMISSION"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
