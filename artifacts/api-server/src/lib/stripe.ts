import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Get the Stripe instance.
 * Returns null if STRIPE_SECRET_KEY is not configured.
 * This prevents crashes in development when Stripe is not set up.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }

  return stripeInstance;
}
