"use server";

import { ReflectionUnderstanding } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { submitDailyReflection } from "@/lib/tracker";

function resolveUnderstanding(value: string | null | undefined) {
  return Object.values(ReflectionUnderstanding).includes(value as ReflectionUnderstanding)
    ? (value as ReflectionUnderstanding)
    : ReflectionUnderstanding.PARTIALLY_UNDERSTOOD;
}

export async function saveDailyReflection(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const groupId = ((formData.get("groupId") as string) || "").trim();
  const tomorrowPlan = ((formData.get("tomorrowPlan") as string) || "").trim();
  const note = ((formData.get("note") as string) || "").trim();
  const understanding = resolveUnderstanding(formData.get("understanding") as string);

  if (!groupId) redirect("/tracker?error=Group+context+required");
  if (!tomorrowPlan) redirect("/tracker?error=Tomorrow+plan+is+required");

  try {
    await submitDailyReflection({
      userId: session.user.id,
      groupId,
      understanding,
      tomorrowPlan,
      note,
    });

    revalidatePath("/tracker");
    revalidatePath("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save reflection";
    redirect(`/tracker?error=${encodeURIComponent(message)}`);
  }
}
