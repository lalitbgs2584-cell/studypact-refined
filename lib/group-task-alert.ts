type GroupTaskAlertSource = {
  id: string;
  title: string;
  broadcastKey: string | null;
  createdAt: Date;
  scope: string;
};

export type GroupTaskAlertMeta = {
  count: number;
  latestTaskTitle: string | null;
  latestTaskSignature: string | null;
};

export function getGroupTaskAlertMeta(tasks: GroupTaskAlertSource[]): GroupTaskAlertMeta {
  const broadcasts = new Map<string, GroupTaskAlertSource>();

  for (const task of tasks) {
    if (task.scope !== "GROUP") continue;

    const key = task.broadcastKey ?? task.id;
    const current = broadcasts.get(key);

    if (!current || task.createdAt > current.createdAt) {
      broadcasts.set(key, task);
    }
  }

  const uniqueBroadcasts = [...broadcasts.values()].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
  );
  const latestTask = uniqueBroadcasts[0];

  return {
    count: uniqueBroadcasts.length,
    latestTaskTitle: latestTask?.title ?? null,
    latestTaskSignature: latestTask
      ? `${latestTask.broadcastKey ?? latestTask.id}:${latestTask.createdAt.toISOString()}`
      : null,
  };
}
