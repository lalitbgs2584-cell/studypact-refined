import { cache } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { TaskStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/workspace";

export type FocusLogTask = {
  id: string;
  title: string;
  details: string | null;
  status: TaskStatus;
  blockType: string;
  targetMinutes: number | null;
};

export const getFocusLog = cache(async (userId: string, groupId: string): Promise<FocusLogTask[]> => {
  const today = new Date();
  return db.task.findMany({
    where: {
      userId,
      groupId,
      day: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    select: { id: true, title: true, details: true, status: true, blockType: true, targetMinutes: true },
    orderBy: { createdAt: "asc" },
  });
});

export const getSidebarFocusLog = cache(async (): Promise<FocusLogTask[]> => {
  const session = await requireSession();
  const today = new Date();
  return db.task.findMany({
    where: {
      userId: session.user.id,
      day: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    select: { id: true, title: true, details: true, status: true, blockType: true, targetMinutes: true },
    orderBy: { createdAt: "asc" },
  });
});
