import { redirect } from "next/navigation";
import { requireSession, getWorkspace } from "@/lib/workspace";

export default async function GlobalLeaderboardPage() {
  const session = await requireSession();
  const { activeGroupId, memberships } = await getWorkspace(session.user.id);
  
  const groupId = activeGroupId ?? memberships[0]?.groupId;
  
  if (!groupId) {
    redirect("/dashboard");
  }
  
  redirect(`/groups/${groupId}/leaderboard`);
}
