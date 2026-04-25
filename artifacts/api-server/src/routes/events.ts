import { Router } from "express";
import { z } from "zod";
import { eq, desc, ilike, and, gte, or, inArray, sql } from "drizzle-orm";
import { db, events, bookings, users } from "../db/index.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(3, "Le titre est trop court"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date: YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure: HH:MM"),
  location: z.string().min(3, "Adresse requise"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  price: z.number().min(0).default(0),
  capacity: z.number().int().min(1).default(100),
  imageUrl: z.string().url().optional(),
  nfcOnlyEntry: z.boolean().default(false),
  requiresPrime: z.boolean().default(false),
  category: z.string().optional(),
  address: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/events
 * List all published events, with optional search and filters
 */
router.get("/", optionalAuth, async (req, res) => {
  const { search, minPrice, maxPrice, dateFrom } = req.query;

  const conditions = [eq(events.isPublished, true)];

  if (search && typeof search === "string") {
    conditions.push(
      or(
        ilike(events.title, `%${search}%`),
        ilike(events.location, `%${search}%`),
      )!,
    );
  }

  if (dateFrom && typeof dateFrom === "string") {
    conditions.push(gte(events.date, dateFrom));
  }

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      time: events.time,
      location: events.location,
      latitude: events.latitude,
      longitude: events.longitude,
      price: events.price,
      capacity: events.capacity,
      imageUrl: events.imageUrl,
      category: events.category,
      address: events.address,
      nfcOnlyEntry: events.nfcOnlyEntry,
      requiresPrime: events.requiresPrime,
      createdAt: events.createdAt,
      organizerId: events.organizerId,
      organizerName: users.name,
    })
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(events.date));

  if (rows.length === 0) {
    res.json({ events: [] });
    return;
  }

  // Compute currentParticipants via booking count per event
  const ids = rows.map(r => r.id);
  const counts = await db
    .select({
      eventId: bookings.eventId,
      count: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(and(inArray(bookings.eventId, ids), eq(bookings.status, "confirmed")))
    .groupBy(bookings.eventId);

  const countMap = Object.fromEntries(counts.map(c => [c.eventId, c.count]));
  const result = rows.map(r => ({ ...r, currentParticipants: countMap[r.id] ?? 0 }));

  res.json({ events: result });
});

/**
 * GET /api/events/:id
 * Get a single event by ID with booking count
 */
router.get("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      time: events.time,
      location: events.location,
      latitude: events.latitude,
      longitude: events.longitude,
      price: events.price,
      capacity: events.capacity,
      imageUrl: events.imageUrl,
      category: events.category,
      address: events.address,
      nfcOnlyEntry: events.nfcOnlyEntry,
      requiresPrime: events.requiresPrime,
      organizerId: events.organizerId,
      organizerName: users.name,
      organizerAvatar: users.avatarUrl,
      createdAt: events.createdAt,
    })
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .where(eq(events.id, id!))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }

  // Count confirmed bookings to show available spots
  const confirmedBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, id!), eq(bookings.status, "confirmed")),
    );

  res.json({
    event: {
      ...event,
      bookedCount: confirmedBookings.length,
      availableSpots: event.capacity - confirmedBookings.length,
    },
  });
});

/**
 * POST /api/events
 * Create a new event (authenticated organizers)
 */
router.post("/", requireAuth, validate(createEventSchema), async (req, res) => {
  const { price, ...rest } = req.body;

  // Auto-set requiresPrime if price >= 300 CAD
  const requiresPrime = price >= 300 || req.body.requiresPrime;

  const [event] = await db
    .insert(events)
    .values({
      ...rest,
      price: price.toString(),
      requiresPrime,
      organizerId: req.userId!,
      latitude: rest.latitude?.toString(),
      longitude: rest.longitude?.toString(),
    })
    .returning();

  res.status(201).json({ event });
});

/**
 * PATCH /api/events/:id
 * Update an event (organizer only)
 */
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, id!))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }

  if (event.organizerId !== req.userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const updateSchema = createEventSchema.partial();
  const result = updateSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const data = result.data;
  const [updated] = await db
    .update(events)
    .set({
      ...data,
      price: data.price?.toString(),
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id!))
    .returning();

  res.json({ event: updated });
});

/**
 * DELETE /api/events/:id
 * Delete an event (organizer only)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, id!))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }

  if (event.organizerId !== req.userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  await db.delete(events).where(eq(events.id, id!));

  res.json({ message: "Événement supprimé" });
});

/**
 * GET /api/events/organizer/mine
 * Get all events created by the authenticated user
 */
router.get("/organizer/mine", requireAuth, async (req, res) => {
  const myEvents = await db
    .select()
    .from(events)
    .where(eq(events.organizerId, req.userId!))
    .orderBy(desc(events.createdAt));

  res.json({ events: myEvents });
});

export default router;
