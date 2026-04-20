import { Router } from "express";
import { z } from "zod";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { db, messages, users } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  receiverId: z.string().uuid("ID de destinataire invalide"),
  content: z.string().min(1, "Le message ne peut pas être vide").max(2000),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/messages/conversations
 * Get a list of all conversations for the authenticated user.
 * Groups messages by the other participant.
 */
router.get("/conversations", requireAuth, async (req, res) => {
  // Get all messages where user is sender or receiver
  const allMessages = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      content: messages.content,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderAvatar: users.avatarUrl,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      or(
        eq(messages.senderId, req.userId!),
        eq(messages.receiverId, req.userId!),
      ),
    )
    .orderBy(desc(messages.createdAt));

  // Build conversation map (group by the other participant)
  const conversationMap = new Map<string, {
    userId: string;
    lastMessage: (typeof allMessages)[0];
    unreadCount: number;
  }>();

  for (const msg of allMessages) {
    const otherId =
      msg.senderId === req.userId ? msg.receiverId : msg.senderId;

    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        userId: otherId,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    // Count unread messages (received but not yet read)
    if (msg.receiverId === req.userId && !msg.readAt) {
      conversationMap.get(otherId)!.unreadCount++;
    }
  }

  // Fetch user info for each conversation partner
  const conversations = await Promise.all(
    Array.from(conversationMap.values()).map(async (conv) => {
      const [partner] = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, conv.userId))
        .limit(1);

      return { partner, lastMessage: conv.lastMessage, unreadCount: conv.unreadCount };
    }),
  );

  res.json({ conversations });
});

/**
 * GET /api/messages/:userId
 * Get all messages in a conversation with a specific user
 */
router.get("/:userId", requireAuth, async (req, res) => {
  const { userId: otherId } = req.params;

  const conversation = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      content: messages.content,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, req.userId!), eq(messages.receiverId, otherId!)),
        and(eq(messages.senderId, otherId!), eq(messages.receiverId, req.userId!)),
      ),
    )
    .orderBy(messages.createdAt);

  // Mark received messages as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.senderId, otherId!),
        eq(messages.receiverId, req.userId!),
        isNull(messages.readAt),
      ),
    );

  res.json({ messages: conversation });
});

/**
 * POST /api/messages
 * Send a message to another user
 */
router.post("/", requireAuth, validate(sendMessageSchema), async (req, res) => {
  const { receiverId, content } = req.body;

  if (receiverId === req.userId) {
    res.status(400).json({ error: "Vous ne pouvez pas vous envoyer un message" });
    return;
  }

  // Verify receiver exists
  const [receiver] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, receiverId))
    .limit(1);

  if (!receiver) {
    res.status(404).json({ error: "Destinataire introuvable" });
    return;
  }

  const [message] = await db
    .insert(messages)
    .values({
      senderId: req.userId!,
      receiverId,
      content,
    })
    .returning();

  res.status(201).json({ message });
});

export default router;
