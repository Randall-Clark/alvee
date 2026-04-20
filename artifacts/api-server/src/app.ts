import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "*", // Update this to your app's domain in production
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parsers ─────────────────────────────────────────────────────────────

// Stripe webhook needs the raw body to verify signatures
// It must be mounted before express.json() for the /api/payments/webhook path
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", router);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route introuvable" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Erreur interne du serveur" });
});

export default app;
