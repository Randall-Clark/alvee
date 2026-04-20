# Alvee — Documentation complète

Application mobile de rencontres sociales et d'événements payants.
Interface entièrement en français, construite avec React Native (Expo) et un backend Node.js.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Démarrage rapide](#2-démarrage-rapide)
3. [Structure du projet](#3-structure-du-projet)
4. [Application mobile](#4-application-mobile)
5. [Backend API](#5-backend-api)
6. [Base de données](#6-base-de-données)
7. [Authentification](#7-authentification)
8. [Paiements Stripe](#8-paiements-stripe)
9. [Cartes NFC](#9-cartes-nfc)
10. [Règles métier](#10-règles-métier)
11. [Variables d'environnement](#11-variables-denvironnement)
12. [Déploiement sur les stores](#12-déploiement-sur-les-stores)
13. [Modifier le code](#13-modifier-le-code)

---

## 1. Vue d'ensemble

**Alvee** est une application mobile permettant de :

- Explorer et s'inscrire à des événements sociaux payants
- Payer directement via Stripe (cartes bancaires)
- Obtenir un billet QR code à présenter à l'entrée
- Souscrire à une carte NFC Alvee (Standard / Prime / Platinum)
- Créer et gérer ses propres événements (rôle organisateur)
- Échanger des messages avec d'autres participants
- Recevoir des notifications in-app

**Stack technique :**

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo SDK 53 |
| Navigation | Expo Router (basé sur les fichiers) |
| Backend | Node.js 24 + Express 5 + TypeScript |
| Base de données | PostgreSQL + Drizzle ORM |
| Authentification | JWT + bcrypt |
| Paiements | Stripe |
| Icônes | Feather Icons (`@expo/vector-icons`) |
| Thème | Dark / Light mode |

---

## 2. Démarrage rapide

### Prérequis

- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [Expo Go](https://expo.dev/client) sur votre téléphone (iOS ou Android)
- Une base de données PostgreSQL (ou utiliser celle de Replit)

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/Randall-Clark/alvee.git
cd alvee

# 2. Installer toutes les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Editez le fichier .env avec vos valeurs (voir section 11)

# 4. Créer les tables dans la base de données
pnpm --filter @workspace/api-server run db:push

# 5. Démarrer le backend (dans un terminal)
pnpm --filter @workspace/api-server run dev

# 6. Démarrer l'app mobile (dans un autre terminal)
pnpm --filter @workspace/alvee run dev
# → Scannez le QR code avec Expo Go
# → Appuyez sur "w" pour ouvrir dans le navigateur
```

---

## 3. Structure du projet

```
alvee/
├── artifacts/
│   ├── alvee/                      ← Application mobile React Native
│   │   ├── app/                    ← Pages (Expo Router)
│   │   │   ├── (tabs)/             ← Onglets de navigation principale
│   │   │   │   ├── _layout.tsx     ← Configuration de la barre d'onglets
│   │   │   │   ├── index.tsx       ← Onglet "Explorer" (liste des événements)
│   │   │   │   ├── messages.tsx    ← Onglet "Messages"
│   │   │   │   ├── create.tsx      ← Onglet "Créer" (créer un événement)
│   │   │   │   ├── bookings.tsx    ← Onglet "Billets" (mes réservations)
│   │   │   │   └── manage.tsx      ← Onglet "Gérer" (mes événements)
│   │   │   ├── event/
│   │   │   │   └── [id].tsx        ← Page de détail d'un événement
│   │   │   ├── auth.tsx            ← Connexion / Inscription
│   │   │   ├── nfc-card.tsx        ← Page des cartes NFC (3 tiers)
│   │   │   ├── payment.tsx         ← Page de paiement
│   │   │   ├── scanner.tsx         ← Scanner QR / NFC (organisateur)
│   │   │   ├── cancel-booking.tsx  ← Annulation d'une réservation
│   │   │   └── notifications.tsx   ← Centre de notifications
│   │   ├── components/
│   │   │   └── EventMap.tsx        ← Carte OpenStreetMap (WebView)
│   │   ├── constants/
│   │   │   └── colors.ts           ← Palettes de couleurs dark/light
│   │   ├── context/
│   │   │   ├── AppContext.tsx      ← État global de l'app (events, user, bookings...)
│   │   │   └── ThemeContext.tsx    ← Gestion du mode dark/light
│   │   ├── hooks/                  ← Hooks React personnalisés
│   │   ├── app.json                ← Configuration Expo
│   │   └── package.json
│   │
│   └── api-server/                 ← Backend Node.js + Express
│       ├── src/
│       │   ├── app.ts              ← Setup Express (CORS, middlewares, routes)
│       │   ├── index.ts            ← Point d'entrée (démarre le serveur)
│       │   ├── db/
│       │   │   ├── schema.ts       ← Schéma de toutes les tables
│       │   │   └── index.ts        ← Connexion Drizzle + PostgreSQL
│       │   ├── lib/
│       │   │   ├── logger.ts       ← Logger (Pino)
│       │   │   ├── jwt.ts          ← Génération et vérification des tokens JWT
│       │   │   ├── hash.ts         ← Hash bcrypt des mots de passe
│       │   │   └── stripe.ts       ← Client Stripe (sandbox auto / live auto)
│       │   ├── middlewares/
│       │   │   ├── auth.ts         ← Vérification du token JWT
│       │   │   └── validate.ts     ← Validation des données avec Zod
│       │   └── routes/
│       │       ├── index.ts        ← Agrégation de toutes les routes
│       │       ├── health.ts       ← GET /healthz
│       │       ├── auth.ts         ← register, login, profil
│       │       ├── events.ts       ← CRUD événements
│       │       ├── bookings.ts     ← Réservations + validation QR
│       │       ├── nfc-cards.ts    ← Cartes NFC + Stripe
│       │       ├── messages.ts     ← Messagerie
│       │       ├── notifications.ts← Notifications
│       │       └── payments.ts     ← Stripe PaymentIntents + webhook
│       ├── drizzle.config.ts       ← Config Drizzle Kit (migrations)
│       ├── build.mjs               ← Script de build (esbuild)
│       └── package.json
│
├── package.json                    ← Workspace pnpm (racine)
├── pnpm-workspace.yaml             ← Déclaration des packages
├── tsconfig.base.json              ← TypeScript config partagée
└── README.md                       ← Ce fichier
```

---

## 4. Application mobile

### Navigation

L'app utilise **Expo Router** — la navigation est basée sur la structure des fichiers dans `app/`. Chaque fichier `.tsx` dans `app/` devient automatiquement une page.

Les 5 onglets principaux sont dans `app/(tabs)/` :

| Fichier | Onglet | Description |
|---|---|---|
| `index.tsx` | Explorer | Liste des événements, recherche, filtres |
| `messages.tsx` | Messages | Conversations avec d'autres utilisateurs |
| `create.tsx` | Créer | Formulaire de création d'événement |
| `bookings.tsx` | Billets | Mes réservations avec QR codes |
| `manage.tsx` | Gérer | Mes événements + scanner d'entrée |

### Contextes (état global)

**`context/AppContext.tsx`** — C'est le cœur de l'app. Il contient :

```typescript
// Ce que vous trouverez dans AppContext :
const {
  user,              // Utilisateur connecté (ou null)
  isAuthenticated,   // true/false
  events,            // Liste des événements
  bookings,          // Mes réservations
  messages,          // Mes conversations
  notifications,     // Mes notifications
  unreadCount,       // Nombre de notifications non lues

  // Actions disponibles
  login(email, password),
  register(name, email, password),
  logout(),
  createEvent(data),
  bookEvent(eventId),
  cancelBooking(bookingId),
  sendMessage(receiverId, content),
  markNotificationRead(id),
} = useApp();
```

**`context/ThemeContext.tsx`** — Gère le mode sombre / clair :

```typescript
const { theme, toggleTheme, colors } = useTheme();
// theme: "dark" | "light"
// colors: palette complète (background, foreground, card, gold, etc.)
```

### Couleurs et thème

Le fichier `constants/colors.ts` définit les deux palettes. Pour modifier les couleurs :

```typescript
// constants/colors.ts
export const darkColors = {
  background: "#0D0D0D",   // Fond principal sombre
  foreground: "#F5F5F5",   // Texte principal
  card: "#1A1A1A",         // Fond des cartes
  gold: "#D4AF37",         // Couleur accent (or)
  // ... etc
};

export const lightColors = {
  background: "#F8F8F8",
  foreground: "#0D0D0D",
  // ... etc
};
```

### Ajouter une nouvelle page

1. Créez un fichier dans `app/ma-page.tsx`
2. Exportez un composant React par défaut
3. Naviguez vers lui avec `router.push("/ma-page")`

```typescript
// app/ma-page.tsx
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function MaPage() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Ma nouvelle page</Text>
    </View>
  );
}
```

### Icônes disponibles

L'app utilise **Feather Icons**. Liste complète sur [feathericons.com](https://feathericons.com).

```typescript
import { Feather } from "@expo/vector-icons";

<Feather name="calendar" size={24} color={colors.foreground} />
```

> **Important :** `"ticket"` n'est PAS un icône Feather valide. Utilisez `"bookmark"` ou `"tag"` à la place.

---

## 5. Backend API

### Démarrage

```bash
pnpm --filter @workspace/api-server run dev
# Démarre sur http://localhost:PORT (PORT défini dans .env)
```

### Liste complète des routes

#### Authentification

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Non | Créer un compte |
| POST | `/api/auth/login` | Non | Se connecter |
| GET | `/api/auth/me` | JWT | Mon profil |
| PATCH | `/api/auth/me` | JWT | Modifier mon profil |

```bash
# Exemple : créer un compte
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@email.com","password":"motdepasse123"}'

# Réponse :
# { "token": "eyJ...", "user": { "id": "...", "email": "...", ... } }
```

#### Événements

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Optionnel | Lister les événements |
| GET | `/api/events/:id` | Optionnel | Détail d'un événement |
| POST | `/api/events` | JWT | Créer un événement |
| PATCH | `/api/events/:id` | JWT | Modifier (organisateur seulement) |
| DELETE | `/api/events/:id` | JWT | Supprimer (organisateur seulement) |
| GET | `/api/events/organizer/mine` | JWT | Mes événements |

```bash
# Recherche d'événements
GET /api/events?search=concert&dateFrom=2026-01-01
```

#### Réservations

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/bookings` | JWT | Mes réservations |
| POST | `/api/bookings` | JWT | Réserver un événement |
| DELETE | `/api/bookings/:id` | JWT | Annuler une réservation |
| POST | `/api/bookings/validate` | JWT | Valider un QR code à l'entrée |

#### Cartes NFC

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/nfc-cards` | JWT | Ma carte NFC active |
| POST | `/api/nfc-cards/subscribe` | JWT | Créer un PaymentIntent pour souscrire |
| POST | `/api/nfc-cards/activate` | JWT | Activer après paiement confirmé |

#### Messages

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/conversations` | JWT | Toutes mes conversations |
| GET | `/api/messages/:userId` | JWT | Messages avec un utilisateur |
| POST | `/api/messages` | JWT | Envoyer un message |

#### Notifications

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | Mes notifications |
| PATCH | `/api/notifications/:id/read` | JWT | Marquer comme lue |
| PATCH | `/api/notifications/read-all` | JWT | Tout marquer comme lu |

#### Paiements

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/payments/config` | Non | Clé publique Stripe |
| POST | `/api/payments/create-intent` | JWT | Créer un PaymentIntent |
| POST | `/api/payments/webhook` | Stripe | Webhook (appelé par Stripe) |

### Ajouter une nouvelle route

1. Créez un fichier dans `src/routes/ma-route.ts` :

```typescript
// src/routes/ma-route.ts
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const monSchema = z.object({
  nom: z.string().min(1),
});

router.get("/", requireAuth, async (req, res) => {
  res.json({ message: `Bonjour ${req.userId}` });
});

router.post("/", requireAuth, validate(monSchema), async (req, res) => {
  const { nom } = req.body;
  res.status(201).json({ nom });
});

export default router;
```

2. Enregistrez-la dans `src/routes/index.ts` :

```typescript
import maRoute from "./ma-route.js";
// ...
router.use("/ma-route", maRoute);
```

### Utiliser l'authentification dans une route

```typescript
// requireAuth vérifie le token JWT et ajoute userId à la requête
router.get("/mon-profil", requireAuth, async (req, res) => {
  const userId = req.userId; // UUID de l'utilisateur connecté
  // ...
});

// optionalAuth ne bloque pas si pas de token
router.get("/public", optionalAuth, async (req, res) => {
  const userId = req.userId; // null si non connecté
  // ...
});
```

### Validation avec Zod

```typescript
const schema = z.object({
  email: z.string().email("Email invalide"),
  age: z.number().int().min(18, "Doit avoir 18 ans minimum"),
  bio: z.string().max(500).optional(),
});

// validate() renvoie automatiquement une erreur 400 si les données sont invalides
router.post("/", validate(schema), async (req, res) => {
  const { email, age, bio } = req.body; // données validées et typées
});
```

---

## 6. Base de données

### Schéma (toutes les tables)

Le fichier `src/db/schema.ts` définit toutes les tables. Voici leur rôle :

| Table | Description |
|---|---|
| `users` | Comptes utilisateurs (email, mot de passe hashé, tier NFC) |
| `events` | Événements créés par les organisateurs |
| `bookings` | Réservations (utilisateur ↔ événement) avec QR code |
| `nfc_cards` | Cartes NFC actives par utilisateur |
| `messages` | Messages directs entre utilisateurs |
| `notifications` | Notifications in-app |
| `payments` | Historique des paiements Stripe |

### Modifier le schéma

1. Modifiez `src/db/schema.ts` — par exemple, ajouter une colonne :

```typescript
// Avant
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  // ...
});

// Après — ajout d'un champ "bio"
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),  // ← nouveau champ
  // ...
});
```

2. Synchronisez avec la base de données :

```bash
pnpm --filter @workspace/api-server run db:push
```

> **Important :** Ne changez jamais le type de la colonne `id`. Cela casse toutes les données existantes.

### Interroger la base de données dans une route

```typescript
import { db, users, events } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";

// Sélectionner un utilisateur par email
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, "alice@email.com"))
  .limit(1);

// Sélectionner les événements d'un organisateur, triés par date
const myEvents = await db
  .select()
  .from(events)
  .where(eq(events.organizerId, userId))
  .orderBy(desc(events.date));

// Insérer un nouvel enregistrement
const [newEvent] = await db
  .insert(events)
  .values({ title: "Mon événement", date: "2026-06-01", ... })
  .returning(); // retourne l'enregistrement créé

// Mettre à jour
await db
  .update(users)
  .set({ name: "Nouveau nom" })
  .where(eq(users.id, userId));

// Supprimer
await db.delete(events).where(eq(events.id, eventId));
```

---

## 7. Authentification

### Fonctionnement

1. L'utilisateur s'inscrit ou se connecte → le backend renvoie un **token JWT**
2. Le token est stocké dans l'app mobile (`AsyncStorage`)
3. Chaque requête protégée envoie le token dans le header :
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```
4. Le middleware `requireAuth` vérifie et décode le token

### Fichiers concernés

- **`src/lib/jwt.ts`** — Générer et vérifier les tokens
- **`src/lib/hash.ts`** — Hasher et vérifier les mots de passe
- **`src/middlewares/auth.ts`** — Middleware de vérification
- **`src/routes/auth.ts`** — Routes register / login / profil

### Modifier la durée de validité du token

```typescript
// src/lib/jwt.ts
const JWT_EXPIRES_IN = "30d"; // ← changer ici (7d, 24h, 1y, etc.)
```

### Modifier les règles de mot de passe

```typescript
// src/routes/auth.ts
const registerSchema = z.object({
  password: z
    .string()
    .min(8, "Au moins 8 caractères")  // ← changer la longueur minimale
    .regex(/[A-Z]/, "Doit contenir une majuscule"), // ← ajouter des règles
});
```

---

## 8. Paiements Stripe

### Architecture

```
App mobile                     Backend                        Stripe
    │                             │                              │
    ├── POST /payments/config ───►│                              │
    │◄── publishableKey ──────────┤                              │
    │                             │                              │
    ├── POST /payments/create-intent ─►│                         │
    │                             ├── createPaymentIntent() ────►│
    │◄── clientSecret ────────────┤◄── clientSecret ─────────────┤
    │                             │                              │
    ├── (Stripe SDK confirme le paiement directement)           │
    │                             │                              │
    │                        Stripe ──── webhook ───────────────►│
    │                             ├── Activer réservation        │
    │                             └── Activer carte NFC          │
```

### En développement (Sandbox)

Stripe utilise automatiquement les clés **sandbox** (test). Vous pouvez utiliser la carte de test :
- **Numéro :** `4242 4242 4242 4242`
- **Date :** n'importe quelle date future
- **CVV :** n'importe quel 3 chiffres

### En production

Le connector Replit bascule automatiquement vers les clés **live** quand l'app est déployée. Aucun changement de code nécessaire.

### Modifier les prix des cartes NFC

```typescript
// src/routes/nfc-cards.ts
const TIER_PRICES_CAD: Record<string, number> = {
  standard: 12,    // ← 12$/an
  prime: 60,       // ← 60$/an
  platinum: 100,   // ← 100$/an
};
```

### Configurer le webhook Stripe

Pour que Stripe notifie votre backend après un paiement :

1. Dans le [dashboard Stripe](https://dashboard.stripe.com/webhooks), créez un webhook
2. URL : `https://votre-domaine.com/api/payments/webhook`
3. Événements à écouter : `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copiez le **Webhook Signing Secret** dans vos variables d'environnement : `STRIPE_WEBHOOK_SECRET`

---

## 9. Cartes NFC

### Les 3 tiers

| Tier | Prix | Avantages |
|---|---|---|
| **Standard** | 12$/an | Entrée QR ou NFC aux événements standard |
| **Prime** | 60$/an | Standard + accès aux événements ≥300$ + annulation jour même |
| **Platinum** | 100$/an | Prime + accès prioritaire + entrée walk-in |

### Logique d'accès

```typescript
// Un événement à 300$ CAD ou plus requiert automatiquement Prime ou Platinum
// src/routes/events.ts
const requiresPrime = price >= 300 || req.body.requiresPrime;
```

```typescript
// Vérification lors d'une réservation
// src/routes/bookings.ts
if (event.requiresPrime) {
  const tier = user?.nfcTier;
  if (tier === "none" || tier === "standard") {
    return res.status(403).json({ error: "Carte Prime ou Platinum requise" });
  }
}
```

### Entrée NFC uniquement

Un organisateur peut configurer son événement en mode "NFC seulement" :

```typescript
// Lors de la création d'un événement
{
  nfcOnlyEntry: true  // ← seules les cartes NFC sont acceptées, pas les QR codes
}
```

---

## 10. Règles métier

### Early Bird (premier arrivé)

Les **40% premiers inscrits** à un événement reçoivent le statut "early bird".

```typescript
// src/routes/bookings.ts
const earlyBirdThreshold = Math.floor(capacity * 0.4);
const isEarlyBird = currentCount < earlyBirdThreshold;
```

Pour modifier le seuil (par exemple, 30% au lieu de 40%) :

```typescript
const earlyBirdThreshold = Math.floor(capacity * 0.30); // ← changer ici
```

### Politique d'annulation et remboursement

| Tier NFC | Délai d'annulation |
|---|---|
| Aucune / Standard | 24h avant l'événement |
| Prime / Platinum | Même jour que l'événement |

```typescript
// src/routes/bookings.ts
if (tier === "platinum" || tier === "prime") {
  canRefund = hoursUntilEvent > 0; // ← peut annuler tant que l'événement n'est pas passé
} else {
  canRefund = hoursUntilEvent >= 24; // ← doit annuler 24h avant
}
```

### Points (cachés de l'interface)

Les points sont calculés selon le prix de l'événement mais **ne sont pas affichés** aux utilisateurs :

| Prix | Points |
|---|---|
| Moins de 100$ | 20 points |
| 100$ à 500$ | 45 points |
| 500$ à 1000$ | 100 points |

Distribution :
- **70%** des points → les 40% premiers inscrits
- **30%** des points → les autres inscrits

---

## 11. Variables d'environnement

Créez un fichier `.env` dans `artifacts/api-server/` :

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/alvee

# Authentification JWT
# Générez un secret fort : openssl rand -hex 64
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire

# Stripe (optionnel en développement — requis en production)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> **Sur Replit :** Les variables sont gérées via l'onglet "Secrets". Stripe est connecté automatiquement via le connector Replit — pas besoin de définir `STRIPE_SECRET_KEY` manuellement.

---

## 12. Déploiement sur les stores

### Préparer l'app pour les stores

#### 1. Configurer `app.json`

```json
{
  "expo": {
    "name": "Alvee",
    "slug": "alvee",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.votrecompagnie.alvee",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.votrecompagnie.alvee",
      "versionCode": 1
    }
  }
}
```

#### 2. Créer un Development Build

Expo Go ne supporte pas toutes les fonctionnalités natives (NFC, push notifications). Pour le store, il faut un **build natif** :

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Configurer EAS
eas build:configure

# Build pour iOS (App Store)
eas build --platform ios --profile production

# Build pour Android (Google Play)
eas build --platform android --profile production
```

#### 3. Connecter le backend à l'app

Dans `context/AppContext.tsx`, remplacez l'URL du backend :

```typescript
// Actuellement (développement)
const API_URL = "http://localhost:3000";

// À changer pour la production
const API_URL = "https://votre-api.com";
```

#### 4. Déployer le backend

Le backend peut être déployé sur :
- **Replit** — cliquez sur "Déployer" dans l'interface
- **Railway** — `railway up`
- **Render** — connectez votre repo GitHub
- **DigitalOcean App Platform** — via Docker

Le backend a besoin de :
- Une base de données PostgreSQL accessible
- Les variables d'environnement configurées (voir section 11)

---

## 13. Modifier le code

### Changer les textes de l'interface

Tous les textes sont en français, directement dans les composants. Exemple :

```typescript
// app/(tabs)/bookings.tsx
<Text>Mes billets</Text>          // ← Modifiez directement ici
<Text>Connexion requise</Text>    // ← Et ici
```

### Changer les couleurs de l'app

```typescript
// constants/colors.ts
export const darkColors = {
  background: "#0D0D0D",   // ← Fond sombre
  gold: "#D4AF37",          // ← Couleur accent principale (boutons, badges)
  // ...
};
```

### Ajouter un onglet dans la navigation

```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="mon-onglet"
  options={{
    title: "Mon onglet",
    tabBarIcon: ({ color }) => <Feather name="star" size={22} color={color} />,
  }}
/>
```

Puis créez `app/(tabs)/mon-onglet.tsx`.

### Modifier un message d'erreur du backend

Les messages d'erreur sont directement dans les fichiers de routes :

```typescript
// src/routes/auth.ts
res.status(401).json({ error: "Email ou mot de passe incorrect" }); // ← modifiez ici
```

### Ajouter un champ au profil utilisateur

1. Ajoutez la colonne dans `src/db/schema.ts` :
```typescript
export const users = pgTable("users", {
  // ... champs existants
  website: varchar("website", { length: 200 }),  // ← nouveau
});
```

2. Synchronisez la DB : `pnpm --filter @workspace/api-server run db:push`

3. Mettez à jour la route PATCH `/api/auth/me` pour accepter ce champ

4. Dans l'app mobile, ajoutez le champ dans le formulaire de profil

---

## Commandes utiles

```bash
# Backend
pnpm --filter @workspace/api-server run dev          # Démarrer
pnpm --filter @workspace/api-server run build        # Build de production
pnpm --filter @workspace/api-server run typecheck    # Vérifier les types TypeScript
pnpm --filter @workspace/api-server run db:push      # Synchroniser le schéma DB

# Mobile
pnpm --filter @workspace/alvee run dev               # Démarrer (Expo)

# Tout le workspace
pnpm install                                          # Installer toutes les dépendances
```

---

## En cas de problème

| Problème | Solution |
|---|---|
| "Cannot find module" | Relancez `pnpm install` |
| Erreur de connexion DB | Vérifiez `DATABASE_URL` dans `.env` |
| Token JWT invalide | Vérifiez que `JWT_SECRET` est le même en dev et prod |
| Stripe ne fonctionne pas | Vérifiez `STRIPE_SECRET_KEY` ou la connexion Replit Stripe |
| Tables manquantes | Lancez `pnpm --filter @workspace/api-server run db:push` |
| L'icône ne s'affiche pas | Vérifiez que le nom existe sur [feathericons.com](https://feathericons.com) |
