import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Middleware factory that validates req.body against a Zod schema.
 * Returns 400 with validation errors if the body doesn't match.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ error: "Données invalides", details: errors });
      return;
    }

    req.body = result.data;
    next();
  };
}
