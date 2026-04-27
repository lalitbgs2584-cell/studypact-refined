// No imports from socket-server here — even type imports cause Next.js to
// trace into socket.io during build, which segfaults.
type GroupEvent = "new-task" | "new-submission" | "new-verification" | "new-message";

function emit(groupId: string, event: GroupEvent, data?: unknown): void {
  try {
    // Dynamic require keeps socket.io out of the Next.js module graph entirely
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./socket-server");
    mod.emitGroupEvent(groupId, event, data);
  } catch {
    // Socket.IO not initialised (build time or serverless context) — safe to ignore
  }
}

export const pusherServer = {
  trigger(channel: string, event: string, data?: unknown): Promise<void> {
    emit(channel.replace(/^group-/, ""), event as GroupEvent, data);
    return Promise.resolve();
  },
};

export function emitGroupEvent(groupId: string, event: GroupEvent, data?: unknown): void {
  emit(groupId, event, data);
}
