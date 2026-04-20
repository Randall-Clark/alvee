import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, nfcCards, users } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { tryGetStripeClient } from "../lib/stripe.js";

const router = Router();

// ─── Pricing ──────────────────────────────────────────────────────────────────

const TIER_PRICES_CAD: Record<string, number> = {
  standard: 12,
  prime: 60,
  platinum: 100,
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  tier: z.enum(["standard", "prime", "platinum"]),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/nfc-cards
 * Get the authenticated user's active NFC card
 */
router.get("/", requireAuth, async (req, res) => {
  const [card] = await db
    .select()
    .from(nfcCards)
    .where(eq(nfcCards.userId, req.userId!))
    .orderBy(nfcCards.createdAt)
    .limit(1);

  res.json({ card: card ?? null });
});

/**
 * POST /api/nfc-cards/subscribe
 * Subscribe to an NFC card tier.
 * Creates a Stripe payment intent for the annual subscription.
 */
router.post(
  "/subscribe",
  requireAuth,
  validate(subscribeSchema),
  async (req, res) => {
    const { tier } = req.body;

    const amountCad = TIER_PRICES_CAD[tier];
    if (!amountCad) {
      res.status(400).json({ error: "Tier invalide" });
      return;
    }

    // Get or create a Stripe customer for this user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    const stripe = await tryGetStripeClient();

    if (!stripe) {
      // Stripe not configured — return a mock client secret for development
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await db
        .update(users)
        .set({ nfcTier: tier })
        .where(eq(users.id, req.userId!));

      await db.insert(nfcCards).values({
        userId: req.userId!,
        tier,
        expiresAt,
        isActive: true,
      });

      res.json({
        clientSecret: null,
        message: "Mode développement — carte activée sans paiement",
        tier,
      });
      return;
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
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

    // Create a PaymentIntent for the annual subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCad * 100, // Stripe uses cents
      currency: "cad",
      customer: customerId,
      metadata: {
        userId: req.userId!,
        type: "nfc_subscription",
        tier,
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCad,
      tier,
    });
  },
);

/**
 * POST /api/nfc-cards/activate
 * Activate an NFC card after successful payment confirmation
 */
router.post("/activate", requireAuth, async (req, res) => {
  const { tier, stripePaymentIntentId } = req.body;

  if (!tier) {
    res.status(400).json({ error: "tier requis" });
    return;
  }

  // Deactivate any existing card
  await db
    .update(nfcCards)
    .set({ isActive: false })
    .where(eq(nfcCards.userId, req.userId!));

  // Set expiry to 1 year from now
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const [card] = await db
    .insert(nfcCards)
    .values({
      userId: req.userId!,
      tier,
      stripeSubscriptionId: stripePaymentIntentId ?? null,
      expiresAt,
      isActive: true,
    })
    .returning();

  // Update the user's tier on their profile
  await db
    .update(users)
    .set({ nfcTier: tier, updatedAt: new Date() })
    .where(eq(users.id, req.userId!));

  res.json({ card });
});

export default router;
