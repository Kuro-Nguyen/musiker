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
