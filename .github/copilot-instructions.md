# Cognify AI Coding Agent Instructions

## Project Architecture & Patterns

- **Monorepo structure**: Main app in `app/`, shared logic in `lib/`, UI in `src/components/`, hooks in `hooks/`.
- **Next.js 15 (App Router)**: Server Components for data loading, Client Components for interactivity. See `app/(main)/[feature]/` for feature modules.
- **Supabase**: All data access via Supabase client (`lib/supabase/`). Row Level Security (RLS) is enforced; never manually filter by user ID unless necessary.
- **SRS Logic**: Spaced repetition (SM-2) logic is in `lib/srs/`. Always use project-specific SRS settings, not hardcoded values.
- **Styling**: Tailwind CSS + DaisyUI. Use semantic class names and utility classes. UI primitives in `components/ui/`.
- **State**: Minimal global state via Zustand. Prefer local state/hooks for most UI.

## Key Conventions

- **File Organization**:

  - `app/(main)/[feature]/`: Feature modules (dashboard, projects, settings, etc.)
  - `actions/`: Server actions for CRUD/data mutations
  - `components/`: Feature-specific UI
  - `src/components/`: Shared UI and feature widgets
  - `hooks/`: Data and UI hooks (e.g., `useProjects.ts`, `useTheme.ts`)
  - `lib/srs/`: SRS algorithm, session, and DB utils

- **Component Pattern**:

  - Server Component loads data, passes to Client Component for interactivity
  - Example: `app/(main)/projects/page.tsx` loads projects, passes to `ProjectsList` (client)

- **Data Flow**:

  - All DB access via Supabase client in `lib/supabase/`
  - Batch updates for SRS state (see `lib/srs/SRSDBUtils.ts`)
  - Use RLS for security; avoid leaking data between users

- **Notifications**:
  - Use `sonner` for toasts (`components/ui/sonner.tsx`)
  - Study reminders and app notifications in DB (`user_notifications`, `app_notifications`)

## Developer Workflows

- **Build**: `pnpm build` (see `package.json`)
- **Dev**: `pnpm dev` (Next.js dev server)
- **Lint**: `pnpm lint` (ESLint, config in `eslint.config.mjs`)
- **Typecheck**: `pnpm typecheck`
- **Manual Testing**: Prioritize full user flows (auth, project, study, settings)

## Project-Specific Guidance

- **SRS Algorithm**: Never hardcode intervals/ease. Always use project settings from DB. See `lib/srs/SRSScheduler.ts` and `lib/srs/SRSDBUtils.ts`.
- **Session Continuity**: Study sessions must persist across reloads (use localStorage as in `useStudySession`).
- **Notifications**: Clean up reminders when projects/cards are deleted.
- **Settings**: Theme and SRS config are per-user and per-project. Sync with DB and localStorage.
- **Testing**: No formal test suite; rely on TypeScript and manual user flow testing.

## Examples

- **Server Action**: `app/(main)/projects/actions.ts` for project CRUD
- **SRS Update**: `lib/srs/SRSDBUtils.ts` for batch SRS state upserts
- **UI Toast**: `import { toast } from 'sonner'; toast('Saved!');`

## Do/Don't

- **Do**: Keep code simple, readable, and maintainable. Use project conventions. Test full user journeys.
- **Don't**: Over-engineer, add unnecessary abstractions, or break SRS logic. Avoid global state unless necessary.

---

For unclear or missing patterns, ask for clarification or check `README.md` and `ARCHITECTURE.md`.
