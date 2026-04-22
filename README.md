# Alvee — Guide d'installation locale

Application mobile de rencontres sociales payantes avec billets QR/NFC, abonnements, messagerie et tableau de bord administrateur.

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Cloner le projet](#cloner-le-projet)
3. [Installation des dépendances](#installation-des-dépendances)
4. [Application mobile — Expo Go](#application-mobile--expo-go)
5. [Dashboard admin — navigateur](#dashboard-admin--navigateur)
6. [Serveur API — backend](#serveur-api--backend)
7. [Lancer les trois en parallèle](#lancer-les-trois-en-parallèle)
8. [Structure du projet](#structure-du-projet)
9. [Extensions VS Code recommandées](#extensions-vs-code-recommandées)
10. [Fonctionnalités natives (QR / NFC)](#fonctionnalités-natives-qr--nfc)
11. [Dépannage rapide](#dépannage-rapide)

---

## Prérequis

Installer les outils suivants sur votre machine :

| Outil | Version | Lien |
|---|---|---|
| **Node.js** | 20.x LTS ou plus | https://nodejs.org |
| **pnpm** | 9.x ou plus | `npm install -g pnpm` |
| **Git** | n'importe laquelle | https://git-scm.com |
| **VS Code** | dernière version | https://code.visualstudio.com |
| **Expo Go** (sur votre téléphone) | dernière version | App Store / Google Play |

Vérifier que tout est bien installé :

```bash
node --version    # doit afficher v20.x ou plus
pnpm --version    # doit afficher 9.x ou plus
git --version
```

---

## Cloner le projet

```bash
git clone https://github.com/Randall-Clark/alvee.git
cd alvee
```

Puis ouvrir le dossier dans VS Code :

```bash
code .
```

---

## Installation des dépendances

Une seule commande depuis la **racine** du projet installe tout (mobile + admin + API) :

```bash
pnpm install
```

---

## Application mobile — Expo Go

### Lancer le serveur de développement

```bash
cd artifacts/alvee
npx expo start
```

Le terminal affiche un **QR code** et plusieurs options.

### Ouvrir sur votre téléphone

Votre téléphone et votre ordinateur doivent être sur le **même réseau Wi-Fi**.

- **iOS** → Ouvrir l'app **Appareil photo**, scanner le QR code. L'app s'ouvre automatiquement dans Expo Go.
- **Android** → Ouvrir **Expo Go**, appuyer sur **Scan QR code**, scanner.

### Ouvrir dans le navigateur

Depuis le terminal Expo, appuyer sur la touche **`w`** → ouvre la version web sur `http://localhost:8081`.

### Modifier le code

Toute sauvegarde dans VS Code recharge l'app instantanément sur le téléphone (Fast Refresh). Aucun redémarrage nécessaire.

---

## Dashboard admin — navigateur

Le dashboard admin est une application React + Vite séparée avec statistiques, gestion des utilisateurs, événements et revenus.

### Configurer le port

Créer un fichier `artifacts/admin/.env` :

```
PORT=5173
```

### Lancer le dashboard

```bash
cd artifacts/admin
pnpm dev
```

Ouvrir dans le navigateur : **http://localhost:5173/admin/**

---

## Serveur API — backend

Le backend Node.js + Express gère l'authentification, la base de données et les paiements Stripe.

### Créer le fichier d'environnement

Créer `artifacts/api-server/.env` :

```
PORT=8080
SESSION_SECRET=une_chaine_secrete_locale_minimum_32_caracteres
DATABASE_URL=postgresql://localhost:5432/alvee
```

> **PostgreSQL est optionnel pour les tests locaux** — l'app mobile utilise le stockage local du téléphone (AsyncStorage) et fonctionne sans backend pour le développement.

### Lancer le serveur

```bash
cd artifacts/api-server
pnpm dev
```

Serveur disponible sur : **http://localhost:8080**

---

## Lancer les trois en parallèle

Ouvrir **trois terminaux distincts** dans VS Code (icône `+` dans le panneau Terminal) :

```bash
# Terminal 1 — App mobile
cd artifacts/alvee
npx expo start

# Terminal 2 — Dashboard admin
cd artifacts/admin
PORT=5173 pnpm dev

# Terminal 3 — Serveur API
cd artifacts/api-server
pnpm dev
```

---

## Structure du projet

```
alvee/
├── artifacts/
│   │
│   ├── alvee/                      # Application mobile React Native
│   │   ├── app/                    # Écrans (Expo Router, navigation par fichiers)
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx       # Accueil — liste des événements
│   │   │   │   ├── bookings.tsx    # Mes réservations + billets QR
│   │   │   │   ├── manage.tsx      # Gérer mes événements + scan QR/NFC
│   │   │   │   ├── messages.tsx    # Messagerie
│   │   │   │   └── profile.tsx     # Profil + parrainage + abonnement NFC
│   │   │   ├── event/[id].tsx      # Détail événement + commentaires
│   │   │   ├── auth.tsx            # Connexion / inscription
│   │   │   ├── edit-profile.tsx    # Édition profil + vérification
│   │   │   ├── nfc-card.tsx        # Gestion carte NFC Alvee
│   │   │   ├── create.tsx          # Créer un événement
│   │   │   └── payment.tsx         # Paiement Stripe
│   │   ├── components/
│   │   │   ├── QRScanner.tsx       # Scanner QR caméra (réel)
│   │   │   ├── NFCScanner.tsx      # Lecteur NFC (réel)
│   │   │   ├── QRCodeDisplay.tsx   # Affichage QR billet
│   │   │   ├── EventCard.tsx       # Carte événement
│   │   │   └── PhoneInput.tsx      # Sélecteur pays + numéro
│   │   ├── context/
│   │   │   └── AppContext.tsx      # État global (événements, user, réservations)
│   │   ├── hooks/
│   │   │   └── useColors.ts        # Thème clair/sombre
│   │   └── app.json                # Config Expo + permissions caméra/NFC
│   │
│   ├── admin/                      # Dashboard admin React + Vite
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx   # Vue générale + graphiques
│   │       │   ├── Users.tsx       # Gestion utilisateurs
│   │       │   ├── Events.tsx      # Gestion événements
│   │       │   ├── Revenue.tsx     # Revenus + transactions
│   │       │   └── Stats.tsx       # Statistiques détaillées
│   │       └── App.tsx
│   │
│   └── api-server/                 # Backend Node.js + Express
│       └── src/
│           ├── routes/             # Routes REST API
│           ├── db/                 # Schéma Drizzle ORM + PostgreSQL
│           ├── middlewares/        # Auth JWT, validation Zod
│           └── index.ts
│
├── README.md
├── package.json                    # Workspace pnpm racine
└── pnpm-workspace.yaml
```

---

## Extensions VS Code recommandées

Installer depuis l'onglet **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`) :

| Extension | Identifiant VS Code | Utilité |
|---|---|---|
| **ESLint** | `dbaeumer.vscode-eslint` | Erreurs JS/TS en temps réel |
| **Prettier** | `esbenp.prettier-vscode` | Formatage automatique à la sauvegarde |
| **Expo Tools** | `expo.vscode-expo-tools` | IntelliSense pour app.json et modules Expo |
| **React Native Tools** | `msjsdiag.vscode-react-native` | Débogage React Native |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Autocomplétion CSS pour le dashboard admin |
| **GitLens** | `eamodio.gitlens` | Historique Git visible inline dans le code |

Pour configurer Prettier comme formateur par défaut, ajouter dans `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## Fonctionnalités natives (QR / NFC)

### Scanner QR par caméra

Fonctionne directement dans **Expo Go** sur iOS et Android. L'app demande la permission caméra au premier scan. Accès via l'onglet **Gérer** → sélectionner un événement → bouton **Scanner un code QR**.

Sur le web (navigateur), un message indique que la caméra n'est pas disponible — c'est normal.

### Lecture NFC

Le NFC **ne fonctionne pas dans Expo Go standard**. Pour tester le NFC avec un vrai téléphone, il faut créer un **build de développement** avec EAS Build :

```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Se connecter à votre compte Expo
eas login

# 3. Créer un build de développement (une seule fois)
cd artifacts/alvee
eas build --profile development --platform android
# ou --platform ios pour iPhone
```

Une fois le build installé sur le téléphone, le scan NFC s'active en approchant une carte NFC de la vitre arrière.

---

## Dépannage rapide

| Problème | Solution |
|---|---|
| `pnpm: command not found` | Exécuter `npm install -g pnpm` puis relancer le terminal |
| QR Expo non scannable | Vérifier que téléphone et PC sont sur le **même Wi-Fi** |
| App blanche au démarrage | Appuyer sur `r` dans le terminal Expo pour recharger |
| Metro bloqué ou cache corrompu | `npx expo start --clear` (vide le cache Metro) |
| `PORT is required` (admin) | Créer `artifacts/admin/.env` avec `PORT=5173` |
| Module introuvable après `git pull` | `pnpm install` depuis la racine du projet |
| Erreurs TypeScript dans VS Code | Ouvrir VS Code depuis la **racine** : `code .` (pas depuis un sous-dossier) |
| NFC : "non supporté" | Normal dans Expo Go — utiliser un build EAS (voir section ci-dessus) |
