import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";

// Extend Express Request to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Middleware that requires a valid JWT token.
 * Extracts the token from the Authorization header: "Bearer <token>"
 * Attaches userId and userEmail to the request object.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token d'authentification manquant" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token!);

  if (!payload) {
    res.status(401).json({ error: "Token invalide ou expiré" });
    return;
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}

/**
 * Optional auth middleware — does not reject requests without a token.
 * Useful for public routes that behave differently for authenticated users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token!);
    if (payload) {
      req.userId = payload.userId;
      req.userEmail = payload.email;
    }
  }

  next();
}
