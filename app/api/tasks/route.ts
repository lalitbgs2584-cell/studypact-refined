import {
  StudyBlock,
  TaskCategory,
  TaskDifficulty,
  TaskPriority,
  TaskScope,
  TaskStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncTaskTrackers } from "@/lib/tracker";
import { getWorkspace } from "@/lib/workspace";

function resolveEnumValue<T extends string>(value: unknown, enumObject: Record<string, T>, fallback: T) {
  return Object.values(enumObject).includes(value as T) ? (value as T) : fallback;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const details = String(body.details || "").trim() || null;
  const category = resolveEnumValue(body.category, TaskCategory, TaskCategory.CUSTOM);
  const priority = resolveEnumValue(body.priority, TaskPriority, TaskPriority.MEDIUM);
  const difficulty = resolveEnumValue(body.difficulty, TaskDifficulty, TaskDifficulty.MEDIUM);
  const blockType = resolveEnumValue(body.blockType, StudyBlock, StudyBlock.DEEP_WORK);
  const scope = resolveEnumValue(body.scope, TaskScope, TaskScope.PERSONAL);
  const dueAt = body.dueAt ? new Date(body.dueAt) : null;
  const explicitGroupId = String(body.groupId || "").trim();
  const groupIds = Array.isArray(body.groupIds)
    ? body.groupIds.map((value: unknown) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { activeGroupId } = await getWorkspace(session.user.id);
  const defaultGroupId = explicitGroupId || activeGroupId || "";
  const targetGroupIds = scope === TaskScope.GROUP ? groupIds : defaultGroupId ? [defaultGroupId] : [];

  if (scope === TaskScope.GROUP && targetGroupIds.length === 0) {
    return NextResponse.json({ error: "Select at least one group" }, { status: 400 });
  }

  if (scope === TaskScope.PERSONAL && !defaultGroupId) {
    return NextResponse.json({ error: "Join a group first" }, { status: 400 });
  }

  const createdTaskIds = await db.$transaction(async (tx) => {
    const payloads: Array<{
      title: string;
      details: string | null;
      category: TaskCategory;
      priority: TaskPriority;
      difficulty: TaskDifficulty;
      blockType: StudyBlock;
      day: Date;
      dueAt: Date | null;
      status: TaskStatus;
      userId: string;
      groupId: string;
      scope: TaskScope;
    }> = [];

    if (scope === TaskScope.PERSONAL) {
      payloads.push({
        title,
        details,
        category,
        priority,
        difficulty,
        blockType,
        day: dueAt ?? new Date(),
        dueAt,
        status: TaskStatus.PENDING,
        userId: session.user.id,
        groupId: defaultGroupId,
        scope,
      });
    } else {
      for (const groupId of targetGroupIds) {
        const members = await tx.userGroup.findMany({
          where: { groupId },
          select: { userId: true },
        });

        if (!members.some((member) => member.userId === session.user.id)) {
          return [];
        }

        for (const member of members) {
          payloads.push({
            title,
            details,
            category,
            priority,
            difficulty,
            blockType,
            day: dueAt ?? new Date(),
            dueAt,
            status: TaskStatus.PENDING,
            userId: member.userId,
            groupId,
            scope,
          });
        }
      }
    }

    const createdIds: string[] = [];
    for (const payload of payloads) {
      const task = await tx.task.create({
        data: payload,
        select: { id: true },
      });
      createdIds.push(task.id);
    }

    return createdIds;
  });

  if (createdTaskIds.length === 0) {
    return NextResponse.json({ error: "Unable to create tasks for this group selection" }, { status: 400 });
  }

  await syncTaskTrackers(createdTaskIds);

  return NextResponse.json({ taskIds: createdTaskIds }, { status: 201 });
}
