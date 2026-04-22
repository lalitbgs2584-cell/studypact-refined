import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayDsaMission, updateTodayDsaMission } from "@/lib/dsa";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (actor?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden \u2014 DSA mission is admin-only" }, { status: 403 });
  }

  const mission = await getTodayDsaMission(session.user.id);
  return NextResponse.json(mission);
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (actor?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden \u2014 DSA mission is admin-only" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { problemId?: number; outcome?: "FAILED" | "HARD" | "SOLVED" }
    | null;

  if (!body || typeof body.problemId !== "number" || !body.outcome) {
    return NextResponse.json({ error: "problemId and outcome are required" }, { status: 400 });
  }

  try {
    const mission = await updateTodayDsaMission(session.user.id, {
      problemId: body.problemId,
      outcome: body.outcome,
    });

    return NextResponse.json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update mission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
