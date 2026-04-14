// Compatibility shim — replaces Pusher with the local SSE emitter.
// All server actions call pusherServer.trigger(...) unchanged.
import { emitGroupEvent, type GroupEvent } from "@/lib/emitter";

export const pusherServer = {
  trigger(channel: string, event: string, _data: unknown) {
    // channel is "group-<groupId>", event is "new-task" | "new-submission" | "new-verification"
    const groupId = channel.replace(/^group-/, "");
    emitGroupEvent(groupId, event as GroupEvent);
    return Promise.resolve();
  },
};
