export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emitGroupEvent } from "@/lib/pusher";

async function requireGroupMember(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = await db.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
    select: {
      userId: true,
    },
  });

  if (!membership) {
    return { error: NextResponse.json({ error: "You are not a member of this group" }, { status: 403 }) };
  }

  return { session };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await context.params;
  const access = await requireGroupMember(groupId);
  if (access.error) {
    return access.error;
  }

  const messages = await db.groupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({
    messages: messages.reverse().map((message) => ({
      id: message.id,
      groupId: message.groupId,
      content: message.content ?? "",
      createdAt: message.createdAt.toISOString(),
      user: {
        id: message.user.id,
        name: message.user.name,
        image: message.user.image,
      },
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await context.params;
  const access = await requireGroupMember(groupId);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as { content?: string };
  const content = String(body.content || "").trim();

  if (!content) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const message = await db.groupMessage.create({
    data: {
      groupId,
      userId: access.session.user.id,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const payload = {
    id: message.id,
    groupId: message.groupId,
    content: message.content ?? "",
    createdAt: message.createdAt.toISOString(),
    user: {
      id: message.user.id,
      name: message.user.name,
      image: message.user.image,
    },
  };

  emitGroupEvent(groupId, "new-message", payload);

  return NextResponse.json({ message: payload }, { status: 201 });
}
