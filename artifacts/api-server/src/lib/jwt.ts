import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";
const JWT_EXPIRES_IN = "30d";

export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Generate a signed JWT token for the given user
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token and return the decoded payload
 * Returns null if the token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
