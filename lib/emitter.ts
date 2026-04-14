import { EventEmitter } from "events";

declare global {
  // persist across hot-reloads in dev
  var __studypactEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter =
  globalThis.__studypactEmitter ?? new EventEmitter();

emitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalThis.__studypactEmitter = emitter;
}

export type GroupEvent =
  | "new-task"
  | "new-submission"
  | "new-verification";

export function emitGroupEvent(groupId: string, event: GroupEvent) {
  emitter.emit(`group:${groupId}`, event);
}

export function onGroupEvent(
  groupId: string,
  handler: (event: GroupEvent) => void
): () => void {
  const key = `group:${groupId}`;
  emitter.on(key, handler);
  return () => emitter.off(key, handler);
}
