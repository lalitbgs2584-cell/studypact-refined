export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("Socket.IO is handled by the custom server.", { status: 200 });
}

export async function POST() {
  return new Response("Socket.IO is handled by the custom server.", { status: 200 });
}
