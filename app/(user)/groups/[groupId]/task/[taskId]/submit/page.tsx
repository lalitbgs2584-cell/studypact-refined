export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function SubmitProofPage({
  params,
}: {
  params: Promise<{ groupId: string; taskId: string }>;
}) {
  const { groupId, taskId } = await params;
  redirect(`/proof-work?groupId=${groupId}&taskId=${taskId}`);
}
