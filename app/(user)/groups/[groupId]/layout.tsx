import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, LayoutDashboard, Target, Users, Settings, Trophy, ShieldAlert } from "lucide-react";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { groupId } = await params;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      users: true
    }
  });

  if (!group) return <div className="text-white p-8">Group not found</div>;

  const membership = group.users.find(u => u.userId === session.user.id);
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Pact Inner Navbar */}
      <div className="bg-black/40 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
            <Link href={`/groups/${groupId}`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" /> Feed
            </Link>
            <Link href={`/groups/${groupId}/leaderboard`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors whitespace-nowrap">
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            <Link href={`/groups/${groupId}/penalties`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors whitespace-nowrap">
              <ShieldAlert className="w-4 h-4" /> Penalties
            </Link>
            {membership?.role === "admin" && (
              <Link href={`/groups/${groupId}/settings`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors whitespace-nowrap">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6">
        {children}
      </div>
    </div>
  );
}
