import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWeeklyReportForMembership } from "@/lib/tracker";
import { getWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedGroupId = searchParams.get("groupId");
  const { activeGroupId } = await getWorkspace(session.user.id);
  const groupId = requestedGroupId || activeGroupId;

  if (!groupId) {
    return NextResponse.json({ error: "No active group" }, { status: 400 });
  }

  const report = await db.weeklyReport.findFirst({
    where: { userId: session.user.id, groupId },
    orderBy: { weekStart: "desc" },
  });

  return NextResponse.json(report);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedGroupId = typeof body.groupId === "string" ? body.groupId.trim() : "";
  const requestedWeekStart = typeof body.weekStart === "string" ? new Date(body.weekStart) : undefined;
  const { activeGroupId } = await getWorkspace(session.user.id);
  const groupId = requestedGroupId || activeGroupId;

  if (!groupId) {
    return NextResponse.json({ error: "No active group" }, { status: 400 });
  }

  const report = await generateWeeklyReportForMembership({
    userId: session.user.id,
    groupId,
    weekStart: requestedWeekStart,
  });

  return NextResponse.json(report, { status: 201 });
}
