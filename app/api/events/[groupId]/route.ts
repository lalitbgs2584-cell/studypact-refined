import { onGroupEvent } from "@/lib/emitter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { groupId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial ping so the client knows the connection is live
      controller.enqueue(`data: {"type":"connected"}\n\n`);

      const cleanup = onGroupEvent(groupId, (event) => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: event })}\n\n`);
        } catch {
          // controller already closed
        }
      });

      // Keep-alive ping every 25 seconds to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {
          clearInterval(keepAlive);
        }
      }, 25_000);

      // Cleanup when client disconnects
      const abort = () => {
        cleanup();
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* already closed */ }
      };

      // ReadableStream cancel is called when the client closes the connection
      return abort;
    },
    cancel() {
      // handled by the return value of start()
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
