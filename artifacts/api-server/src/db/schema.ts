import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const nfcTierEnum = pgEnum("nfc_tier", [
  "none",
  "standard",
  "prime",
  "platinum",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
  "used",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

/**
 * Users — application accounts
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  avatarUrl: text("avatar_url"),
  nfcTier: nfcTierEnum("nfc_tier").notNull().default("none"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Events — social meetups created by organizers
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  location: varchar("location", { length: 300 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  capacity: integer("capacity").notNull().default(100),
  organizerId: uuid("organizer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  nfcOnlyEntry: boolean("nfc_only_entry").notNull().default(false),
  requiresPrime: boolean("requires_prime").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Bookings — a user's reservation for an event
 */
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  qrCode: varchar("qr_code", { length: 100 }).notNull().unique(),
  isEarlyBird: boolean("is_early_bird").notNull().default(false),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

/**
 * NFC Cards — subscription tiers (Standard / Prime / Platinum)
 */
export const nfcCards = pgTable("nfc_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: nfcTierEnum("tier").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Messages — direct messages between users
 */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Notifications — in-app notifications for users
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  data: text("data"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Payments — Stripe payment records
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("cad"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", {
    length: 100,
  }).unique(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
