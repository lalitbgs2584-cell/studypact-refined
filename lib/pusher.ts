import type { GroupEvent } from "@/lib/socket-server";

// Safe shim — imports socket-server lazily so Next.js build never tries to
// bundle socket.io. At runtime (custom server) the io instance is available.
export const pusherServer = {
  trigger(channel: string, event: string, _data: unknown): Promise<void> {
    const groupId = channel.replace(/^group-/, "");
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { emitGroupEvent } = require("@/lib/socket-server");
      emitGroupEvent(groupId, event as GroupEvent, _data);
    } catch {
      // socket.io not available in this context (e.g. during build)
    }
    return Promise.resolve();
  },
};

export function emitGroupEvent(groupId: string, event: GroupEvent, data?: unknown): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { emitGroupEvent: emit } = require("@/lib/socket-server");
    emit(groupId, event, data);
  } catch {
    // socket.io not available in this context
  }
}
