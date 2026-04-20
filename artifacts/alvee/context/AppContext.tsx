import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  nfcCardId?: string;
  nfcCardOrdered: boolean;
  eventsAttended: number;
  eventsCreated: number;
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
  totalPoints: number;
  requiresNFC: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  surveyCompleted?: boolean;
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
}

export interface PointTransaction {
  id: string;
  type: "event_booking" | "survey_bonus" | "referral";
  points: number;
  description: string;
  eventId?: string;
  createdAt: string;
}

interface AppContextType {
  user: User | null;
  events: Event[];
  bookings: Booking[];
  pointTransactions: PointTransaction[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createEvent: (event: Omit<Event, "id" | "currentParticipants" | "totalPoints" | "status">) => Promise<Event>;
  bookEvent: (eventId: string) => Promise<Booking | null>;
  cancelBooking: (bookingId: string) => Promise<void>;
  validateQRCode: (eventId: string, qrCode: string) => Promise<{ success: boolean; message: string }>;
  validateNFC: (eventId: string, nfcCardId: string) => Promise<{ success: boolean; message: string }>;
  linkNFCToBooking: (bookingId: string, nfcCardId: string) => Promise<boolean>;
  orderNFCCard: () => Promise<boolean>;
  completeSurvey: (eventId: string, rating: number, feedback: string) => Promise<void>;
  getUserBookingForEvent: (eventId: string) => Booking | undefined;
  getEventBookings: (eventId: string) => Booking[];
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  addPoints: (points: number, type: PointTransaction["type"], description: string, eventId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "alvee_user",
  EVENTS: "alvee_events",
  BOOKINGS: "alvee_bookings",
  TRANSACTIONS: "alvee_transactions",
  ALL_USERS: "alvee_all_users",
};

const CATEGORY_IMAGES: Record<string, string> = {
  Music: "🎵",
  Sport: "⚽",
  Art: "🎨",
  Tech: "💻",
  Food: "🍕",
  Social: "🤝",
  Networking: "🌐",
  Party: "🎉",
};

function computePointsForBooking(event: Event, registrationOrder: number): number {
  const totalPoints = event.totalPoints;
  const maxP = event.maxParticipants;
  const earlyThreshold = Math.floor(maxP * 0.4);

  if (registrationOrder <= earlyThreshold) {
    const earlyPool = Math.floor(totalPoints * 0.7);
    return Math.floor(earlyPool / earlyThreshold);
  } else {
    const latePool = Math.floor(totalPoints * 0.3);
    const lateCount = maxP - earlyThreshold;
    return Math.floor(latePool / lateCount);
  }
}

function computeEventTotalPoints(price: number, maxParticipants: number): number {
  return Math.floor(price * maxParticipants * 10);
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: "event_001",
    title: "Soirée Jazz & Connexions",
    description: "Une soirée intime autour du jazz live, pensée pour créer des rencontres authentiques. Venez partager des moments musicaux uniques et rencontrer des gens passionnés.",
    category: "Music",
    date: "2026-05-15",
    time: "20:00",
    location: "Le Jazz Club Parisien",
    address: "15 Rue de la Paix, Paris 75001",
    price: 25,
    maxParticipants: 50,
    currentParticipants: 18,
    organizerId: "user_org_01",
    organizerName: "Marie Dupont",
    totalPoints: computeEventTotalPoints(25, 50),
    requiresNFC: false,
    status: "upcoming",
  },
  {
    id: "event_002",
    title: "Tech Meetup — IA & Futur",
    description: "Rejoignez les passionnés de technologie pour explorer ensemble l'avenir de l'intelligence artificielle. Présentations, débats et networking.",
    category: "Tech",
    date: "2026-05-20",
    time: "18:30",
    location: "Station F",
    address: "5 Parvis Alan Turing, Paris 75013",
    price: 15,
    maxParticipants: 100,
    currentParticipants: 42,
    organizerId: "user_org_02",
    organizerName: "Karim Benali",
    totalPoints: computeEventTotalPoints(15, 100),
    requiresNFC: true,
    status: "upcoming",
  },
  {
    id: "event_003",
    title: "Brunch Art & Rencontres",
    description: "Un brunch dominical dans une galerie d'art contemporain. L'occasion parfaite pour rencontrer des artistes et des amateurs d'art dans un cadre inspirant.",
    category: "Art",
    date: "2026-05-25",
    time: "11:00",
    location: "Galerie Contemporaine",
    address: "28 Rue Oberkampf, Paris 75011",
    price: 30,
    maxParticipants: 30,
    currentParticipants: 12,
    organizerId: "user_org_03",
    organizerName: "Sophie Martin",
    totalPoints: computeEventTotalPoints(30, 30),
    requiresNFC: false,
    status: "upcoming",
  },
  {
    id: "event_004",
    title: "Run & Connect",
    description: "Une course matinale de 5km suivie d'un petit-déjeuner convivial. Que vous soyez débutant ou confirmé, venez courir et rencontrer des gens actifs.",
    category: "Sport",
    date: "2026-06-01",
    time: "08:00",
    location: "Bois de Boulogne",
    address: "Allée de Longchamp, Paris 75016",
    price: 10,
    maxParticipants: 80,
    currentParticipants: 35,
    organizerId: "user_org_04",
    organizerName: "Alex Petit",
    totalPoints: computeEventTotalPoints(10, 80),
    requiresNFC: false,
    status: "upcoming",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, eventsData, bookingsData, txData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS),
        AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
      ]);

      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAuthenticated(true);
      }
      if (eventsData) {
        const parsed = JSON.parse(eventsData);
        setEvents([...SAMPLE_EVENTS.filter(e => !parsed.find((pe: Event) => pe.id === e.id)), ...parsed]);
      }
      if (bookingsData) setBookings(JSON.parse(bookingsData));
      if (txData) setPointTransactions(JSON.parse(txData));
    } catch (e) {}
  };

  const saveUser = async (u: User) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  };

  const saveEvents = async (evs: Event[]) => {
    const customEvents = evs.filter(e => !SAMPLE_EVENTS.find(se => se.id === e.id));
    await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(customEvents));
  };

  const saveBookings = async (bs: Booking[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bs));
  };

  const saveTx = async (txs: PointTransaction[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  };

  const addPoints = useCallback((points: number, type: PointTransaction["type"], description: string, eventId?: string) => {
    const tx: PointTransaction = {
      id: `tx_${Date.now()}`,
      type,
      points,
      description,
      eventId,
      createdAt: new Date().toISOString(),
    };
    setPointTransactions(prev => {
      const next = [tx, ...prev];
      saveTx(next);
      return next;
    });
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, points: prev.points + points };
      saveUser(next);
      return next;
    });
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    try {
      const allUsersStr = await AsyncStorage.getItem(STORAGE_KEYS.ALL_USERS);
      const allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [];
      const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        setIsAuthenticated(true);
        await saveUser(found);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const register = async (name: string, email: string, _password: string): Promise<boolean> => {
    try {
      const allUsersStr = await AsyncStorage.getItem(STORAGE_KEYS.ALL_USERS);
      const allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [];
      if (allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;

      const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        points: 100,
        nfcCardOrdered: false,
        eventsAttended: 0,
        eventsCreated: 0,
      };
      allUsers.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
      setUser(newUser);
      setIsAuthenticated(true);
      await saveUser(newUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    AsyncStorage.removeItem(STORAGE_KEYS.USER);
  };

  const createEvent = async (eventData: Omit<Event, "id" | "currentParticipants" | "totalPoints" | "status">): Promise<Event> => {
    const totalPoints = computeEventTotalPoints(eventData.price, eventData.maxParticipants);
    const newEvent: Event = {
      ...eventData,
      id: `event_${Date.now()}`,
      currentParticipants: 0,
      totalPoints,
      status: "upcoming",
    };
    const next = [...events, newEvent];
    setEvents(next);
    await saveEvents(next);

    if (user) {
      const updatedUser = { ...user, eventsCreated: user.eventsCreated + 1 };
      setUser(updatedUser);
      await saveUser(updatedUser);
    }

    return newEvent;
  };

  const bookEvent = async (eventId: string): Promise<Booking | null> => {
    if (!user) return null;

    const event = events.find(e => e.id === eventId);
    if (!event || event.currentParticipants >= event.maxParticipants) return null;

    const alreadyBooked = bookings.find(b => b.eventId === eventId && b.userId === user.id && b.status === "active");
    if (alreadyBooked) return alreadyBooked;

    const registrationOrder = event.currentParticipants + 1;
    const pointsEarned = computePointsForBooking(event, registrationOrder);

    const booking: Booking = {
      id: `booking_${Date.now()}`,
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      registrationOrder,
      qrCode: `ALVEE-${eventId}-${user.id}-${Date.now()}`,
      nfcLinked: false,
      status: "active",
      pointsEarned,
      bookedAt: new Date().toISOString(),
    };

    const nextBookings = [...bookings, booking];
    setBookings(nextBookings);
    await saveBookings(nextBookings);

    const nextEvents = events.map(e =>
      e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e
    );
    setEvents(nextEvents);
    await saveEvents(nextEvents);

    addPoints(pointsEarned, "event_booking", `Inscription: ${event.title}`, eventId);

    const updatedUser = { ...user, points: user.points + pointsEarned };
    setUser(updatedUser);

    return booking;
  };

  const cancelBooking = async (bookingId: string) => {
    const next = bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" as const } : b);
    setBookings(next);
    await saveBookings(next);
  };

  const validateQRCode = async (eventId: string, qrCode: string): Promise<{ success: boolean; message: string }> => {
    const booking = bookings.find(b => b.eventId === eventId && b.qrCode === qrCode && b.status === "active");
    if (!booking) return { success: false, message: "QR code invalide ou déjà utilisé" };

    const next = bookings.map(b => b.id === booking.id ? { ...b, status: "used" as const } : b);
    setBookings(next);
    await saveBookings(next);
    return { success: true, message: `Entrée validée pour ${booking.userName}` };
  };

  const validateNFC = async (eventId: string, nfcCardId: string): Promise<{ success: boolean; message: string }> => {
    const booking = bookings.find(b => b.eventId === eventId && b.nfcCardId === nfcCardId && b.status === "active");
    if (!booking) return { success: false, message: "Carte NFC non reconnue pour cet événement" };

    const next = bookings.map(b => b.id === booking.id ? { ...b, status: "used" as const } : b);
    setBookings(next);
    await saveBookings(next);
    return { success: true, message: `Entrée validée via NFC pour ${booking.userName}` };
  };

  const linkNFCToBooking = async (bookingId: string, nfcCardId: string): Promise<boolean> => {
    const next = bookings.map(b =>
      b.id === bookingId ? { ...b, nfcLinked: true, nfcCardId } : b
    );
    setBookings(next);
    await saveBookings(next);
    if (user) {
      const updatedUser = { ...user, nfcCardId };
      setUser(updatedUser);
      await saveUser(updatedUser);
    }
    return true;
  };

  const orderNFCCard = async (): Promise<boolean> => {
    if (!user) return false;
    const nfcCardId = `NFC-${Date.now().toString(36).toUpperCase()}`;
    const updated = { ...user, nfcCardOrdered: true, nfcCardId };
    setUser(updated);
    await saveUser(updated);
    return true;
  };

  const completeSurvey = async (eventId: string, rating: number, _feedback: string) => {
    const bonusPoints = 50 + (rating * 10);
    const event = events.find(e => e.id === eventId);
    addPoints(bonusPoints, "survey_bonus", `Sondage: ${event?.title ?? "Événement"}`, eventId);

    const nextEvents = events.map(e =>
      e.id === eventId ? { ...e, surveyCompleted: true } : e
    );
    setEvents(nextEvents);
    await saveEvents(nextEvents);
  };

  const getUserBookingForEvent = (eventId: string): Booking | undefined => {
    if (!user) return undefined;
    return bookings.find(b => b.eventId === eventId && b.userId === user.id && b.status === "active");
  };

  const getEventBookings = (eventId: string): Booking[] => {
    return bookings.filter(b => b.eventId === eventId);
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    const next = events.map(e => e.id === eventId ? { ...e, ...updates } : e);
    setEvents(next);
    await saveEvents(next);
  };

  const cancelEvent = async (eventId: string) => {
    await updateEvent(eventId, { status: "cancelled" });
  };

  return (
    <AppContext.Provider value={{
      user, events, bookings, pointTransactions, isAuthenticated,
      login, register, logout,
      createEvent, bookEvent, cancelBooking,
      validateQRCode, validateNFC,
      linkNFCToBooking, orderNFCCard,
      completeSurvey,
      getUserBookingForEvent, getEventBookings,
      updateEvent, cancelEvent,
      addPoints,
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
