# MUZIKER

> Minimalist music discovery & randomizer web app — zero-friction exploration with 30-second audio previews, album-first tracklists, and personal cloud-synced crates. **by Kuro**

## Overview

**MUZIKER** is a minimalist music discovery application built around instant randomization and deliberate listening. Anyone can explore albums, tracks, and artists, listen to 30-second previews, set a daily discovery pick, and customize a taste profile without logging in. Saving favorites and managing personal crates require authentication via **Firebase Auth** and sync in real time with **Cloud Firestore**.

## Features

- **Discovery Engine**: Randomize **Albums (2+ tracks)**, **Tracks**, or **Artists** with a `0%–100%` Discovery Slider (`Safe Zone`, `Expand`, `Smart Exploration`, `Pure Chaos`) and quick filters by region, mood, popularity, and era.
- **Multi-Source Music Catalog**: Combines **Apple Music / iTunes** regional charts and catalog search, optional **Spotify Web API** metadata, and automatic 30-second audio preview resolution.
- **Persistent 30s Mini-Player**: Global bottom audio bar with scrub bar, volume control, previous/next queue navigation, and auto-advance through album tracklists.
- **Taste Profile Quiz (30s)**: 5-step onboarding modal to pick 3–5 seed artists, audio texture, energy, popularity preferences, and excluded genres.
- **Daily Pick**: Daily album and track selection locked per local calendar date (`YYYY-MM-DD`).
- **Auth-Gated Cloud Saved Crate**:
  - Guest users can freely browse, randomize, listen to previews, and customize their taste profile.
  - Clicking **Save** or **Saved Crate** opens the sign-in modal (**Google Sign-In** or **Email/Password**), automatically completing the save action and syncing favorites to Cloud Firestore (`/users/{uid}/savedItems`).
  - Export saved items to **JSON**, **TXT**, or copy directly to the clipboard.
- **Mobile-First UI & Light/Dark Theme**: Responsive layout down to `320px`, mobile bottom-sheet modals, safe-area support, and instant light/dark theme switching.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling & Motion**: Tailwind CSS v4, Framer Motion, Lucide Icons
- **State Management**: Zustand
- **Backend & Cloud**: Next.js Route Handlers, Firebase Authentication, Cloud Firestore
- **Music Metadata**: iTunes Search & Apple Music RSS Feeds, Spotify Web API (optional), Deezer API (automatic failover)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <your-repository-url>
cd muziker
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

> Never commit `.env.local` or any Firebase Admin/service-account JSON files. All sensitive files are excluded in `.gitignore`.

### 3. Firebase Setup (Authentication & Cloud Firestore)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create (or select) a project.
2. Register a **Web App** (`</>`) and copy the configuration keys into `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. In **Authentication > Sign-in method**, enable:
   - **Email/Password**
   - **Google**
4. In **Authentication > Settings > Authorized domains**, verify `localhost` (without protocol or port) and your production domain are listed.
5. Create a **Cloud Firestore** database (Standard edition, Production mode).
6. Deploy the included security rules (`firestore.rules`) using the Firebase CLI:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use <YOUR_FIREBASE_PROJECT_ID>
npx -y firebase-tools@latest deploy --only firestore:rules
```

### 4. Spotify Web API Setup (Optional)

MUZIKER works out of the box using Apple Music / iTunes APIs. To enable hybrid search across Spotify as well:

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env.local`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript compiler type checking (`tsc --noEmit`) |

## Project Structure

```text
src/
├── app/
│   ├── api/music/        # Server-side music search, discover, album & preview proxies
│   ├── globals.css       # Tailwind CSS v4 theme tokens & mobile/touch utilities
│   ├── icon.svg          # Minimalist vinyl favicon
│   ├── layout.tsx        # Root layout, viewport config & providers
│   └── page.tsx          # Main discovery workspace
├── components/
│   ├── auth/             # AuthSyncProvider & Sign-In / Sign-Up modal
│   ├── crate/            # Cloud-synced Saved Crate drawer & export controls
│   ├── discovery/        # ControlPanel, ResultGrid, MusicCard & DailyPickBanner
│   ├── layout/           # Header (with Auth trigger), MiniPlayer
│   └── quiz/             # 5-step Taste Profile Quiz modal
├── lib/                  # Firebase client, Firestore crate sync, Spotify/iTunes/Engine
├── store/                # Zustand stores (auth, saved crate, preferences, audio player)
└── types/                # TypeScript domain models
```
