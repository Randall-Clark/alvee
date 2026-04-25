import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, nfcCards, users } from "../db/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { tryGetStripeClient } from "../lib/stripe.js";

const router = Router();

const TIER_PRICES_CAD: Record<string, number> = {
  standard: 12,
  prime: 60,
  platinum: 100,
};

const subscribeSchema = z.object({
  tier: z.enum(["standard", "prime", "platinum"]),
});

/**
 * GET /api/nfc-cards
 * Get ALL NFC cards for the authenticated user
 */
router.get("/", requireAuth, async (req, res) => {
  const cards = await db
    .select()
    .from(nfcCards)
    .where(eq(nfcCards.userId, req.userId!))
    .orderBy(nfcCards.createdAt);

  res.json({ cards });
});

/**
 * POST /api/nfc-cards/subscribe
 * Subscribe to an NFC card tier.
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
      // Dev mode — activate immediately without payment
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await db.update(users).set({ nfcTier: tier }).where(eq(users.id, req.userId!));

      const [card] = await db.insert(nfcCards).values({
        userId: req.userId!,
        tier,
        expiresAt,
        isActive: true,
      }).returning();

      res.json({
        clientSecret: null,
        message: "Mode développement — carte activée sans paiement",
        tier,
        card,
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
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, req.userId!));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCad * 100,
      currency: "cad",
      customer: customerId,
      metadata: { userId: req.userId!, type: "nfc_subscription", tier },
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
 * Activate an NFC card after Stripe payment confirmation
 */
router.post("/activate", requireAuth, async (req, res) => {
  const { tier, stripePaymentIntentId } = req.body;
  if (!tier) {
    res.status(400).json({ error: "tier requis" });
    return;
  }

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

  await db.update(users).set({ nfcTier: tier, updatedAt: new Date() }).where(eq(users.id, req.userId!));

  res.json({ card });
});

/**
 * PATCH /api/nfc-cards/:id/deactivate
 * Deactivate a specific NFC card
 */
router.patch("/:id/deactivate", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [card] = await db
    .select()
    .from(nfcCards)
    .where(and(eq(nfcCards.id, id!), eq(nfcCards.userId, req.userId!)))
    .limit(1);

  if (!card) {
    res.status(404).json({ error: "Carte introuvable" });
    return;
  }

  const [updated] = await db
    .update(nfcCards)
    .set({ isActive: false })
    .where(eq(nfcCards.id, id!))
    .returning();

  // If this was the active tier, recalculate the highest active tier
  const remaining = await db
    .select()
    .from(nfcCards)
    .where(and(eq(nfcCards.userId, req.userId!), eq(nfcCards.isActive, true)));

  const tierOrder = ["none", "standard", "prime", "platinum"];
  const highestTier = remaining.reduce((best, c) => {
    return tierOrder.indexOf(c.tier) > tierOrder.indexOf(best) ? c.tier : best;
  }, "none" as string);

  await db.update(users).set({ nfcTier: highestTier as any, updatedAt: new Date() }).where(eq(users.id, req.userId!));

  res.json({ card: updated });
});

/**
 * DELETE /api/nfc-cards/:id
 * Delete a specific NFC card (only inactive ones)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [card] = await db
    .select()
    .from(nfcCards)
    .where(and(eq(nfcCards.id, id!), eq(nfcCards.userId, req.userId!)))
    .limit(1);

  if (!card) {
    res.status(404).json({ error: "Carte introuvable" });
    return;
  }

  await db.delete(nfcCards).where(eq(nfcCards.id, id!));

  // Recalculate highest tier
  const remaining = await db
    .select()
    .from(nfcCards)
    .where(and(eq(nfcCards.userId, req.userId!), eq(nfcCards.isActive, true)));

  const tierOrder = ["none", "standard", "prime", "platinum"];
  const highestTier = remaining.reduce((best, c) => {
    return tierOrder.indexOf(c.tier) > tierOrder.indexOf(best) ? c.tier : best;
  }, "none" as string);

  await db.update(users).set({ nfcTier: highestTier as any, updatedAt: new Date() }).where(eq(users.id, req.userId!));

  res.json({ message: "Carte supprimée" });
});

export default router;
