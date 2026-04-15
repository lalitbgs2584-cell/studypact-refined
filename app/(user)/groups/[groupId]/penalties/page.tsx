export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function PenaltiesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  redirect(`/groups/${groupId}`);
}
