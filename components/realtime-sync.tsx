"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RealtimeGroupSync({ groupId }: { groupId: string }) {
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!groupId) return;

    function connect() {
      const es = new EventSource(`/api/events/${groupId}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { type: string };
          if (data.type !== "connected") {
            router.refresh();
          }
        } catch {
          // ignore malformed messages
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 3 seconds on error
        setTimeout(connect, 3_000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [groupId, router]);

  return null;
}
