# Cognify — Architecture Overview

This document summarizes the repository layout, key patterns, and where to find important code for common tasks.

## High-level structure

- `app/` — Next.js App Router. Feature routes live under `app/(main)/[feature]/` (server components for data loading, client components for interactivity).
- `components/` — Shared UI primitives and feature components (including `components/ui/` for design system primitives).
- `lib/` — Core libraries and utilities:
  - `lib/supabase/` — Supabase clients and DB helpers
  - `lib/srs/` — SRS implementation, scheduler, and DB utils
  - `lib/ai/` — AI integration helpers and provider adapters
  - `lib/utils/` — Generic utilities
- `hooks/` — React hooks for data fetching and local state
- `public/` — Static assets
- `scripts/` — Project utility scripts (test data, debugging helpers)
- `docs/` — Documentation (this file, study-system, AI setup, API reference)

## Key conventions

- Next.js 15 (App Router) is used. Server components handle data fetching and pass data to client components for interactivity.
- All DB access should go through the Supabase client helpers in `lib/supabase/` and rely on Row Level Security (RLS).
- SRS logic is in `lib/srs/` and respects per-user/project settings from the DB — avoid hardcoding SRS values.
- AI provider integrations are pluggable and configured per-user via localStorage-stored API keys. See `lib/ai/` and `app/api/ai/` routes.
- Styling uses Tailwind CSS and ShadCN; UI primitives live in `components/ui/`.
- Use Zustand for minimal global state; prefer local hooks when possible.

## Developer workflow

- Scripts are available in `package.json`:
  - `pnpm dev` — start dev server (Turbopack)
  - `pnpm build` — build
  - `pnpm start` — start production server
  - `pnpm lint` — ESLint
- Type checking: `npx tsc --noEmit`

## Where to look for common functionality

- Authentication & session: `app/api/auth/` and `lib/supabase/`
- AI-powered flashcard generation: `app/api/ai/` and `lib/ai/`
- SRS scheduler and session management: `lib/srs/`
- Notifications: `lib/supabase/appNotifications.ts` and `components/NotificationBell.tsx`

## Notes for contributors

- Read `CONTRIBUTING.md` before large work; open an issue for non-trivial changes.
- For UI and docs work, maintainers accept PRs without a complete local Supabase setup; mock data or small test scripts are acceptable.

---

This file is a short reference. For deeper details see `docs/study-system.md`, `docs/ai-setup.md`, and the code under `lib/` and `app/`.
