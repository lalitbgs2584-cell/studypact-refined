import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createGroup } from "@/lib/actions/group";

export default function CreateGroupPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Form a New Pact</h1>
        <p className="text-white/60 mt-1">Create a group, invite peers, and commit to mastery.</p>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-white">Group Details</CardTitle>
          <CardDescription className="text-white/50">
            Set the rules and focus for your new accountability group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">Pact Name</Label>
              <Input 
                id="name" 
                name="name"
                placeholder="e.g. 100 Days of System Design" 
                required 
                className="bg-black/60 border-white/10 focus:border-primary placeholder:text-white/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/80">Description</Label>
              <textarea 
                id="description" 
                name="description"
                placeholder="What is the goal of this pact?" 
                className="w-full min-h-[100px] p-3 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/30 text-sm text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focusType" className="text-white/80">Focus Area</Label>
              <select 
                id="focusType" 
                name="focusType"
                className="w-full p-2.5 rounded-md bg-black/60 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm text-white appearance-none"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DSA">Data Structures & Algorithms</option>
                <option value="MACHINE_LEARNING">Machine Learning</option>
                <option value="GENERAL">General Study</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="font-bold px-8 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_var(--color-primary)]">
                CREATE PACT
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
