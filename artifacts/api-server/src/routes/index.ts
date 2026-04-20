import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import eventsRouter from "./events.js";
import bookingsRouter from "./bookings.js";
import nfcCardsRouter from "./nfc-cards.js";
import messagesRouter from "./messages.js";
import notificationsRouter from "./notifications.js";
import paymentsRouter from "./payments.js";

const router: IRouter = Router();

// Public health check
router.use(healthRouter);

// Authentication — register, login, profile
router.use("/auth", authRouter);

// Core app features
router.use("/events", eventsRouter);
router.use("/bookings", bookingsRouter);
router.use("/nfc-cards", nfcCardsRouter);
router.use("/messages", messagesRouter);
router.use("/notifications", notificationsRouter);
router.use("/payments", paymentsRouter);

export default router;
