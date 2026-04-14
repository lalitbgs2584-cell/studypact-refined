"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useRouter } from "next/navigation";

export function RealtimeGroupSync({ groupId }: { groupId: string }) {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `group-${groupId}`;
    const channel = pusher.subscribe(channelName);

    const reloadHandler = () => {
      router.refresh();
    };

    channel.bind("new-task", reloadHandler);
    channel.bind("new-submission", reloadHandler);
    channel.bind("new-verification", reloadHandler);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [groupId, router]);

  return null;
}
