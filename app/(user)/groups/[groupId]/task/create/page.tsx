import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createTask } from "@/lib/actions/task";

export default async function CreateTaskPage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { groupId } = await params;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Post a Task</h1>
        <p className="text-white/60 mt-1">Commit to a new task and share it with your pact.</p>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-white">Task Details</CardTitle>
          <CardDescription className="text-white/50">
            What will you accomplish today? Be specific so your peers can accurately verify it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTask} className="space-y-6">
            <input type="hidden" name="groupId" value={groupId} />
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white/80">Title</Label>
              <Input 
                id="title" 
                name="title"
                placeholder="e.g. Implement Prisma schema and User Auth" 
                required 
                className="bg-black/60 border-white/10 focus:border-primary placeholder:text-white/30 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details" className="text-white/80">Description Details</Label>
              <textarea 
                id="details" 
                name="details"
                placeholder="List the steps or definition of done..." 
                className="w-full min-h-[120px] p-3 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/30 text-sm text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white/80">Category</Label>
              <select 
                id="category" 
                name="category"
                className="w-full p-2.5 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm text-white appearance-none"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DSA">Data Structures & Algorithms</option>
                <option value="REVISION">Revision</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="font-bold px-8 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_var(--color-primary)]">
                POST TASK
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
