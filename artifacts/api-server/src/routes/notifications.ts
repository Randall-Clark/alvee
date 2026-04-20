import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, notifications } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get("/", requireAuth, async (req, res) => {
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, req.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  res.json({ notifications: userNotifications, unreadCount });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch("/:id/read", requireAuth, async (req, res) => {
  const { id } = req.params;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      eq(notifications.id, id!),
    );

  res.json({ message: "Notification marquée comme lue" });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the user
 */
router.patch("/read-all", requireAuth, async (req, res) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, req.userId!));

  res.json({ message: "Toutes les notifications marquées comme lues" });
});

export default router;
