import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

declare global {
  var __socketIO: SocketIOServer | undefined;
}

export type GroupEvent = "new-task" | "new-submission" | "new-verification" | "new-message";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (globalThis.__socketIO) {
    return globalThis.__socketIO;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("[Socket.IO] Client connected:", socket.id);

    socket.on("join-group", (groupId: string) => {
      socket.join(`group-${groupId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined group-${groupId}`);
    });

    socket.on("leave-group", (groupId: string) => {
      socket.leave(`group-${groupId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left group-${groupId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__socketIO = io;
  }

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return globalThis.__socketIO || io;
}

export function emitGroupEvent(groupId: string, event: GroupEvent, data?: unknown) {
  const socketServer = getSocketServer();
  if (socketServer) {
    socketServer.to(`group-${groupId}`).emit(event, data || {});
    console.log(`[Socket.IO] Emitted ${event} to group-${groupId}`);
  }
}
