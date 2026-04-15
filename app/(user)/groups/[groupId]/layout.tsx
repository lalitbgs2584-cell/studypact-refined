export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { GroupTabs } from "@/components/group-tabs";

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
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4">
        <GroupTabs groupId={groupId} isLeader={membership?.role === "admin"} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        {children}
      </div>
    </div>
  );
}
