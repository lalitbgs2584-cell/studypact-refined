import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getTrackerOverview } from "@/lib/tracker";
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

  const overview = await getTrackerOverview(session.user.id, groupId);
  return NextResponse.json(overview);
}
