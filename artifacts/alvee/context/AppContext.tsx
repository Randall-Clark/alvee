import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CardTier = "none" | "standard" | "prime" | "platinum";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  nfcCardId?: string;
  nfcCardOrdered: boolean;
  nfcCardTier: CardTier;
  eventsAttended: number;
  eventsCreated: number;
  role?: string;
  savedPaymentMethods: PaymentMethod[];
  country?: string;
  phone?: string;
  address?: string;
  referralCode: string;
  referralCount: number;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  rating: number;
  createdAt: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizerName: string;
  coverImage?: string;
  coverImageUri?: string;
  totalPoints: number;
  nfcOnlyEntry: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  surveyCompleted?: boolean;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  comments?: EventComment[];
  promoCode?: PromoCode;
  payoutSent?: boolean;
  payoutAccountId?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationOrder: number;
  qrCode: string;
  nfcLinked: boolean;
  nfcCardId?: string;
  status: "active" | "used" | "cancelled";
  pointsEarned: number;
  bookedAt: string;
  role?: string;
  walkIn?: boolean;
}

export interface Message {
  id: string;
  eventId: string;
  eventTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  eventId: string;
  eventTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  type: "booking" | "event_reminder" | "points" | "walk_in_request" | "refund" | "message";
  title: string;
  body: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  type: "event_booking" | "survey_bonus" | "referral" | "walk_in";
  points: number;
  description: string;
  eventId?: string;
  createdAt: string;
}

function computeEventPoints(priceCad: number): number {
  if (priceCad < 100) return 20;
  if (priceCad <= 500) return 45;
  return 100;
}

function computePointsForBooking(totalPoints: number, registrationOrder: number, maxParticipants: number): number {
  const earlyThreshold = Math.floor(maxParticipants * 0.4);
  if (registrationOrder <= earlyThreshold) {
    return Math.floor((totalPoints * 0.7) / Math.max(earlyThreshold, 1));
  }
  const lateCount = maxParticipants - earlyThreshold;
  return Math.floor((totalPoints * 0.3) / Math.max(lateCount, 1));
}

export function requiresMinCard(price: number): CardTier | null {
  if (price >= 300) return "prime";
  return null;
}

export function canAccessEvent(price: number, userTier: CardTier): boolean {
  const req = requiresMinCard(price);
  if (!req) return true;
  const tiers: CardTier[] = ["none", "standard", "prime", "platinum"];
  return tiers.indexOf(userTier) >= tiers.indexOf(req);
}

export function refundDeadline(tier: CardTier): string {
  if (tier === "standard") return "24h avant";
  return "jour même";
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: "event_001", title: "Soirée Jazz & Connexions", description: "Une soirée intime autour du jazz live, pensée pour créer des rencontres authentiques.", category: "Music", date: "2026-05-15", time: "20:00", location: "Le Jazz Club Parisien", address: "15 Rue de la Paix, Paris 75001", price: 25, maxParticipants: 50, currentParticipants: 18, organizerId: "user_org_01", organizerName: "Marie Dupont", coverImage: "evt_jazz", totalPoints: computeEventPoints(25), nfcOnlyEntry: false, status: "upcoming", tags: ["Jazz", "Live Music", "Social"], latitude: 48.8698, longitude: 2.3311,
  },
  {
    id: "event_002", title: "Tech Meetup — IA & Futur", description: "Rejoignez les passionnés de technologie pour explorer l'avenir de l'intelligence artificielle.", category: "Tech", date: "2026-05-20", time: "18:30", location: "Station F", address: "5 Parvis Alan Turing, Paris 75013", price: 15, maxParticipants: 100, currentParticipants: 42, organizerId: "user_org_02", organizerName: "Karim Benali", coverImage: "evt_tech", totalPoints: computeEventPoints(15), nfcOnlyEntry: false, status: "upcoming", tags: ["AI", "Tech", "Networking"], latitude: 48.8300, longitude: 2.3664,
  },
  {
    id: "event_003", title: "Brunch Art & Rencontres", description: "Un brunch dominical dans une galerie d'art contemporain.", category: "Art", date: "2026-05-25", time: "11:00", location: "Galerie Contemporaine", address: "28 Rue Oberkampf, Paris 75011", price: 350, maxParticipants: 30, currentParticipants: 12, organizerId: "user_org_03", organizerName: "Sophie Martin", coverImage: "evt_art", totalPoints: computeEventPoints(350), nfcOnlyEntry: false, status: "upcoming", tags: ["Art", "Brunch", "Culture"], latitude: 48.8637, longitude: 2.3752,
  },
  {
    id: "event_004", title: "Run & Connect", description: "Une course matinale de 5km suivie d'un petit-déjeuner convivial.", category: "Sport", date: "2026-06-01", time: "08:00", location: "Bois de Boulogne", address: "Allée de Longchamp, Paris 75016", price: 10, maxParticipants: 80, currentParticipants: 35, organizerId: "user_org_04", organizerName: "Alex Petit", coverImage: "evt_run", totalPoints: computeEventPoints(10), nfcOnlyEntry: false, status: "upcoming", tags: ["Running", "Sport", "Social"], latitude: 48.8620, longitude: 2.2480,
  },
];

interface AppContextType {
  user: User | null;
  events: Event[];
  bookings: Booking[];
  pointTransactions: PointTransaction[];
  notifications: AppNotification[];
  messages: Message[];
  conversations: Conversation[];
  isAuthenticated: boolean;
  unreadNotifCount: number;
  unreadMsgCount: number;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, country?: string, phone?: string, address?: string) => Promise<boolean>;
  socialLogin: (provider: "google" | "apple" | "facebook", profile: { name: string; email: string; country?: string; phone?: string }) => Promise<boolean>;
  logout: () => void;
  createEvent: (event: Omit<Event, "id" | "currentParticipants" | "totalPoints" | "status">) => Promise<Event>;
  bookEvent: (eventId: string, role?: string) => Promise<Booking | null>;
  cancelBooking: (bookingId: string) => Promise<{ success: boolean; refunded: boolean; message: string }>;
  walkInBooking: (eventId: string) => Promise<Booking | null>;
  validateQRCode: (eventId: string, qrCode: string) => Promise<{ success: boolean; message: string }>;
  validateNFC: (eventId: string, nfcCardId: string) => Promise<{ success: boolean; message: string }>;
  linkNFCToBooking: (bookingId: string, nfcCardId: string) => Promise<boolean>;
  orderNFCCard: (tier: CardTier) => Promise<boolean>;
  upgradeCard: (tier: CardTier) => Promise<boolean>;
  completeSurvey: (eventId: string, rating: number, feedback: string) => Promise<void>;
  getUserBookingForEvent: (eventId: string) => Booking | undefined;
  getEventBookings: (eventId: string) => Booking[];
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  addPoints: (points: number, type: PointTransaction["type"], description: string, eventId?: string) => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  sendMessage: (eventId: string, eventTitle: string, receiverId: string, receiverName: string, content: string) => Promise<void>;
  markMsgRead: (msgId: string) => void;
  addPaymentMethod: (pm: Omit<PaymentMethod, "id">) => void;
  removePaymentMethod: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  computeEventPoints: (priceCad: number) => number;
  requiresMinCard: (price: number) => CardTier | null;
  canAccessEvent: (price: number) => boolean;
  addComment: (eventId: string, text: string, rating: number) => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "email" | "phone" | "avatar" | "country">>) => Promise<void>;
  applyReferralCode: (code: string) => Promise<"ok" | "self" | "maxed" | "invalid">;
  setEventPromoCode: (eventId: string, promo: PromoCode | undefined) => Promise<void>;
  requestPayout: (eventId: string, accountId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SK = {
  USER: "alvee_user",
  EVENTS: "alvee_events_v2",
  BOOKINGS: "alvee_bookings_v2",
  TRANSACTIONS: "alvee_transactions_v2",
  ALL_USERS: "alvee_all_users_v2",
  NOTIFICATIONS: "alvee_notifications",
  MESSAGES: "alvee_messages",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ud, ed, bd, txd, nd, md] = await Promise.all([
        AsyncStorage.getItem(SK.USER),
        AsyncStorage.getItem(SK.EVENTS),
        AsyncStorage.getItem(SK.BOOKINGS),
        AsyncStorage.getItem(SK.TRANSACTIONS),
        AsyncStorage.getItem(SK.NOTIFICATIONS),
        AsyncStorage.getItem(SK.MESSAGES),
      ]);
      if (ud) { setUser(JSON.parse(ud)); setIsAuthenticated(true); }
      if (ed) {
        const parsed: Event[] = JSON.parse(ed);
        const merged = [...SAMPLE_EVENTS.filter(e => !parsed.find(p => p.id === e.id)), ...parsed];
        setEvents(merged);
      }
      if (bd) setBookings(JSON.parse(bd));
      if (txd) setPointTransactions(JSON.parse(txd));
      if (nd) setNotifications(JSON.parse(nd));
      if (md) setMessages(JSON.parse(md));
    } catch (_e) {}
  };

  const saveUser = (u: User) => AsyncStorage.setItem(SK.USER, JSON.stringify(u));
  const saveEvents = (evs: Event[]) => AsyncStorage.setItem(SK.EVENTS, JSON.stringify(evs.filter(e => !SAMPLE_EVENTS.find(se => se.id === e.id))));
  const saveBookings = (bs: Booking[]) => AsyncStorage.setItem(SK.BOOKINGS, JSON.stringify(bs));
  const saveTx = (txs: PointTransaction[]) => AsyncStorage.setItem(SK.TRANSACTIONS, JSON.stringify(txs));
  const saveNotifs = (ns: AppNotification[]) => AsyncStorage.setItem(SK.NOTIFICATIONS, JSON.stringify(ns));
  const saveMsgs = (ms: Message[]) => AsyncStorage.setItem(SK.MESSAGES, JSON.stringify(ms));

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const notif: AppNotification = { ...n, id: `notif_${Date.now()}`, read: false, createdAt: new Date().toISOString() };
    setNotifications(prev => { const next = [notif, ...prev]; saveNotifs(next); return next; });
  }, []);

  const addPoints = useCallback((points: number, type: PointTransaction["type"], description: string, eventId?: string) => {
    const tx: PointTransaction = { id: `tx_${Date.now()}`, type, points, description, eventId, createdAt: new Date().toISOString() };
    setPointTransactions(prev => { const next = [tx, ...prev]; saveTx(next); return next; });
    setUser(prev => { if (!prev) return prev; const next = { ...prev, points: prev.points + points }; saveUser(next); return next; });
  }, []);

  const login = async (email: string, _pw: string): Promise<boolean> => {
    try {
      const s = await AsyncStorage.getItem(SK.ALL_USERS);
      const all: User[] = s ? JSON.parse(s) : [];
      const found = all.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) { setUser(found); setIsAuthenticated(true); await saveUser(found); return true; }
      return false;
    } catch { return false; }
  };

  function generateReferralCode(name: string): string {
    const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${base}${rand}`;
  }

  const register = async (name: string, email: string, _pw: string, country?: string, phone?: string, address?: string): Promise<boolean> => {
    try {
      const s = await AsyncStorage.getItem(SK.ALL_USERS);
      const all: User[] = s ? JSON.parse(s) : [];
      if (all.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;
      const newUser: User = { id: `user_${Date.now()}`, name, email, points: 150, nfcCardOrdered: false, nfcCardTier: "none", eventsAttended: 0, eventsCreated: 0, savedPaymentMethods: [], country, phone, address, referralCode: generateReferralCode(name), referralCount: 0 };
      all.push(newUser);
      await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all));
      setUser(newUser); setIsAuthenticated(true); await saveUser(newUser);
      addNotification({ type: "points", title: "Bienvenue sur Alvee !", body: "Vous avez reçu 150 points de bienvenue." });
      return true;
    } catch { return false; }
  };

  const socialLogin = async (_provider: "google" | "apple" | "facebook", profile: { name: string; email: string; country?: string; phone?: string }): Promise<boolean> => {
    try {
      const s = await AsyncStorage.getItem(SK.ALL_USERS);
      const all: User[] = s ? JSON.parse(s) : [];
      let found = all.find(u => u.email.toLowerCase() === profile.email.toLowerCase());
      if (found) {
        setUser(found); setIsAuthenticated(true); await saveUser(found);
        return true;
      }
      const newUser: User = { id: `user_${Date.now()}`, name: profile.name, email: profile.email, points: 150, nfcCardOrdered: false, nfcCardTier: "none", eventsAttended: 0, eventsCreated: 0, savedPaymentMethods: [], country: profile.country, phone: profile.phone, referralCode: generateReferralCode(profile.name), referralCount: 0 };
      all.push(newUser);
      await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all));
      setUser(newUser); setIsAuthenticated(true); await saveUser(newUser);
      addNotification({ type: "points", title: "Bienvenue sur Alvee !", body: "Vous avez reçu 150 points de bienvenue." });
      return true;
    } catch { return false; }
  };

  const logout = () => { setUser(null); setIsAuthenticated(false); AsyncStorage.removeItem(SK.USER); };

  const createEvent = async (data: Omit<Event, "id" | "currentParticipants" | "totalPoints" | "status">): Promise<Event> => {
    const totalPoints = computeEventPoints(data.price);
    const ev: Event = { ...data, id: `event_${Date.now()}`, currentParticipants: 0, totalPoints, status: "upcoming" };
    const next = [...events, ev];
    setEvents(next); await saveEvents(next);
    if (user) { const u = { ...user, eventsCreated: user.eventsCreated + 1 }; setUser(u); await saveUser(u); }
    addNotification({ type: "booking", title: "Événement créé !", body: `"${ev.title}" est maintenant visible.` });
    return ev;
  };

  const bookEvent = async (eventId: string, role?: string): Promise<Booking | null> => {
    if (!user) return null;
    const event = events.find(e => e.id === eventId);
    if (!event || event.currentParticipants >= event.maxParticipants) return null;
    const already = bookings.find(b => b.eventId === eventId && b.userId === user.id && b.status === "active");
    if (already) return already;
    if (!canAccessEvent(event.price, user.nfcCardTier)) return null;
    const registrationOrder = event.currentParticipants + 1;
    const pointsEarned = computePointsForBooking(event.totalPoints, registrationOrder, event.maxParticipants);
    const booking: Booking = {
      id: `booking_${Date.now()}`, eventId, userId: user.id, userName: user.name, userEmail: user.email,
      registrationOrder, qrCode: `ALVEE-${eventId}-${user.id}-${Date.now()}`,
      nfcLinked: false, status: "active", pointsEarned, bookedAt: new Date().toISOString(), role,
    };
    const nextBookings = [...bookings, booking];
    setBookings(nextBookings); await saveBookings(nextBookings);
    const nextEvents = events.map(e => e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e);
    setEvents(nextEvents); await saveEvents(nextEvents);
    addPoints(pointsEarned, "event_booking", `Inscription: ${event.title}`, eventId);
    addNotification({ type: "booking", title: "Réservation confirmée !", body: `Votre billet pour "${event.title}" est prêt. +${pointsEarned} points !` });
    return booking;
  };

  const cancelBooking = async (bookingId: string): Promise<{ success: boolean; refunded: boolean; message: string }> => {
    if (!user) return { success: false, refunded: false, message: "Non connecté" };
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, refunded: false, message: "Billet introuvable" };
    const event = events.find(e => e.id === booking.eventId);
    if (!event) return { success: false, refunded: false, message: "Événement introuvable" };

    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    const hoursLeft = (eventDate.getTime() - now.getTime()) / 3600000;

    let canRefund = false;
    if (user.nfcCardTier === "standard" || user.nfcCardTier === "none") {
      canRefund = hoursLeft >= 24;
    } else {
      canRefund = hoursLeft >= 0;
    }

    const next = bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" as const } : b);
    setBookings(next); await saveBookings(next);

    const nextEvents = events.map(e => e.id === booking.eventId ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e);
    setEvents(nextEvents); await saveEvents(nextEvents);

    if (canRefund) {
      addNotification({ type: "refund", title: "Remboursement en cours", body: `Votre remboursement pour "${event.title}" sera traité sous 3-5 jours.` });
      return { success: true, refunded: true, message: "Réservation annulée. Remboursement sous 3-5 jours." };
    } else {
      addNotification({ type: "refund", title: "Annulation effectuée", body: `Votre participation à "${event.title}" a été annulée (sans remboursement).` });
      return { success: true, refunded: false, message: "Annulation effectuée. Aucun remboursement (délai dépassé)." };
    }
  };

  const walkInBooking = async (eventId: string): Promise<Booking | null> => {
    if (!user || (user.nfcCardTier === "none")) return null;
    const event = events.find(e => e.id === eventId);
    if (!event) return null;
    const registrationOrder = event.currentParticipants + 1;
    const pointsEarned = computePointsForBooking(event.totalPoints, registrationOrder, event.maxParticipants);
    const booking: Booking = {
      id: `walkin_${Date.now()}`, eventId, userId: user.id, userName: user.name, userEmail: user.email,
      registrationOrder, qrCode: `WALKIN-${eventId}-${user.id}-${Date.now()}`,
      nfcLinked: true, nfcCardId: user.nfcCardId, status: "active", pointsEarned, bookedAt: new Date().toISOString(), walkIn: true,
    };
    const nextBookings = [...bookings, booking];
    setBookings(nextBookings); await saveBookings(nextBookings);
    const nextEvents = events.map(e => e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e);
    setEvents(nextEvents); await saveEvents(nextEvents);
    addPoints(pointsEarned, "walk_in", `Walk-in: ${event.title}`, eventId);
    return booking;
  };

  const validateQRCode = async (eventId: string, qrCode: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.nfcOnlyEntry) return { success: false, message: "Cet événement accepte uniquement la carte NFC" };
    const booking = bookings.find(b => b.eventId === eventId && b.qrCode === qrCode && b.status === "active");
    if (!booking) return { success: false, message: "QR code invalide ou déjà utilisé" };
    const next = bookings.map(b => b.id === booking.id ? { ...b, status: "used" as const } : b);
    setBookings(next); await saveBookings(next);
    return { success: true, message: `Entrée validée — ${booking.userName}` };
  };

  const validateNFC = async (eventId: string, nfcCardId: string) => {
    const booking = bookings.find(b => b.eventId === eventId && b.nfcCardId === nfcCardId && b.status === "active");
    if (!booking) return { success: false, message: "Aucun billet enregistré sur cette carte pour cet événement" };
    const next = bookings.map(b => b.id === booking.id ? { ...b, status: "used" as const } : b);
    setBookings(next); await saveBookings(next);
    return { success: true, message: `Entrée NFC validée — ${booking.userName}` };
  };

  const linkNFCToBooking = async (bookingId: string, nfcCardId: string) => {
    const next = bookings.map(b => b.id === bookingId ? { ...b, nfcLinked: true, nfcCardId } : b);
    setBookings(next); await saveBookings(next);
    if (user) { const u = { ...user, nfcCardId }; setUser(u); await saveUser(u); }
    return true;
  };

  const orderNFCCard = async (tier: CardTier) => {
    if (!user) return false;
    const nfcCardId = `NFC-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const updated = { ...user, nfcCardOrdered: true, nfcCardId, nfcCardTier: tier };
    setUser(updated); await saveUser(updated);
    addNotification({ type: "booking", title: "Carte Alvee commandée !", body: `Votre carte ${tier.charAt(0).toUpperCase() + tier.slice(1)} sera livrée sous 3-5 jours.` });
    return true;
  };

  const upgradeCard = async (tier: CardTier) => {
    if (!user) return false;
    const nfcCardId = user.nfcCardId ?? `NFC-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const updated = { ...user, nfcCardTier: tier, nfcCardId, nfcCardOrdered: true };
    setUser(updated); await saveUser(updated);
    addNotification({ type: "booking", title: "Carte mise à niveau !", body: `Votre carte a été mise à niveau vers ${tier.charAt(0).toUpperCase() + tier.slice(1)}.` });
    return true;
  };

  const completeSurvey = async (eventId: string, rating: number, _feedback: string) => {
    const bonusPoints = 50 + rating * 10;
    const event = events.find(e => e.id === eventId);
    addPoints(bonusPoints, "survey_bonus", `Sondage: ${event?.title ?? "Événement"}`, eventId);
    addNotification({ type: "points", title: "Merci pour votre avis !", body: `+${bonusPoints} points bonus crédités.` });
    const next = events.map(e => e.id === eventId ? { ...e, surveyCompleted: true } : e);
    setEvents(next); await saveEvents(next);
  };

  const getUserBookingForEvent = (eventId: string) => {
    if (!user) return undefined;
    return bookings.find(b => b.eventId === eventId && b.userId === user.id && b.status === "active");
  };

  const getEventBookings = (eventId: string) => bookings.filter(b => b.eventId === eventId);

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    const next = events.map(e => e.id === eventId ? { ...e, ...updates } : e);
    setEvents(next); await saveEvents(next);
  };

  const cancelEvent = async (eventId: string) => updateEvent(eventId, { status: "cancelled" });

  const sendMessage = async (eventId: string, eventTitle: string, receiverId: string, receiverName: string, content: string) => {
    if (!user) return;
    const msg: Message = {
      id: `msg_${Date.now()}`, eventId, eventTitle,
      senderId: user.id, senderName: user.name,
      receiverId, content, createdAt: new Date().toISOString(), read: false,
    };
    const next = [...messages, msg];
    setMessages(next); await saveMsgs(next);
    addNotification({ type: "message", title: `Message de ${user.name}`, body: content.slice(0, 80), data: { eventId } });
  };

  const markMsgRead = (msgId: string) => {
    const next = messages.map(m => m.id === msgId ? { ...m, read: true } : m);
    setMessages(next); saveMsgs(next);
  };

  const markNotifRead = (id: string) => {
    const next = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(next); saveNotifs(next);
  };

  const markAllNotifsRead = () => {
    const next = notifications.map(n => ({ ...n, read: true }));
    setNotifications(next); saveNotifs(next);
  };

  const addPaymentMethod = (pm: Omit<PaymentMethod, "id">) => {
    if (!user) return;
    const newPm: PaymentMethod = { ...pm, id: `pm_${Date.now()}` };
    const methods = [...(user.savedPaymentMethods ?? []), newPm];
    const u = { ...user, savedPaymentMethods: methods };
    setUser(u); saveUser(u);
  };

  const removePaymentMethod = (id: string) => {
    if (!user) return;
    const methods = (user.savedPaymentMethods ?? []).filter(p => p.id !== id);
    const u = { ...user, savedPaymentMethods: methods };
    setUser(u); saveUser(u);
  };

  const addComment = (eventId: string, text: string, rating: number) => {
    if (!user) return;
    const comment: EventComment = {
      id: `cmt_${Date.now()}`, eventId,
      userId: user.id, userName: user.name, userAvatar: user.avatar,
      text, rating, createdAt: new Date().toISOString(),
    };
    const next = events.map(e => e.id === eventId
      ? { ...e, comments: [...(e.comments ?? []), comment] }
      : e
    );
    setEvents(next); saveEvents(next);
  };

  const updateProfile = async (updates: Partial<Pick<User, "name" | "email" | "phone" | "avatar" | "country">>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated); await saveUser(updated);
    const s = await AsyncStorage.getItem(SK.ALL_USERS);
    const all: User[] = s ? JSON.parse(s) : [];
    const nextAll = all.map(u => u.id === updated.id ? updated : u);
    await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(nextAll));
  };

  const applyReferralCode = async (code: string): Promise<"ok" | "self" | "maxed" | "invalid"> => {
    if (!user) return "invalid";
    if (code.toUpperCase() === user.referralCode?.toUpperCase()) return "self";
    const s = await AsyncStorage.getItem(SK.ALL_USERS);
    const all: User[] = s ? JSON.parse(s) : [];
    const referrer = all.find(u => u.referralCode?.toUpperCase() === code.toUpperCase());
    if (!referrer) return "invalid";
    if ((referrer.referralCount ?? 0) >= 10) return "maxed";
    const POINTS_PER_REFERRAL = 100;
    const updatedReferrer = { ...referrer, referralCount: (referrer.referralCount ?? 0) + 1 };
    const nextAll = all.map(u => u.id === referrer.id ? updatedReferrer : u);
    await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(nextAll));
    addPoints(POINTS_PER_REFERRAL, "referral", `Parrainage accepté par ${user.name}`);
    const referredUser = { ...user };
    addPoints(50, "referral", `Invitation de ${referrer.name}`);
    void referredUser;
    addNotification({ type: "points", title: "Parrainage accepté !", body: `Vous avez gagné 50 points grâce au code de ${referrer.name} !` });
    return "ok";
  };

  const setEventPromoCode = async (eventId: string, promo: PromoCode | undefined) => {
    const next = events.map(e => e.id === eventId ? { ...e, promoCode: promo } : e);
    setEvents(next); await saveEvents(next);
  };

  const requestPayout = async (eventId: string, accountId: string) => {
    const next = events.map(e => e.id === eventId ? { ...e, payoutSent: true, payoutAccountId: accountId } : e);
    setEvents(next); await saveEvents(next);
    addNotification({ type: "points", title: "Virement demandé", body: "Votre demande de virement a été enregistrée. Traitement sous 2-3 jours ouvrés." });
  };

  const conversations: Conversation[] = (() => {
    if (!user) return [];
    const convMap = new Map<string, Conversation>();
    [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).forEach(m => {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      const otherName = m.senderId === user.id ? (m as any).receiverName ?? "Utilisateur" : m.senderName;
      const key = `${m.eventId}_${otherId}`;
      if (!convMap.has(key)) {
        const unread = messages.filter(x => x.senderId === otherId && x.receiverId === user.id && !x.read && x.eventId === m.eventId).length;
        convMap.set(key, { id: key, eventId: m.eventId, eventTitle: m.eventTitle, otherUserId: otherId, otherUserName: otherName, lastMessage: m.content, lastAt: m.createdAt, unreadCount: unread });
      }
    });
    return Array.from(convMap.values());
  })();

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const unreadMsgCount = messages.filter(m => m.receiverId === user?.id && !m.read).length;

  return (
    <AppContext.Provider value={{
      user, events, bookings, pointTransactions, notifications, messages, conversations,
      isAuthenticated, unreadNotifCount, unreadMsgCount,
      login, register, socialLogin, logout, createEvent, bookEvent, cancelBooking, walkInBooking,
      validateQRCode, validateNFC, linkNFCToBooking, orderNFCCard, upgradeCard, completeSurvey,
      getUserBookingForEvent, getEventBookings, updateEvent, cancelEvent, addPoints, addNotification,
      markNotifRead, markAllNotifsRead, sendMessage, markMsgRead,
      addPaymentMethod, removePaymentMethod,
      computeEventPoints, requiresMinCard, canAccessEvent: (price) => canAccessEvent(price, user?.nfcCardTier ?? "none"),
      addComment, updateProfile, applyReferralCode, setEventPromoCode, requestPayout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
