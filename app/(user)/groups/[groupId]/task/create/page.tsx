import { redirect } from "next/navigation";

export default async function CreateTaskPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  await params;
  redirect(`/tasks`);
}
