"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayDsaMission, startDsaJourneyForUser } from "@/lib/dsa";

export async function startAdminDsaJourney() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (actor?.role !== "admin") {
    redirect("/dashboard");
  }

  await startDsaJourneyForUser(session.user.id);
  await getTodayDsaMission(session.user.id);

  revalidatePath("/admin");
  revalidatePath("/admin/dsa");

  redirect("/admin?success=DSA+journey+started");
}
