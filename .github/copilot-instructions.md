# Copilot Instructions for Cognify

## Project Overview

Cognify is a Next.js (App Router) platform for AI-powered flashcards, spaced repetition, and personal study management. It uses Supabase for authentication, storage, and notifications, and DaisyUI for UI. All AI and sensitive keys are user-provided.

## Architecture & Key Patterns

### App Directory Structure

- `app/` uses the Next.js App Router. Major features are organized as folders under `app/(main)/`:
  - `projects/` (flashcards, SRS, project management)
  - `dashboard/` (user dashboard, notifications)
  - `settings/` (profile/settings)
  - Each feature has its own `components/`, `hooks/`, and `utils/` subfolders.
- Shared React components live in `components/` (e.g., `NotificationBell.tsx`, `header.tsx`).
- Utility functions are in `utils/` (e.g., `supabase/`, `theme.ts`).
- Scripts for admin/dev tasks are in `scripts/` (e.g., `pushNotification.ts`).
- Static assets are in `public/` (e.g., `assets/nopfp.png`).
- Documentation is in `docs/`.

### Authentication

- Supabase handles user authentication and profiles. See `utils/supabase/client.ts` for client setup and `app/auth/` for auth routes.
- Both OAuth and email/password are supported. Redirect URLs must match your local/dev settings (see Supabase dashboard and `.env.local`).
- Auth logic is also present in `app/login/components/LoginForm.tsx` and related files.

### Flashcard Generation & SRS

- AI API integration is user-configurable via environment variables. No hardcoded keys—users set their own in `.env.local`.
- Flashcard and SRS logic is in `app/(main)/projects/components/` (e.g., `FlashcardEditor.tsx`, `StudyFlashcards.tsx`, `SRSScheduler.ts`).
- SRS state and due project logic is in `utils/supabase/srs.ts`.
- Data normalization and comparison utilities are in `app/(main)/projects/utils/`.

### Notifications

- App-wide and SRS notifications are unified in `components/NotificationBell.tsx`.
- Notification logic and DB access is in `utils/supabase/appNotifications.ts`.
- Admins/devs can push notifications using scripts (see `scripts/pushNotification.ts`).

### API Routes

- Next.js API routes are under `app/api/` (e.g., `app/api/projects/route.ts`).
- API routes interact with Supabase using the client from `utils/supabase/client.ts`.

### State & Data Flow

- State is managed via React hooks and context only (no Redux/MobX). See `app/(main)/projects/hooks/` and `hooks/` for custom hooks.

### Styling

- DaisyUI (Tailwind CSS plugin) is used for UI components. Use DaisyUI classes for new UI elements. See `app/globals.css` for global styles.
- Custom theming is handled in `utils/theme.ts`.

### Environment Variables

- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and your AI API key. Set these in `.env.local`.
- Never commit API keys or secrets.

### Scripts

- Scripts for admin/dev tasks live in `scripts/` (e.g., `pushNotification.ts` for sending notifications via Supabase).
- Scripts use `dotenv` and require a `.env` file with Supabase keys for local execution.

- **Authentication:**

  - Supabase handles user authentication and profiles. See `utils/supabase/client.ts` for client setup and `app/auth/` for auth routes.
  - Both OAuth and email/password are supported. Redirect URLs must match your local/dev settings (see Supabase dashboard and `.env.local`).
  - Auth logic is also present in `app/login/components/LoginForm.tsx` and related files.

- **Flashcard Generation:**

  - AI API integration is user-configurable via environment variables. No hardcoded keys—users set their own in `.env.local`.
  - Flashcard logic is in `app/projects/components/FlashcardEditor.tsx`, `FlashcardInput.tsx`, and related files.
  - Data normalization and comparison utilities are in `app/projects/utils/`.

- **API Routes:**

  - Next.js API routes are under `app/api/`. Example: `app/api/projects/route.ts` for project-related endpoints.
  - API routes interact with Supabase using the client from `utils/supabase/client.ts`.

- **State & Data Flow:**

  - State is managed via React hooks and context only (no Redux/MobX). See `app/projects/hooks/` for project-specific hooks like `useProjectManager.ts` and `useUnsavedChangesWarning.ts`.

- **Styling:**

  - DaisyUI (Tailwind CSS plugin) is used for UI components. Use DaisyUI classes for new UI elements. See `app/globals.css` for global styles.
  - Custom theming is handled in `utils/theme.ts`.

- **Environment Variables:**

  - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and your AI API key. Set these in `.env.local`.
  - Never commit API keys or secrets.

- **Styling:**

## Developer Workflows

- **Install dependencies:**
  - Use `pnpm install` (preferred), or `npm install`/`yarn install`.
- **Run locally:**
  - Use `pnpm dev` (or `npm run dev`/`yarn dev`).
- **Environment setup:**
  - Create `.env.local` with Supabase keys, site URL, and your AI API key. For scripts, also create a `.env` file with the same keys.
- **Linting:**
  - Run `pnpm lint` (uses ESLint config in `eslint.config.mjs`). Fix issues as reported; most can be auto-fixed with `pnpm lint --fix`.
- **Formatting:**
  - Prettier is recommended (no config file; use defaults). Format on save in your editor.
- **Scripts:**
  - Run scripts with `npx tsx scripts/pushNotification.ts` (see script for details).
- **Troubleshooting:**
  - If authentication fails, check Supabase redirect URLs and `.env.local`/`.env` values.
  - For AI API errors, verify your key and endpoint in `.env.local`.
  - For DaisyUI issues, ensure Tailwind and DaisyUI are installed and configured in `postcss.config.mjs` and `app/globals.css`.

## Project-Specific Conventions

- **Feature Folders:**
  - Each major feature (projects, dashboard, settings) is a folder under `app/(main)/` with its own `components/`, `hooks/`, and `utils/`.
- **Hooks & Utils:**
  - Place feature-specific hooks in `app/(main)/[feature]/hooks/` and utilities in `app/(main)/[feature]/utils/`. Example: `useProjects.ts` manages project state and actions.
- **No global state management library:**
  - State is managed via React hooks and context only.
- **Bring Your Own AI Key:**
  - Never commit API keys. Users set their own in `.env.local`.
- **Supabase Integration:**
  - All DB/auth logic goes through Supabase client in `utils/supabase/client.ts`. Use this client in API routes, React components, and scripts for DB access.
- **UI Library:**
  - Use DaisyUI classes for new UI components. Example: `<button className="btn btn-primary">` for a styled button.
- **Notifications:**
  - Use the `NotificationBell` component for all in-app and SRS notifications. Push notifications via scripts or admin tools.

## Integration Points

- **Supabase:**
  - Used for authentication, storage, user profiles, SRS state, and notifications. All DB/auth logic goes through `utils/supabase/client.ts`.
- **AI API:**
  - User-provided key for flashcard generation. No backend proxying; all requests are client-side using the user's key.
- **Next.js API Routes:**
  - Extend API by adding files under `app/api/`. Use Supabase client for DB operations.
- **Notifications:**
  - Use `utils/supabase/appNotifications.ts` for notification logic. Push via scripts or admin UI.
- **Scripts:**
  - Use scripts in `scripts/` for admin/dev tasks (e.g., push notifications).

## Examples

- To add a new feature, create a folder under `app/(main)/` (e.g., `app/(main)/notes/`). Add local `components/`, `hooks/`, and `utils/` as needed.
- For authentication changes, update Supabase settings in the dashboard and adjust logic in `utils/supabase/client.ts` and `app/auth/`.
- To add a new API route, create a file under `app/api/` and use the Supabase client for DB access.
- For new UI, use DaisyUI classes (see their docs for patterns). Example: `<input className="input input-bordered" />` for a styled input.
- For notifications, use the `NotificationBell` component and push notifications via `scripts/pushNotification.ts`.
- For troubleshooting, check `.env.local`, `.env`, Supabase dashboard, and console errors for hints.

---

For more details, see `README.md` and `CONTRIBUTING.md`. If conventions are unclear, ask for feedback or check recent PRs for examples.
