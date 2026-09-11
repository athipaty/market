import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { prisma } from "../db";
import { verifyToken } from "../middleware/auth";
import { env } from "../env";

interface ServerToClientEvents {
  message: (message: { id: string; conversationId: string; senderId: string; body: string; createdAt: string }) => void;
  error: (payload: { error: string }) => void;
}

interface ClientToServerEvents {
  join: (conversationId: string) => void;
  message: (payload: { conversationId: string; body: string }) => void;
}

export function createChatServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.on("join", async (conversationId) => {
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
        socket.emit("error", { error: "Not part of this conversation" });
        return;
      }
      socket.join(conversationId);
    });

    socket.on("message", async ({ conversationId, body }) => {
      const text = body?.trim();
      if (!text || text.length > 2000) {
        socket.emit("error", { error: "Message must be 1-2000 characters" });
        return;
      }
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
        socket.emit("error", { error: "Not part of this conversation" });
        return;
      }

      const message = await prisma.message.create({
        data: { conversationId, senderId: userId, body: text },
      });

      io.to(conversationId).emit("message", {
        id: message.id,
        conversationId,
        senderId: userId,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      });
    });
  });

  return io;
}
