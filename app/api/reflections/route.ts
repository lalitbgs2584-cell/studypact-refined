import { ReflectionUnderstanding } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { submitDailyReflection } from "@/lib/tracker";

function resolveUnderstanding(value: unknown) {
  return Object.values(ReflectionUnderstanding).includes(value as ReflectionUnderstanding)
    ? (value as ReflectionUnderstanding)
    : ReflectionUnderstanding.PARTIALLY_UNDERSTOOD;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId || "").trim();
  const tomorrowPlan = String(body.tomorrowPlan || "").trim();
  const note = String(body.note || "").trim();
  const understanding = resolveUnderstanding(body.understanding);

  if (!groupId || !tomorrowPlan) {
    return NextResponse.json({ error: "groupId and tomorrowPlan are required" }, { status: 400 });
  }

  const reflection = await submitDailyReflection({
    userId: session.user.id,
    groupId,
    understanding,
    tomorrowPlan,
    note,
  });

  return NextResponse.json(reflection, { status: 201 });
}
