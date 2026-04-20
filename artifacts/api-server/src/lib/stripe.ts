import Stripe from "stripe";

// ─── Replit Stripe connector ──────────────────────────────────────────────────
// Uses the Replit connectors proxy to get Stripe keys automatically.
// In development → uses Stripe Sandbox keys.
// In production  → uses Stripe Live keys.
// Never cache this client — tokens can expire.

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  // Fallback to environment variables if not running inside Replit connectors
  if (!xReplitToken || !hostname) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? "";

    if (!secretKey) {
      throw new Error(
        "Stripe non configuré: définissez STRIPE_SECRET_KEY ou connectez Stripe via Replit",
      );
    }

    return { secretKey, publishableKey };
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  const data = (await response.json()) as {
    items?: { settings: { publishable?: string; secret?: string } }[];
  };

  const settings = data.items?.[0];

  if (!settings?.settings.publishable || !settings?.settings.secret) {
    throw new Error(`Connexion Stripe ${targetEnvironment} introuvable`);
  }

  return {
    publishableKey: settings.settings.publishable,
    secretKey: settings.settings.secret,
  };
}

/**
 * Get a fresh Stripe client with the server-side secret key.
 * Call this on every request — never cache it.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: "2025-04-30.basil",
  });
}

/**
 * Get the Stripe publishable key (safe to send to the mobile app).
 */
export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

/**
 * Convenience wrapper that returns null instead of throwing
 * when Stripe is not configured. Use in optional Stripe flows.
 */
export async function tryGetStripeClient(): Promise<Stripe | null> {
  try {
    return await getUncachableStripeClient();
  } catch {
    return null;
  }
}
