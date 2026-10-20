import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";

let io: Server | null = null;

export const userRoom = (id: string) => `user:${id}`;
export const ADMIN_ROOM = "admins";

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    path: "/socket.io",
    cors: { origin: env.CLIENT_ORIGINS, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const claims = verifyToken(String(socket.handshake.auth?.token ?? ""));
      if (claims.typ !== "socket") throw new Error("wrong token type");
      socket.data.auth = claims;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { sub, role } = socket.data.auth;
    void socket.join(userRoom(sub));
    if (role === "admin") void socket.join(ADMIN_ROOM);
  });

  return io;
}

export function emitToUsers(userIds: string[], event: string, payload: unknown) {
  if (!io || userIds.length === 0) return;
  io.to([...new Set(userIds)].map(userRoom)).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown) {
  io?.to(ADMIN_ROOM).emit(event, payload);
}
