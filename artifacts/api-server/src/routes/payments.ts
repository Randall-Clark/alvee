import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, events, bookings, users, payments, nfcCards } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { tryGetStripeClient, getUncachableStripeClient } from "../lib/stripe.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/config
 * Returns the Stripe publishable key so the mobile app can initialize the Stripe SDK.
 */
router.get("/config", async (_req, res) => {
  try {
    const { getStripePublishableKey } = await import("../lib/stripe.js");
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch {
    res.status(503).json({ error: "Stripe non configuré" });
  }
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createIntentSchema = z.object({
  eventId: z.string().uuid("eventId invalide"),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-intent
 * Create a Stripe PaymentIntent for booking an event.
 * The mobile app uses this client_secret with the Stripe SDK.
 */
router.post(
  "/create-intent",
  requireAuth,
  validate(createIntentSchema),
  async (req, res) => {
    const { eventId } = req.body;

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Événement introuvable" });
      return;
    }

    const amountCad = parseFloat(event.price);

    if (amountCad === 0) {
      // Free event — no payment needed
      res.json({ clientSecret: null, free: true });
      return;
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    const stripe = await tryGetStripeClient();

    if (!stripe) {
      // Development mode — skip payment
      res.json({
        clientSecret: null,
        free: false,
        devMode: true,
        message: "Mode développement — Stripe non configuré",
      });
      return;
    }

    let customerId = user?.stripeCustomerId;

    // Create Stripe customer if first payment
    if (!customerId && user) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, req.userId!));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountCad * 100),
      currency: "cad",
      customer: customerId ?? undefined,
      metadata: {
        userId: req.userId!,
        eventId,
        type: "event_booking",
      },
      automatic_payment_methods: { enabled: true },
    });

    // Save payment record
    await db.insert(payments).values({
      userId: req.userId!,
      eventId,
      amountCents: Math.round(amountCad * 100),
      currency: "cad",
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  },
);

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint — handles payment events automatically.
 * Configure the webhook URL in your Stripe dashboard.
 */
router.post(
  "/webhook",
  // Use raw body for Stripe signature verification
  async (req: Request, res: Response) => {
    const stripe = await tryGetStripeClient();

    if (!stripe) {
      res.status(500).json({ error: "Stripe non configuré" });
      return;
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).json({ error: "Signature manquante" });
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        webhookSecret,
      );
    } catch (err) {
      res.status(400).json({ error: "Signature invalide" });
      return;
    }

    // Handle different event types
    handleWebhookEvent(event).catch(console.error);

    res.json({ received: true });
  },
);

/**
 * Process Stripe webhook events asynchronously
 */
async function handleWebhookEvent(event: { type: string; data: { object: Record<string, unknown> } }) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata as Record<string, string>;

      // Update payment status in DB
      await db
        .update(payments)
        .set({ status: "succeeded" })
        .where(eq(payments.stripePaymentIntentId, paymentIntent.id as string));

      if (metadata.type === "event_booking" && metadata.userId && metadata.eventId) {
        // Auto-create booking after successful payment
        const existing = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, metadata.userId),
              eq(bookings.eventId, metadata.eventId),
            ),
          )
          .limit(1);

        if (!existing.length) {
          const qrCode = `ALVEE-${uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase()}`;
          await db.insert(bookings).values({
            userId: metadata.userId,
            eventId: metadata.eventId,
            qrCode,
            stripePaymentIntentId: paymentIntent.id as string,
          });
        }
      }

      if (metadata.type === "nfc_subscription" && metadata.userId && metadata.tier) {
        // Activate NFC card after successful subscription payment
        await db
          .update(nfcCards)
          .set({ isActive: false })
          .where(eq(nfcCards.userId, metadata.userId));

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await db.insert(nfcCards).values({
          userId: metadata.userId,
          tier: metadata.tier as "standard" | "prime" | "platinum",
          stripeSubscriptionId: paymentIntent.id as string,
          expiresAt,
          isActive: true,
        });

        await db
          .update(users)
          .set({ nfcTier: metadata.tier as "standard" | "prime" | "platinum", updatedAt: new Date() })
          .where(eq(users.id, metadata.userId));
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.stripePaymentIntentId, paymentIntent.id as string));
      break;
    }

    default:
      break;
  }
}

export default router;
