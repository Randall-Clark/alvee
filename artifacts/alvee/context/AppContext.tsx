import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "@/services/api";

export type CardTier = "none" | "standard" | "prime" | "platinum";
export type { NfcCardItem } from "@/services/api";

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
  imageUrl?: string;
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

export function computeEventPoints(priceCad: number): number {
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

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`;
}

import type { NfcCardItem } from "@/services/api";

interface AppContextType {
  user: User | null;
  events: Event[];
  bookings: Booking[];
  pointTransactions: PointTransaction[];
  notifications: AppNotification[];
  messages: Message[];
  conversations: Conversation[];
  isAuthenticated: boolean;
  authToken: string | null;
  unreadNotifCount: number;
  unreadMsgCount: number;
  nfcCardsList: NfcCardItem[];
  eventsLoading: boolean;
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
  refreshEvents: () => Promise<void>;
  refreshNfcCards: () => Promise<void>;
  deactivateNfcCard: (id: string) => Promise<boolean>;
  deleteNfcCard: (id: string) => Promise<boolean>;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [nfcCardsList, setNfcCardsList] = useState<NfcCardItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const saveUser = (u: User) => AsyncStorage.setItem(SK.USER, JSON.stringify(u));
  const saveBookings = (bs: Booking[]) => AsyncStorage.setItem(SK.BOOKINGS, JSON.stringify(bs));
  const saveTx = (txs: PointTransaction[]) => AsyncStorage.setItem(SK.TRANSACTIONS, JSON.stringify(txs));
  const saveNotifs = (ns: AppNotification[]) => AsyncStorage.setItem(SK.NOTIFICATIONS, JSON.stringify(ns));
  const saveMsgs = (ms: Message[]) => AsyncStorage.setItem(SK.MESSAGES, JSON.stringify(ms));

  const loadEventsFromApi = async (token?: string | null) => {
    try {
      setEventsLoading(true);
      const { events: apiEvs } = await api.events.list(token);
      setEvents(apiEvs);
    } catch {
      const ed = await AsyncStorage.getItem(SK.EVENTS);
      if (ed) setEvents(JSON.parse(ed));
    } finally {
      setEventsLoading(false);
    }
  };

  const loadNfcCards = async (token: string) => {
    try {
      const { cards } = await api.nfcCards.list(token);
      setNfcCardsList(cards);
    } catch {}
  };

  const buildUser = (apiUser: any, localUser: User | null): User => {
    const defaults: User = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      points: 150,
      nfcCardOrdered: false,
      nfcCardTier: "none",
      eventsAttended: 0,
      eventsCreated: 0,
      savedPaymentMethods: [],
      referralCode: generateReferralCode(apiUser.name),
      referralCount: 0,
    };
    return { ...defaults, ...localUser, ...api.mapApiUser(apiUser) } as User;
  };

  const loadData = async () => {
    try {
      let loggedInFromApi = false;
      const token = await api.loadToken();
      if (token) {
        try {
          const { user: apiUser } = await api.auth.me(token);
          const localUserStr = await AsyncStorage.getItem(SK.USER);
          const localUser: User | null = localUserStr ? JSON.parse(localUserStr) : null;
          const restored = buildUser(apiUser, localUser);
          setUser(restored);
          setIsAuthenticated(true);
          setAuthToken(token);
          await saveUser(restored);
          loggedInFromApi = true;
          loadEventsFromApi(token);
          loadNfcCards(token);
        } catch {
          await api.clearToken();
        }
      }

      if (!loggedInFromApi) {
        loadEventsFromApi(null);
      }

      const [ud, bd, txd, nd, md] = await Promise.all([
        AsyncStorage.getItem(SK.USER),
        AsyncStorage.getItem(SK.BOOKINGS),
        AsyncStorage.getItem(SK.TRANSACTIONS),
        AsyncStorage.getItem(SK.NOTIFICATIONS),
        AsyncStorage.getItem(SK.MESSAGES),
      ]);
      if (!loggedInFromApi && ud) { setUser(JSON.parse(ud)); setIsAuthenticated(true); }
      if (bd) setBookings(JSON.parse(bd));
      if (txd) setPointTransactions(JSON.parse(txd));
      if (nd) setNotifications(JSON.parse(nd));
      if (md) setMessages(JSON.parse(md));
    } catch (_e) {}
  };

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const notif: AppNotification = { ...n, id: `notif_${Date.now()}`, read: false, createdAt: new Date().toISOString() };
    setNotifications(prev => { const next = [notif, ...prev]; saveNotifs(next); return next; });
  }, []);

  const addPoints = useCallback((points: number, type: PointTransaction["type"], description: string, eventId?: string) => {
    const tx: PointTransaction = { id: `tx_${Date.now()}`, type, points, description, eventId, createdAt: new Date().toISOString() };
    setPointTransactions(prev => { const next = [tx, ...prev]; saveTx(next); return next; });
    setUser(prev => { if (!prev) return prev; const next = { ...prev, points: prev.points + points }; saveUser(next); return next; });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await api.auth.login(email, password);
      await api.saveToken(token);
      setAuthToken(token);
      const localUserStr = await AsyncStorage.getItem(SK.USER);
      const localUser: User | null = localUserStr ? JSON.parse(localUserStr) : null;
      const merged = buildUser(apiUser, localUser);
      setUser(merged);
      setIsAuthenticated(true);
      await saveUser(merged);
      loadEventsFromApi(token);
      loadNfcCards(token);
      return true;
    } catch {
      try {
        const s = await AsyncStorage.getItem(SK.ALL_USERS);
        const all: User[] = s ? JSON.parse(s) : [];
        const found = all.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found) { setUser(found); setIsAuthenticated(true); await saveUser(found); return true; }
      } catch {}
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, country?: string, phone?: string, _address?: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await api.auth.register(name, email, password, phone);
      await api.saveToken(token);
      setAuthToken(token);
      const newUser: User = {
        id: apiUser.id, name, email,
        points: 150, nfcCardOrdered: false, nfcCardTier: "none",
        eventsAttended: 0, eventsCreated: 0, savedPaymentMethods: [],
        referralCode: generateReferralCode(name), referralCount: 0,
        phone, country,
        ...api.mapApiUser(apiUser),
      } as User;
      setUser(newUser); setIsAuthenticated(true); await saveUser(newUser);
      addNotification({ type: "points", title: "Bienvenue sur Alvee !", body: "Votre compte est créé. Explorez les événements !" });
      loadEventsFromApi(token);
      return true;
    } catch {
      try {
        const s = await AsyncStorage.getItem(SK.ALL_USERS);
        const all: User[] = s ? JSON.parse(s) : [];
        if (all.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;
        const newUser: User = { id: `user_${Date.now()}`, name, email, points: 150, nfcCardOrdered: false, nfcCardTier: "none", eventsAttended: 0, eventsCreated: 0, savedPaymentMethods: [], country, phone, referralCode: generateReferralCode(name), referralCount: 0 };
        all.push(newUser);
        await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all));
        setUser(newUser); setIsAuthenticated(true); await saveUser(newUser);
        addNotification({ type: "points", title: "Bienvenue sur Alvee !", body: "Vous avez reçu 150 points de bienvenue." });
        return true;
      } catch { return false; }
    }
  };

  const socialLogin = async (_provider: "google" | "apple" | "facebook", profile: { name: string; email: string; country?: string; phone?: string }): Promise<boolean> => {
    try {
      const s = await AsyncStorage.getItem(SK.ALL_USERS);
      const all: User[] = s ? JSON.parse(s) : [];
      let found = all.find(u => u.email.toLowerCase() === profile.email.toLowerCase());
      if (found) { setUser(found); setIsAuthenticated(true); await saveUser(found); return true; }
      const newUser: User = { id: `user_${Date.now()}`, name: profile.name, email: profile.email, points: 150, nfcCardOrdered: false, nfcCardTier: "none", eventsAttended: 0, eventsCreated: 0, savedPaymentMethods: [], country: profile.country, phone: profile.phone, referralCode: generateReferralCode(profile.name), referralCount: 0 };
      all.push(newUser);
      await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all));
      setUser(newUser); setIsAuthenticated(true); await saveUser(newUser);
      addNotification({ type: "points", title: "Bienvenue sur Alvee !", body: "Vous avez reçu 150 points de bienvenue." });
      return true;
    } catch { return false; }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    setNfcCardsList([]);
    api.clearToken();
    AsyncStorage.removeItem(SK.USER);
    loadEventsFromApi(null);
  };

  const createEvent = async (data: Omit<Event, "id" | "currentParticipants" | "totalPoints" | "status">): Promise<Event> => {
    if (authToken) {
      try {
        const { event } = await api.events.create(authToken, {
          title: data.title,
          description: data.description,
          category: data.category,
          date: data.date,
          time: data.time,
          location: data.location,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          price: data.price,
          capacity: data.maxParticipants,
          imageUrl: (data as any).imageUrl,
          nfcOnlyEntry: data.nfcOnlyEntry,
        });
        setEvents(prev => [event, ...prev]);
        if (user) { const u = { ...user, eventsCreated: user.eventsCreated + 1 }; setUser(u); await saveUser(u); }
        addNotification({ type: "booking", title: "Événement créé !", body: `"${event.title}" est maintenant visible.` });
        return event;
      } catch {}
    }
    const totalPoints = computeEventPoints(data.price);
    const ev: Event = { ...data, id: `event_${Date.now()}`, currentParticipants: 0, totalPoints, status: "upcoming" };
    setEvents(prev => [ev, ...prev]);
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
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e));
    addPoints(pointsEarned, "event_booking", `Inscription: ${event.title}`, eventId);
    addNotification({ type: "booking", title: "Réservation confirmée !", body: `Votre billet pour "${event.title}" est prêt. +${pointsEarned} pts !` });
    return booking;
  };

  const cancelBooking = async (bookingId: string): Promise<{ success: boolean; refunded: boolean; message: string }> => {
    if (!user) return { success: false, refunded: false, message: "Non connecté" };
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, refunded: false, message: "Billet introuvable" };
    const event = events.find(e => e.id === booking.eventId);
    if (!event) return { success: false, refunded: false, message: "Événement introuvable" };
    const eventDate = new Date(`${event.date}T${event.time}`);
    const hoursLeft = (eventDate.getTime() - Date.now()) / 3600000;
    const canRefund = (user.nfcCardTier === "standard" || user.nfcCardTier === "none") ? hoursLeft >= 24 : hoursLeft >= 0;
    const next = bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" as const } : b);
    setBookings(next); await saveBookings(next);
    setEvents(prev => prev.map(e => e.id === booking.eventId ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e));
    if (canRefund) {
      addNotification({ type: "refund", title: "Remboursement en cours", body: `Votre remboursement pour "${event.title}" sera traité sous 3-5 jours.` });
      return { success: true, refunded: true, message: "Réservation annulée. Remboursement sous 3-5 jours." };
    } else {
      addNotification({ type: "refund", title: "Annulation effectuée", body: `Participation à "${event.title}" annulée (sans remboursement).` });
      return { success: true, refunded: false, message: "Annulation effectuée. Aucun remboursement (délai dépassé)." };
    }
  };

  const walkInBooking = async (eventId: string): Promise<Booking | null> => {
    if (!user || user.nfcCardTier === "none") return null;
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
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e));
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
    if (authToken) {
      try {
        const result = await api.nfcCards.subscribe(authToken, tier);
        if (result.clientSecret === null) {
          const updated = { ...user, nfcCardOrdered: true, nfcCardTier: tier, nfcCardId: result.card?.id };
          setUser(updated); await saveUser(updated);
          await loadNfcCards(authToken);
          addNotification({ type: "booking", title: "Carte Alvee activée !", body: `Votre carte ${tier.charAt(0).toUpperCase() + tier.slice(1)} est active.` });
          return true;
        } else {
          addNotification({ type: "booking", title: "Paiement requis", body: "Complétez le paiement pour activer votre carte." });
          return false;
        }
      } catch {}
    }
    const nfcCardId = `NFC-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const updated = { ...user, nfcCardOrdered: true, nfcCardId, nfcCardTier: tier };
    setUser(updated); await saveUser(updated);
    addNotification({ type: "booking", title: "Carte Alvee commandée !", body: `Votre carte ${tier.charAt(0).toUpperCase() + tier.slice(1)} sera livrée sous 3-5 jours.` });
    return true;
  };

  const upgradeCard = async (tier: CardTier) => {
    return orderNFCCard(tier);
  };

  const completeSurvey = async (eventId: string, rating: number, _feedback: string) => {
    const bonusPoints = 50 + rating * 10;
    const event = events.find(e => e.id === eventId);
    addPoints(bonusPoints, "survey_bonus", `Sondage: ${event?.title ?? "Événement"}`, eventId);
    addNotification({ type: "points", title: "Merci pour votre avis !", body: `+${bonusPoints} points bonus crédités.` });
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, surveyCompleted: true } : e));
  };

  const getUserBookingForEvent = (eventId: string) => {
    if (!user) return undefined;
    return bookings.find(b => b.eventId === eventId && b.userId === user.id && b.status === "active");
  };

  const getEventBookings = (eventId: string) => bookings.filter(b => b.eventId === eventId);

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  };

  const cancelEvent = async (eventId: string) => updateEvent(eventId, { status: "cancelled" });

  const sendMessage = async (eventId: string, eventTitle: string, receiverId: string, receiverName: string, content: string) => {
    if (!user) return;
    const msg: Message = {
      id: `msg_${Date.now()}`, eventId, eventTitle,
      senderId: user.id, senderName: user.name, receiverId, content, createdAt: new Date().toISOString(), read: false,
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
      id: `cmt_${Date.now()}`, eventId, userId: user.id, userName: user.name, userAvatar: user.avatar,
      text, rating, createdAt: new Date().toISOString(),
    };
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, comments: [...(e.comments ?? []), comment] } : e));
  };

  const updateProfile = async (updates: Partial<Pick<User, "name" | "email" | "phone" | "avatar" | "country">>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated); await saveUser(updated);
    if (authToken) {
      try {
        await api.auth.updateProfile(authToken, {
          name: updates.name,
          phone: updates.phone,
          avatarUrl: updates.avatar,
        });
      } catch {}
    }
    const s = await AsyncStorage.getItem(SK.ALL_USERS);
    const all: User[] = s ? JSON.parse(s) : [];
    await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all.map(u => u.id === updated.id ? updated : u)));
  };

  const applyReferralCode = async (code: string): Promise<"ok" | "self" | "maxed" | "invalid"> => {
    if (!user) return "invalid";
    if (code.toUpperCase() === user.referralCode?.toUpperCase()) return "self";
    const s = await AsyncStorage.getItem(SK.ALL_USERS);
    const all: User[] = s ? JSON.parse(s) : [];
    const referrer = all.find(u => u.referralCode?.toUpperCase() === code.toUpperCase());
    if (!referrer) return "invalid";
    if ((referrer.referralCount ?? 0) >= 10) return "maxed";
    const updatedReferrer = { ...referrer, referralCount: (referrer.referralCount ?? 0) + 1 };
    await AsyncStorage.setItem(SK.ALL_USERS, JSON.stringify(all.map(u => u.id === referrer.id ? updatedReferrer : u)));
    addPoints(100, "referral", `Parrainage accepté par ${user.name}`);
    addPoints(50, "referral", `Invitation de ${referrer.name}`);
    addNotification({ type: "points", title: "Parrainage accepté !", body: `Vous avez gagné 50 points grâce au code de ${referrer.name} !` });
    return "ok";
  };

  const setEventPromoCode = async (eventId: string, promo: PromoCode | undefined) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, promoCode: promo } : e));
  };

  const requestPayout = async (eventId: string, accountId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, payoutSent: true, payoutAccountId: accountId } : e));
    addNotification({ type: "points", title: "Virement demandé", body: "Votre demande de virement a été enregistrée. Traitement sous 2-3 jours ouvrés." });
  };

  const refreshEvents = async () => {
    await loadEventsFromApi(authToken);
  };

  const refreshNfcCards = async () => {
    if (authToken) await loadNfcCards(authToken);
  };

  const deactivateNfcCard = async (id: string): Promise<boolean> => {
    if (!authToken) return false;
    try {
      await api.nfcCards.deactivate(authToken, id);
      await loadNfcCards(authToken);
      const activeCards = nfcCardsList.filter(c => c.id !== id && c.isActive);
      const tierOrder: CardTier[] = ["none", "standard", "prime", "platinum"];
      const highestTier = activeCards.reduce<CardTier>(
        (best, c) => tierOrder.indexOf(c.tier) > tierOrder.indexOf(best) ? c.tier : best,
        "none"
      );
      if (user) { const u = { ...user, nfcCardTier: highestTier, nfcCardOrdered: activeCards.length > 0 }; setUser(u); await saveUser(u); }
      return true;
    } catch { return false; }
  };

  const deleteNfcCard = async (id: string): Promise<boolean> => {
    if (!authToken) return false;
    try {
      await api.nfcCards.remove(authToken, id);
      await loadNfcCards(authToken);
      return true;
    } catch { return false; }
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
      isAuthenticated, authToken, unreadNotifCount, unreadMsgCount, nfcCardsList, eventsLoading,
      login, register, socialLogin, logout, createEvent, bookEvent, cancelBooking, walkInBooking,
      validateQRCode, validateNFC, linkNFCToBooking, orderNFCCard, upgradeCard, completeSurvey,
      getUserBookingForEvent, getEventBookings, updateEvent, cancelEvent, addPoints, addNotification,
      markNotifRead, markAllNotifsRead, sendMessage, markMsgRead,
      addPaymentMethod, removePaymentMethod,
      computeEventPoints, requiresMinCard,
      canAccessEvent: (price) => canAccessEvent(price, user?.nfcCardTier ?? "none"),
      addComment, updateProfile, applyReferralCode, setEventPromoCode, requestPayout,
      refreshEvents, refreshNfcCards, deactivateNfcCard, deleteNfcCard,
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
