import { NextResponse } from "next/server";

import { reconcileOverdueTasks } from "@/lib/tracker";

export async function POST(request: Request) {
  const authHeader = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await reconcileOverdueTasks();

  return NextResponse.json({
    updated,
  });
}
