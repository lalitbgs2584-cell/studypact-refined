"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSocketClient } from "@/lib/socket-client";

export type GroupChatMessage = {
  id: string;
  groupId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

type GroupChatPanelProps = {
  currentUserId: string;
  groupId: string;
  groupName: string;
  initialMessages: GroupChatMessage[];
};

export function GroupChatPanel({
  currentUserId,
  groupId,
  groupName,
  initialMessages,
}: GroupChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!groupId) {
      return;
    }

    const socket = getSocketClient();
    const handleMessage = (message: GroupChatMessage) => {
      if (message.groupId !== groupId) {
        return;
      }

      setMessages((current) =>
        current.some((entry) => entry.id === message.id) ? current : [...current, message],
      );
    };

    socket.emit("join-group", groupId);
    socket.on("new-message", handleMessage);

    return () => {
      socket.off("new-message", handleMessage);
      socket.emit("leave-group", groupId);
    };
  }, [groupId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: GroupChatMessage;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "Failed to send message");
      }

      const nextMessage = payload.message;
      setDraft("");
      setMessages((current) =>
        current.some((entry) => entry.id === nextMessage.id)
          ? current
          : [...current, nextMessage],
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-primary/12 bg-[rgba(13,18,28,0.84)] shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Group Chat</div>
          <div className="mt-1 truncate text-xs text-white/45">{groupName}</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <Users className="h-3.5 w-3.5" />
          Live
        </div>
      </div>

      <div className="flex h-[32rem] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
              Start the first message in this group.
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.user.id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[20px] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.16)]",
                      isMine
                        ? "rounded-br-md border border-primary/20 bg-primary/12 text-primary-foreground"
                        : "rounded-bl-md border border-white/8 bg-white/[0.04] text-white/85",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/85">
                        {isMine ? "You" : message.user.name}
                      </span>
                      <span className="text-[11px] text-white/35">
                        {timeFormatter.format(new Date(message.createdAt))}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-primary/10 px-4 pb-4 pt-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={3}
              placeholder="Write a message"
              className="min-h-[96px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-primary/25 focus:bg-primary/[0.04]"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/35">Press Enter to send. Shift + Enter adds a new line.</div>
              <Button type="submit" disabled={isSending || !draft.trim()} className="gap-2">
                <SendHorizontal className="h-4 w-4" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>

          {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
