"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useRouter } from "next/navigation";

export function RealtimeGroupSync({ groupId }: { groupId: string }) {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`group-${groupId}`);
    
    const reloadHandler = () => {
      router.refresh();
    };

    channel.bind("new-task", reloadHandler);
    channel.bind("new-submission", reloadHandler);
    channel.bind("new-verification", reloadHandler);

    return () => {
      pusher.unsubscribe(`group-${groupId}`);
    };
  }, [groupId, router]);

  return null;
}
