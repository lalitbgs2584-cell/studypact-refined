"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import type { Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { getSocketClient } from "@/lib/socket-client";

type GroupTaskUploadPopupProps = {
  userId: string;
  groupId: string | null;
  groupName?: string | null;
  latestTaskSignature: string | null;
  latestTaskTitle: string | null;
  taskCount: number;
};

function getSeenStorageKey(userId: string, groupId: string) {
  return `studypact:seen-group-task:${userId}:${groupId}`;
}

export function GroupTaskUploadPopup({
  userId,
  groupId,
  groupName,
  latestTaskSignature,
  latestTaskTitle,
  taskCount,
}: GroupTaskUploadPopupProps) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef<string | null>(null);
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null);

  const storageKey = groupId ? getSeenStorageKey(userId, groupId) : null;

  const seenSignature = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleStorage = () => callback();
      window.addEventListener("storage", handleStorage);

      return () => {
        window.removeEventListener("storage", handleStorage);
      };
    },
    () => {
      if (!storageKey || typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem(storageKey);
    },
    () => null
  );

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocketClient();
    socketRef.current = socket;

    const handleNewTask = () => {
      router.refresh();
    };

    if (joinedRef.current !== groupId) {
      if (joinedRef.current) {
        socket.emit("leave-group", joinedRef.current);
      }
      socket.emit("join-group", groupId);
      joinedRef.current = groupId;
    }

    socket.on("new-task", handleNewTask);

    return () => {
      socket.off("new-task", handleNewTask);
    };
  }, [groupId, router]);

  useEffect(() => {
    return () => {
      if (socketRef.current && joinedRef.current) {
        socketRef.current.emit("leave-group", joinedRef.current);
        joinedRef.current = null;
      }
    };
  }, []);

  const visible =
    !!groupId &&
    !!latestTaskSignature &&
    taskCount > 0 &&
    seenSignature !== latestTaskSignature &&
    dismissedSignature !== latestTaskSignature;

  if (!visible) {
    return null;
  }

  const handleViewTasks = () => {
    if (storageKey) {
      window.localStorage.setItem(storageKey, latestTaskSignature);
    }
    router.push("/tasks?view=group");
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[rgba(196,172,120,0.18)] bg-[rgba(13,17,24,0.94)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-[rgba(196,172,120,0.22)] bg-[rgba(196,172,120,0.08)] p-2 text-[#C4AC78]">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#C4AC78]">Task Update</div>
              <div className="mt-1 text-sm font-semibold text-white">Today&apos;s task has been uploaded</div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedSignature(latestTaskSignature)}
              className="rounded-lg border border-[rgba(196,172,120,0.12)] bg-transparent p-1 text-white/50 transition hover:text-white"
              aria-label="Close task update popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-white/65">
            {groupName ? `${groupName}: ` : ""}
            {latestTaskTitle ?? "A new group task is ready."}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {taskCount === 1 ? "1 unseen group task for today." : `${taskCount} unseen group tasks for today.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={handleViewTasks}>
              View Tasks
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDismissedSignature(latestTaskSignature)}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
