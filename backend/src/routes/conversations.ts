import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const conversationsRouter = Router();

const startSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// Start (or resume) a conversation with a listing's seller, sending the first message.
conversationsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { listingId, message } = parsed.data;
  const buyerId = req.auth!.userId;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  if (listing.sellerId === buyerId) {
    return res.status(400).json({ error: "You cannot message yourself about your own listing" });
  }

  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId } },
    update: {},
    create: { listingId, buyerId, sellerId: listing.sellerId },
  });

  const created = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: buyerId, body: message },
  });

  return res.status(201).json({ conversation, message: created });
});

// List conversations the current user is part of, newest activity first.
conversationsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      listing: { select: { id: true, title: true, images: true, price: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ conversations });
});

async function loadConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { error: 404 as const };
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return { error: 403 as const };
  }
  return { conversation };
}

conversationsRouter.get("/:id/messages", requireAuth, async (req, res) => {
  const result = await loadConversationForUser(req.params.id, req.auth!.userId);
  if (result.error === 404) return res.status(404).json({ error: "Conversation not found" });
  if (result.error === 403) return res.status(403).json({ error: "Not part of this conversation" });

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ conversation: result.conversation, messages });
});

const sendMessageSchema = z.object({ body: z.string().min(1).max(2000) });

conversationsRouter.post("/:id/messages", requireAuth, async (req, res) => {
  const result = await loadConversationForUser(req.params.id, req.auth!.userId);
  if (result.error === 404) return res.status(404).json({ error: "Conversation not found" });
  if (result.error === 403) return res.status(403).json({ error: "Not part of this conversation" });

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const message = await prisma.message.create({
    data: { conversationId: req.params.id, senderId: req.auth!.userId, body: parsed.data.body },
  });
  return res.status(201).json({ message });
});
