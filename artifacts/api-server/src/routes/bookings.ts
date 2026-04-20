import { Router } from "express";
import { eq, and, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, bookings, events, users, nfcCards } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if the user is eligible for early-bird pricing.
 * The first 40% of registrants get early-bird status.
 */
async function isEarlyBird(
  eventId: string,
  capacity: number,
): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, eventId), eq(bookings.status, "confirmed")),
    );

  const currentCount = Number(result?.count ?? 0);
  const earlyBirdThreshold = Math.floor(capacity * 0.4);
  return currentCount < earlyBirdThreshold;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/bookings
 * Get all bookings for the authenticated user
 */
router.get("/", requireAuth, async (req, res) => {
  const myBookings = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      qrCode: bookings.qrCode,
      isEarlyBird: bookings.isEarlyBird,
      createdAt: bookings.createdAt,
      cancelledAt: bookings.cancelledAt,
      eventId: events.id,
      eventTitle: events.title,
      eventDate: events.date,
      eventTime: events.time,
      eventLocation: events.location,
      eventPrice: events.price,
      eventImageUrl: events.imageUrl,
      nfcOnlyEntry: events.nfcOnlyEntry,
    })
    .from(bookings)
    .leftJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.userId, req.userId!))
    .orderBy(bookings.createdAt);

  res.json({ bookings: myBookings });
});

/**
 * POST /api/bookings
 * Book an event for the authenticated user
 */
router.post("/", requireAuth, async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    res.status(400).json({ error: "eventId requis" });
    return;
  }

  // Get event details
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }

  // Get user info to check NFC tier
  const [user] = await db
    .select({ nfcTier: users.nfcTier })
    .from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);

  // Check if event requires Prime card
  if (event.requiresPrime) {
    const tier = user?.nfcTier;
    if (tier === "none" || tier === "standard") {
      res.status(403).json({
        error: "Cet événement requiert une carte Prime ou Platinum",
        requiresPrime: true,
      });
      return;
    }
  }

  // Check if already booked
  const [existing] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.userId, req.userId!),
        eq(bookings.eventId, eventId),
        eq(bookings.status, "confirmed"),
      ),
    )
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Vous êtes déjà inscrit à cet événement" });
    return;
  }

  // Check capacity
  const [capacityResult] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, eventId), eq(bookings.status, "confirmed")),
    );

  const bookedCount = Number(capacityResult?.count ?? 0);

  if (bookedCount >= event.capacity) {
    res.status(409).json({ error: "Événement complet" });
    return;
  }

  // Check early bird eligibility
  const earlyBird = await isEarlyBird(eventId, event.capacity);

  // Generate unique QR code
  const qrCode = `ALVEE-${uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

  const [booking] = await db
    .insert(bookings)
    .values({
      userId: req.userId!,
      eventId,
      qrCode,
      isEarlyBird: earlyBird,
    })
    .returning();

  res.status(201).json({ booking });
});

/**
 * DELETE /api/bookings/:id
 * Cancel a booking (respects refund policy based on NFC tier and event date)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [booking] = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      status: bookings.status,
      eventId: bookings.eventId,
      eventDate: events.date,
    })
    .from(bookings)
    .leftJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, id!))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Réservation introuvable" });
    return;
  }

  if (booking.userId !== req.userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  if (booking.status !== "confirmed") {
    res.status(400).json({ error: "Cette réservation ne peut pas être annulée" });
    return;
  }

  // Check refund eligibility based on NFC tier
  const [user] = await db
    .select({ nfcTier: users.nfcTier })
    .from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);

  const eventDate = new Date(booking.eventDate!);
  const now = new Date();
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const tier = user?.nfcTier ?? "none";
  let canRefund = false;

  if (tier === "platinum" || tier === "prime") {
    // Prime+ can cancel same day
    canRefund = hoursUntilEvent > 0;
  } else {
    // Standard/none need 24h notice
    canRefund = hoursUntilEvent >= 24;
  }

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(bookings.id, id!));

  res.json({
    message: "Réservation annulée",
    refundEligible: canRefund,
  });
});

/**
 * POST /api/bookings/validate
 * Validate a booking QR code at event entry (organizer use)
 */
router.post("/validate", requireAuth, async (req, res) => {
  const { qrCode, eventId } = req.body;

  if (!qrCode || !eventId) {
    res.status(400).json({ error: "qrCode et eventId requis" });
    return;
  }

  // Check that the requester is the event organizer
  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }

  if (event.organizerId !== req.userId) {
    res.status(403).json({ error: "Accès réservé aux organisateurs" });
    return;
  }

  // Find the booking by QR code
  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      userName: users.name,
      userEmail: users.email,
      userNfcTier: users.nfcTier,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.qrCode, qrCode), eq(bookings.eventId, eventId)))
    .limit(1);

  if (!booking) {
    res.status(404).json({ valid: false, error: "Billet invalide" });
    return;
  }

  if (booking.status === "used") {
    res.status(409).json({ valid: false, error: "Billet déjà utilisé" });
    return;
  }

  if (booking.status === "cancelled") {
    res.status(409).json({ valid: false, error: "Billet annulé" });
    return;
  }

  // Mark booking as used
  await db
    .update(bookings)
    .set({ status: "used" })
    .where(eq(bookings.id, booking.id));

  res.json({
    valid: true,
    attendee: {
      name: booking.userName,
      email: booking.userEmail,
      nfcTier: booking.userNfcTier,
    },
  });
});

export default router;
