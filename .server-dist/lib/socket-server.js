"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getSocketServer = getSocketServer;
exports.emitGroupEvent = emitGroupEvent;
const socket_io_1 = require("socket.io");
let io = null;
function initSocketServer(httpServer) {
    if (globalThis.__socketIO) {
        return globalThis.__socketIO;
    }
    io = new socket_io_1.Server(httpServer, {
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
        socket.on("join-group", (groupId) => {
            socket.join(`group-${groupId}`);
            console.log(`[Socket.IO] Socket ${socket.id} joined group-${groupId}`);
        });
        socket.on("leave-group", (groupId) => {
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
function getSocketServer() {
    return globalThis.__socketIO || io;
}
function emitGroupEvent(groupId, event, data) {
    const socketServer = getSocketServer();
    if (socketServer) {
        socketServer.to(`group-${groupId}`).emit(event, data || {});
        console.log(`[Socket.IO] Emitted ${event} to group-${groupId}`);
    }
}
