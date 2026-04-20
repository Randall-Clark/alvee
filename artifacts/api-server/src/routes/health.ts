import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /healthz
 * Simple health check used by load balancers and deployment checks
 */
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
