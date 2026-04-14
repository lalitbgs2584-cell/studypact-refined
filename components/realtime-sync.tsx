"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket-client";
import type { Socket } from "socket.io-client";

export function RealtimeGroupSync({ groupId }: { groupId: string }) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocketClient();
    socketRef.current = socket;

    const handleEvent = () => {
      router.refresh();
    };

    // Join the group room
    if (joinedRef.current !== groupId) {
      if (joinedRef.current) {
        socket.emit("leave-group", joinedRef.current);
      }
      socket.emit("join-group", groupId);
      joinedRef.current = groupId;
    }

    // Listen for group events
    socket.on("new-task", handleEvent);
    socket.on("new-submission", handleEvent);
    socket.on("new-verification", handleEvent);

    return () => {
      socket.off("new-task", handleEvent);
      socket.off("new-submission", handleEvent);
      socket.off("new-verification", handleEvent);
    };
  }, [groupId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current && joinedRef.current) {
        socketRef.current.emit("leave-group", joinedRef.current);
        joinedRef.current = null;
      }
    };
  }, []);

  return null;
}