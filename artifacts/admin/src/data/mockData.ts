export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  nfcCardTier: "none" | "standard" | "prime" | "platinum";
  points: number;
  eventsAttended: number;
  eventsCreated: number;
  referralCount: number;
  createdAt: string;
  country: string;
  banned: boolean;
}

export interface AdminEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  organizerName: string;
  status: "upcoming" | "ongoing" | "past" | "cancelled";
  revenue: number;
  payoutSent: boolean;
  nfcOnlyEntry: boolean;
}

export interface RevenueEntry {
  month: string;
  revenus: number;
  frais: number;
  net: number;
}

export const MOCK_USERS: AdminUser[] = [
  { id: "u1", name: "Marie Dupont", email: "marie.dupont@email.com", phone: "+1 514-555-0101", nfcCardTier: "platinum", points: 2450, eventsAttended: 18, eventsCreated: 4, referralCount: 7, createdAt: "2024-03-15", country: "CA", banned: false },
  { id: "u2", name: "Jean Tremblay", email: "jean.tremblay@email.com", phone: "+1 438-555-0102", nfcCardTier: "prime", points: 1200, eventsAttended: 11, eventsCreated: 2, referralCount: 3, createdAt: "2024-05-22", country: "CA", banned: false },
  { id: "u3", name: "Sophie Martin", email: "sophie.martin@email.com", phone: "+33 06-55-01-03", nfcCardTier: "standard", points: 420, eventsAttended: 5, eventsCreated: 0, referralCount: 1, createdAt: "2024-07-10", country: "FR", banned: false },
  { id: "u4", name: "Lucas Bernard", email: "lucas.bernard@email.com", phone: "+1 514-555-0104", nfcCardTier: "none", points: 80, eventsAttended: 2, eventsCreated: 1, referralCount: 0, createdAt: "2024-09-01", country: "CA", banned: false },
  { id: "u5", name: "Emma Lefebvre", email: "emma.lefebvre@email.com", phone: "+1 450-555-0105", nfcCardTier: "prime", points: 980, eventsAttended: 9, eventsCreated: 0, referralCount: 4, createdAt: "2024-06-18", country: "CA", banned: false },
  { id: "u6", name: "Antoine Moreau", email: "antoine.moreau@email.com", phone: "+1 514-555-0106", nfcCardTier: "platinum", points: 3100, eventsAttended: 24, eventsCreated: 7, referralCount: 10, createdAt: "2024-02-28", country: "CA", banned: false },
  { id: "u7", name: "Chloé Simon", email: "chloe.simon@email.com", phone: "+33 07-55-01-07", nfcCardTier: "standard", points: 320, eventsAttended: 4, eventsCreated: 0, referralCount: 0, createdAt: "2024-10-05", country: "FR", banned: false },
  { id: "u8", name: "Hugo Laurent", email: "hugo.laurent@email.com", phone: "+1 514-555-0108", nfcCardTier: "none", points: 0, eventsAttended: 0, eventsCreated: 0, referralCount: 0, createdAt: "2025-01-12", country: "CA", banned: true },
  { id: "u9", name: "Camille Petit", email: "camille.petit@email.com", phone: "+1 438-555-0109", nfcCardTier: "prime", points: 740, eventsAttended: 7, eventsCreated: 1, referralCount: 2, createdAt: "2024-08-30", country: "CA", banned: false },
  { id: "u10", name: "Théo Rousseau", email: "theo.rousseau@email.com", phone: "+1 514-555-0110", nfcCardTier: "standard", points: 180, eventsAttended: 3, eventsCreated: 0, referralCount: 0, createdAt: "2024-11-20", country: "CA", banned: false },
];

export const MOCK_EVENTS: AdminEvent[] = [
  { id: "e1", title: "Soirée Jazz & Cocktails", category: "Musique", date: "2025-05-15", location: "Montréal, QC", price: 45, maxParticipants: 80, currentParticipants: 72, organizerName: "Antoine Moreau", status: "upcoming", revenue: 3154.40, payoutSent: false, nfcOnlyEntry: true },
  { id: "e2", title: "Dégustation Vins Fins", category: "Gastronomie", date: "2025-04-28", location: "Montréal, QC", price: 90, maxParticipants: 30, currentParticipants: 30, organizerName: "Marie Dupont", status: "upcoming", revenue: 2479.50, payoutSent: false, nfcOnlyEntry: false },
  { id: "e3", title: "Conférence Tech & IA", category: "Technologie", date: "2025-03-10", location: "Québec, QC", price: 25, maxParticipants: 200, currentParticipants: 187, organizerName: "Jean Tremblay", status: "past", revenue: 4297.50, payoutSent: true, nfcOnlyEntry: false },
  { id: "e4", title: "Gala Annuel Alvee", category: "Networking", date: "2025-04-20", location: "Montréal, QC", price: 150, maxParticipants: 100, currentParticipants: 95, organizerName: "Antoine Moreau", status: "ongoing", revenue: 13050.00, payoutSent: false, nfcOnlyEntry: true },
  { id: "e5", title: "Atelier Photographie", category: "Arts", date: "2025-02-14", location: "Laval, QC", price: 0, maxParticipants: 25, currentParticipants: 22, organizerName: "Camille Petit", status: "past", revenue: 0, payoutSent: false, nfcOnlyEntry: false },
  { id: "e6", title: "Tournoi Poker Privé", category: "Jeux", date: "2025-05-02", location: "Montréal, QC", price: 60, maxParticipants: 20, currentParticipants: 18, organizerName: "Marie Dupont", status: "upcoming", revenue: 1032.00, payoutSent: false, nfcOnlyEntry: true },
  { id: "e7", title: "Speed Dating Premium", category: "Social", date: "2025-01-25", location: "Longueuil, QC", price: 35, maxParticipants: 40, currentParticipants: 40, organizerName: "Sophie Martin", status: "past", revenue: 1274.00, payoutSent: true, nfcOnlyEntry: false },
];

export const MOCK_REVENUE: RevenueEntry[] = [
  { month: "Nov 2024", revenus: 1240, frais: 86, net: 1154 },
  { month: "Déc 2024", revenus: 3580, frais: 249, net: 3331 },
  { month: "Jan 2025", revenus: 2100, frais: 146, net: 1954 },
  { month: "Fév 2025", revenus: 1870, frais: 130, net: 1740 },
  { month: "Mar 2025", revenus: 5200, frais: 361, net: 4839 },
  { month: "Avr 2025", revenus: 8430, frais: 586, net: 7844 },
];

export const TIER_LABELS: Record<string, string> = {
  none: "Aucune",
  standard: "Standard",
  prime: "Prime",
  platinum: "Platinum",
};

export const TIER_COLORS: Record<string, string> = {
  none: "#888",
  standard: "#6AAFD8",
  prime: "#C9A84C",
  platinum: "#D0D0D0",
};

export const CATEGORY_ICONS: Record<string, string> = {
  Musique: "🎵",
  Gastronomie: "🍷",
  Technologie: "💻",
  Networking: "🤝",
  Arts: "🎨",
  Jeux: "🃏",
  Social: "💬",
};
