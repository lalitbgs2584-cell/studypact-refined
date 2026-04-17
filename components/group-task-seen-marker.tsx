"use client";

import { useEffect } from "react";

type GroupTaskSeenMarkerProps = {
  enabled: boolean;
  userId: string;
  groupId: string | null;
  latestTaskSignature: string | null;
};

export function GroupTaskSeenMarker({
  enabled,
  userId,
  groupId,
  latestTaskSignature,
}: GroupTaskSeenMarkerProps) {
  useEffect(() => {
    if (!enabled || !groupId || !latestTaskSignature) return;

    window.localStorage.setItem(
      `studypact:seen-group-task:${userId}:${groupId}`,
      latestTaskSignature
    );
  }, [enabled, groupId, latestTaskSignature, userId]);

  return null;
}
