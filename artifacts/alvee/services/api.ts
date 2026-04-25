import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Event, User, CardTier } from "@/context/AppContext";

// ─── Base URL ─────────────────────────────────────────────────────────────────

function getApiBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return `${url}/api`;
  return "http://localhost:8080/api";
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = "alvee_token";

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Fetch helper ──────────────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<any> {
  const base = getApiBase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}

// ─── Event mapping ────────────────────────────────────────────────────────────

function computePoints(price: number): number {
  if (price < 100) return 20;
  if (price <= 500) return 45;
  return 100;
}

export function mapApiEvent(row: any): Event {
  const price = typeof row.price === "string" ? parseFloat(row.price) : (row.price ?? 0);
  const evDate = new Date(`${row.date}T${row.time ?? "00:00"}`);
  const now = new Date();
  const status: Event["status"] =
    row.isPublished === false
      ? "cancelled"
      : evDate < now
      ? "completed"
      : "upcoming";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "Social",
    date: row.date,
    time: row.time ?? "00:00",
    location: row.location,
    address: row.address ?? row.location ?? "",
    price,
    maxParticipants: row.capacity ?? 100,
    currentParticipants: row.currentParticipants ?? row.bookedCount ?? 0,
    organizerId: row.organizerId ?? "",
    organizerName: row.organizerName ?? "Organisateur",
    imageUrl: row.imageUrl ?? undefined,
    coverImage: "",
    totalPoints: computePoints(price),
    nfcOnlyEntry: row.nfcOnlyEntry ?? false,
    status,
    tags: row.tags ?? [],
    latitude: row.latitude != null ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude != null ? parseFloat(row.longitude) : undefined,
  };
}

// ─── User mapping ─────────────────────────────────────────────────────────────

export function mapApiUser(apiUser: any): Partial<User> {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? undefined,
    avatar: apiUser.avatarUrl ?? undefined,
    nfcCardOrdered: apiUser.nfcTier !== "none",
    nfcCardTier: (apiUser.nfcTier ?? "none") as CardTier,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string, phone?: string): Promise<{ token: string; user: any }> {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
  },

  async me(token: string): Promise<{ user: any }> {
    return apiFetch("/auth/me", {}, token);
  },

  async updateProfile(token: string, updates: { name?: string; phone?: string; avatarUrl?: string }): Promise<{ user: any }> {
    return apiFetch("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }, token);
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = {
  async list(token?: string | null): Promise<{ events: Event[] }> {
    const data = await apiFetch("/events?dateFrom=2020-01-01", {}, token);
    return { events: (data.events ?? []).map(mapApiEvent) };
  },

  async get(id: string, token?: string | null): Promise<{ event: Event }> {
    const data = await apiFetch(`/events/${id}`, {}, token);
    return { event: mapApiEvent(data.event) };
  },

  async create(
    token: string,
    data: {
      title: string;
      description?: string;
      category?: string;
      date: string;
      time: string;
      location: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      price: number;
      capacity: number;
      imageUrl?: string;
      nfcOnlyEntry?: boolean;
    },
  ): Promise<{ event: Event }> {
    const res = await apiFetch("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
    return { event: mapApiEvent(res.event) };
  },
};

// ─── NFC Cards ────────────────────────────────────────────────────────────────

export interface NfcCardItem {
  id: string;
  tier: CardTier;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export const nfcCards = {
  async list(token: string): Promise<{ cards: NfcCardItem[] }> {
    return apiFetch("/nfc-cards", {}, token);
  },

  async subscribe(token: string, tier: CardTier): Promise<{ clientSecret: string | null; message?: string; card?: NfcCardItem }> {
    return apiFetch("/nfc-cards/subscribe", {
      method: "POST",
      body: JSON.stringify({ tier }),
    }, token);
  },

  async activate(token: string, tier: CardTier, stripePaymentIntentId?: string): Promise<{ card: NfcCardItem }> {
    return apiFetch("/nfc-cards/activate", {
      method: "POST",
      body: JSON.stringify({ tier, stripePaymentIntentId }),
    }, token);
  },

  async deactivate(token: string, id: string): Promise<{ card: NfcCardItem }> {
    return apiFetch(`/nfc-cards/${id}/deactivate`, { method: "PATCH" }, token);
  },

  async remove(token: string, id: string): Promise<void> {
    await apiFetch(`/nfc-cards/${id}`, { method: "DELETE" }, token);
  },
};
