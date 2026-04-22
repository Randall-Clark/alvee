# Workspace — Alvee

## Overview

pnpm monorepo with a React Native (Expo) mobile app and a Node.js + Express backend.
All user-facing text is in **French**.

## Stack

- **Monorepo**: pnpm workspaces
- **Mobile**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Camera**: expo-camera ~17.0.10 (QR code scanning)
- **NFC**: react-native-nfc-manager ^3.17.2 (real NFC card reading)
- **Backend**: Node.js 24 + Express 5 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Payments**: Stripe via Replit connector (sandbox auto / live auto)
- **Validation**: Zod
- **Build**: esbuild

## Artifacts

| Artifact | Kind | Dir | Preview Path |
|---|---|---|---|
| Alvee | mobile (Expo) | `artifacts/alvee/` | Expo Go / Web |
| API Server | api (Express) | `artifacts/api-server/` | `/api` |
| Alvee Admin | web (React+Vite) | `artifacts/admin/` | `/admin/` |

## Key Commands

```bash
# Start both services
pnpm --filter @workspace/api-server run dev   # Backend → port $PORT
pnpm --filter @workspace/alvee run dev        # Mobile → Expo Go

# Database
pnpm --filter @workspace/api-server run db:push   # Sync schema to DB

# TypeCheck
pnpm --filter @workspace/api-server run typecheck
```

## Backend API Routes (`artifacts/api-server/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/healthz` | Public | Health check |
| POST | `/api/auth/register` | Public | Créer un compte |
| POST | `/api/auth/login` | Public | Connexion |
| GET | `/api/auth/me` | JWT | Profil utilisateur |
| PATCH | `/api/auth/me` | JWT | Modifier le profil |
| GET | `/api/events` | Optional | Lister les événements |
| GET | `/api/events/:id` | Optional | Détail d'un événement |
| POST | `/api/events` | JWT | Créer un événement |
| PATCH | `/api/events/:id` | JWT | Modifier (organisateur) |
| DELETE | `/api/events/:id` | JWT | Supprimer (organisateur) |
| GET | `/api/events/organizer/mine` | JWT | Mes événements |
| GET | `/api/bookings` | JWT | Mes réservations |
| POST | `/api/bookings` | JWT | Réserver un événement |
| DELETE | `/api/bookings/:id` | JWT | Annuler une réservation |
| POST | `/api/bookings/validate` | JWT | Valider QR code à l'entrée |
| GET | `/api/nfc-cards` | JWT | Ma carte NFC |
| POST | `/api/nfc-cards/subscribe` | JWT | Souscrire (crée PaymentIntent Stripe) |
| POST | `/api/nfc-cards/activate` | JWT | Activer après paiement |
| GET | `/api/messages/conversations` | JWT | Liste des conversations |
| GET | `/api/messages/:userId` | JWT | Messages avec un utilisateur |
| POST | `/api/messages` | JWT | Envoyer un message |
| GET | `/api/notifications` | JWT | Mes notifications |
| PATCH | `/api/notifications/:id/read` | JWT | Marquer lue |
| PATCH | `/api/notifications/read-all` | JWT | Tout marquer lue |
| GET | `/api/payments/config` | Public | Stripe publishable key |
| POST | `/api/payments/create-intent` | JWT | Créer un PaymentIntent |
| POST | `/api/payments/webhook` | Stripe | Webhook Stripe |

## Database Schema (`artifacts/api-server/src/db/schema.ts`)

Tables: `users`, `events`, `bookings`, `nfc_cards`, `messages`, `notifications`, `payments`

Enums: `nfc_tier` (none/standard/prime/platinum), `booking_status`, `payment_status`

## Mobile App Structure (`artifacts/alvee/`)

```
app/
  (tabs)/
    index.tsx       — Explorer les événements
    messages.tsx    — Messagerie
    create.tsx      — Créer un événement
    bookings.tsx    — Mes billets
    manage.tsx      — Gérer mes événements
  event/[id].tsx    — Détail d'un événement
  auth.tsx          — Connexion / Inscription
  nfc-card.tsx      — Cartes NFC (Standard/Prime/Platinum)
  payment.tsx       — Paiement
  scanner.tsx       — Scanner QR/NFC
  cancel-booking.tsx
  notifications.tsx

context/
  AppContext.tsx     — État global (events, bookings, user, auth)
  ThemeContext.tsx   — Dark / Light mode

constants/
  colors.ts          — Palettes dark + light

components/
  EventMap.tsx       — Carte OpenStreetMap (WebView)
```

## Business Logic Notes

- Événements ≥ 300$ CAD → `requiresPrime = true` (carte Prime ou Platinum obligatoire)
- Points: <100$=20pts, 101-500$=45pts, 501-1000$=100pts — cachés de l'UI
- Distribution points: 70% aux 40% premiers inscrits, 30% au reste
- Remboursement: Standard/Aucune = 24h avant; Prime/Platinum = même jour
- QR code par défaut ou NFC; `nfcOnlyEntry=true` = NFC uniquement
- NFC tiers: Standard 12$/an, Prime 60$/an, Platinum 100$/an

## Environment Variables

| Key | Env | Description |
|---|---|---|
| `DATABASE_URL` | Shared | PostgreSQL (auto-provisioned) |
| `JWT_SECRET` | Shared | Secret JWT (auto-généré) |
| `SESSION_SECRET` | Secret | Session secret |
| `STRIPE_WEBHOOK_SECRET` | Secret | Webhook signature Stripe |

Stripe keys sont gérées automatiquement par le connector Replit (pas de variable manuelle).

## GitHub

Repo: https://github.com/Randall-Clark/alvee

## Icon Notes

- `"ticket"` n'est PAS un icon Feather valide → utiliser `"bookmark"` ou `"tag"`
- expo-notifications non supporté sur Android Expo Go SDK 53 → notifications in-app uniquement
