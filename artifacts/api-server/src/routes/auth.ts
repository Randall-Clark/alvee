import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "../db/index.js";
import { hashPassword, verifyPassword } from "../lib/hash.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, phone })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      nfcTier: users.nfcTier,
      createdAt: users.createdAt,
    });

  const token = signToken({ userId: user!.id, email: user!.email });

  res.status(201).json({ token, user });
});

/**
 * POST /api/auth/login
 * Authenticate with email and password
 */
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  const { passwordHash: _, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile
 */
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      nfcTier: users.nfcTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json({ user });
});

/**
 * PATCH /api/auth/me
 * Update the authenticated user's profile
 */
router.patch("/me", requireAuth, async (req, res) => {
  const updateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  });

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const [updated] = await db
    .update(users)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(users.id, req.userId!))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      nfcTier: users.nfcTier,
      updatedAt: users.updatedAt,
    });

  res.json({ user: updated });
});

export default router;
