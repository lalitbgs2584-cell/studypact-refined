import crypto from "crypto";
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
import { emitGroupEvent } from "@/lib/pusher";
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
  const assignmentMode = String(body.assignmentMode || "SELF").trim().toUpperCase();
  const dueAt = body.dueAt ? new Date(body.dueAt) : null;
  const explicitGroupId = String(body.groupId || "").trim();
  const assigneeIds: string[] = Array.isArray(body.assigneeIds)
    ? Array.from(
        new Set<string>(
          body.assigneeIds
            .map((value: unknown) => String(value || "").trim())
            .filter((value): value is string => Boolean(value)),
        ),
      )
    : [];

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (body.dueAt && (!dueAt || Number.isNaN(dueAt.getTime()))) {
    return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
  }

  const { activeGroupId } = await getWorkspace(session.user.id);
  const defaultGroupId = explicitGroupId || activeGroupId || "";

  if (!defaultGroupId) {
    return NextResponse.json({ error: "Join a group first" }, { status: 400 });
  }

  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: defaultGroupId,
      },
    },
    select: {
      role: true,
      group: {
        select: {
          taskPostingMode: true,
          users: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You can only create tasks inside a group you belong to" },
      { status: 403 },
    );
  }

  const isLeader = membership.role === "admin";
  const groupMemberIds = membership.group.users.map((member) => member.userId);
  const taskAssignees: string[] =
    scope === TaskScope.PERSONAL
      ? [session.user.id]
      : assignmentMode === "SELECTED_MEMBERS"
        ? assigneeIds
        : groupMemberIds;

  if (scope === TaskScope.GROUP && assignmentMode === "SELECTED_MEMBERS" && !isLeader) {
    return NextResponse.json(
      { error: "Only the group leader can assign tasks to selected members" },
      { status: 403 },
    );
  }

  if (
    scope === TaskScope.GROUP &&
    assignmentMode !== "SELECTED_MEMBERS" &&
    !isLeader &&
    membership.group.taskPostingMode === "ADMINS_ONLY"
  ) {
    return NextResponse.json(
      { error: "Only the group leader can post group tasks in this group" },
      { status: 403 },
    );
  }

  if (scope === TaskScope.GROUP && taskAssignees.length === 0) {
    return NextResponse.json(
      {
        error:
          assignmentMode === "SELECTED_MEMBERS"
            ? "Choose at least one member"
            : "No members found in this group",
      },
      { status: 400 },
    );
  }

  if (scope === TaskScope.GROUP && taskAssignees.some((userId) => !groupMemberIds.includes(userId))) {
    return NextResponse.json(
      { error: "Selected members must belong to the chosen group" },
      { status: 400 },
    );
  }

  const createdTaskIds = await db.$transaction(async (tx) => {
    const broadcastKey = scope === TaskScope.GROUP ? crypto.randomUUID() : null;
    const createdIds: string[] = [];
    for (const userId of taskAssignees) {
      const task = await tx.task.create({
        data: {
          title,
          details,
          category,
          priority,
          difficulty,
          blockType,
          day: dueAt ?? new Date(),
          dueAt,
          status: TaskStatus.PENDING,
          userId,
          groupId: defaultGroupId,
          scope,
          broadcastKey,
        },
        select: { id: true },
      });
      createdIds.push(task.id);
    }

    return createdIds;
  });

  await syncTaskTrackers(createdTaskIds);
  emitGroupEvent(defaultGroupId, "new-task", {
    title,
    scope,
    assigneeCount: taskAssignees.length,
  });

  return NextResponse.json({ taskIds: createdTaskIds }, { status: 201 });
}
