import PusherClient from "pusher-js";

declare global {
  var __studypactPusherClient: PusherClient | undefined;
}

export const getPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!globalThis.__studypactPusherClient) {
    globalThis.__studypactPusherClient = new PusherClient(key, {
      cluster,
      forceTLS: true,
    });
  }

  return globalThis.__studypactPusherClient;
};
