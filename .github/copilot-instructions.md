# Cognify AI Coding Agent Instructions

## Project Architecture & Patterns

- **Monorepo structure**: Main app in `app/`, shared logic in `lib/`, UI in `src/components/`, hooks in `hooks/`.
- **Next.js 15 (App Router)**: Server Components for data loading, Client Components for interactivity. See `app/(main)/[feature]/` for feature modules.
- **Supabase**: All data access via Supabase client (`lib/supabase/`). Row Level Security (RLS) is enforced; never manually filter by user ID unless necessary.
- **SRS Logic**: Spaced repetition (SM-2) algorithm in `lib/srs/`. Always use project-specific SRS settings, not hardcoded values.
- **AI Integration**: Multi-provider AI system (OpenAI, Anthropic, Ollama, LM Studio, DeepSeek) with localStorage-only API key storage.
- **Styling**: Tailwind CSS + DaisyUI for consistent design system. Use Tailwind utility classes and DaisyUI components. Custom styles in `app/globals.css` and micro-interactions in `app/globals-micro-interactions.css`. UI primitives in `components/ui/`.
- **State**: Minimal global state via Zustand. Prefer local state/hooks for most UI.

## Key Conventions

- **File Organization**:

  - `app/(main)/[feature]/`: Feature modules (dashboard, projects, settings, etc.)
  - `app/api/`: API routes organized by feature (ai/, projects/, user/, srs/, system/)
  - `src/components/`: Feature-specific UI components organized by domain
  - `components/`: Shared UI primitives and reusable components
  - `hooks/`: Data and UI hooks (e.g., `useProjects.ts`, `useAISettings.ts`)
  - `lib/srs/`: SRS algorithm, session management, and database utilities
  - `lib/utils/`: Utility functions organized by purpose (security, validation, etc.)
  - `lib/supabase/`: Database access patterns and RLS policies

- **Component Pattern**:

  - Server Component loads data, passes to Client Component for interactivity
  - Example: `app/(main)/projects/page.tsx` loads projects, passes to `ProjectsList` (client)
  - Use React Server Components for data fetching, Client Components for user interactions

- **Data Flow**:

  - All DB access via Supabase client in `lib/supabase/`
  - Batch updates for SRS state (see `lib/srs/SRSDBUtils.ts`)
  - Use RLS for security; avoid leaking data between users
  - Cache invalidation patterns via `hooks/useCache.ts`

- **AI Integration**:

  - API keys stored ONLY in localStorage, never in database
  - Multi-provider support with connection testing
  - PDF text extraction + AI flashcard generation pipeline
  - Token usage tracking and daily limits

- **Notifications**:
  - Use `sonner` for toasts (`components/ui/sonner.tsx`)
  - Study reminders and app notifications in DB (`user_notifications`, `app_notifications`)
  - Enhanced NotificationBell component with real-time updates

## API Architecture (See docs/API.md)

- **Authentication**: Supabase Auth with OAuth providers
- **AI Endpoints**: `/api/ai/*` for PDF processing and flashcard generation
- **Project Management**: `/api/projects/*` with full CRUD and statistics
- **SRS System**: `/api/srs/*` for spaced repetition state management
- **User Management**: `/api/user/*` for profiles, settings, and data export/import
- **System**: `/api/system/*` for analytics and error logging

## Feature Implementation Status

### ✅ **COMPLETED MVP FEATURES**

1. **Authentication & Security**: Complete onboarding flow, RLS policies, input validation
2. **AI-Powered Flashcard Generation**: Multi-provider support, PDF processing, token tracking
3. **Complete Flashcard System**: CRUD operations, JSON import/export, duplicate detection
4. **SRS & Study System**: SM-2 algorithm, session persistence, progress tracking
5. **Project Management**: CRUD operations, templates, bulk operations, statistics
6. **Settings & Configuration**: Theme system, user preferences, AI provider management
7. **Notifications & Reminders**: Study reminder system, notification bell, system announcements

### 🚧 **IN PROGRESS**

- **Production Readiness**: Security audit, performance optimization, deployment setup
- **Admin Dashboard**: User management, system health monitoring
- **Enhanced Analytics**: Study insights, progress tracking improvements

## Developer Workflows

- **Build**: `pnpm build` (see `package.json`)
- **Dev**: `pnpm dev` (Next.js dev server)
- **Lint**: `pnpm lint` (ESLint, config in `eslint.config.mjs`)
- **Typecheck**: `pnpm typecheck`
- **Manual Testing**: Prioritize full user flows (auth, onboarding, AI flashcard generation, study sessions)

## Project-Specific Guidance

- **SRS Algorithm**: Never hardcode intervals/ease. Always use project settings from DB. See `lib/srs/SRSScheduler.ts` and `lib/srs/SRSDBUtils.ts`.
- **AI Configuration**: Store API keys ONLY in localStorage. Validate configurations before use. Support multiple providers gracefully.
- **Session Continuity**: Study sessions must persist across reloads (localStorage + database sync).
- **Notifications**: Clean up reminders when projects/cards are deleted. Handle unauthenticated users gracefully.
- **Settings**: Theme and SRS config are per-user and per-project. Sync with DB and localStorage.
- **Security**: All user inputs must be sanitized. Use utilities in `lib/utils/security.ts` and `lib/utils/validation.ts`.
- **Performance**: Implement rate limiting, optimize database queries, use proper caching strategies.

## Architecture Patterns

### Data Access Pattern

```typescript
// ✅ Correct: Use Supabase client with RLS
const { data, error } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", userId); // RLS handles this automatically

// ❌ Wrong: Manual filtering
const projects = allProjects.filter((p) => p.user_id === userId);
```

### Error Handling Pattern

```typescript
// ✅ Correct: Comprehensive error handling
try {
  const result = await apiCall();
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  // Handle success
} catch (error) {
  console.error("API Error:", error);
  toast.error("An unexpected error occurred");
}
```

### Component Organization Pattern

```typescript
// ✅ Feature-based organization
src/components/
├── study/              // Study-related components
│   ├── StudySession.tsx
│   ├── StudyProgress.tsx
│   └── ReviewScheduler.tsx
├── projects/           // Project-related components
│   ├── ProjectCard.tsx
│   ├── ProjectList.tsx
│   └── ProjectEditor.tsx
└── settings/           // Settings-related components
    ├── AIConfiguration.tsx
    └── ThemeSelector.tsx
```

## Examples

- **Server Action**: `app/(main)/projects/actions.ts` for project CRUD operations
- **SRS Updates**: `lib/srs/SRSDBUtils.ts` for batch SRS state upserts with optimized queries
- **AI Integration**: `app/api/ai/generate-flashcards/route.ts` for multi-provider AI flashcard generation
- **UI Notifications**: `import { toast } from 'sonner'; toast.success('Saved!');`
- **Theme Management**: `hooks/useTheme.ts` for persistent theme state management

## Security Guidelines

- **Input Validation**: Use Zod schemas from `lib/utils/validation.ts`
- **API Security**: Implement rate limiting via `lib/utils/rateLimit.ts`
- **Data Sanitization**: Use `lib/utils/security.ts` utilities for input cleaning
- **Authentication**: Always check user auth status in API routes
- **API Keys**: NEVER store in database - localStorage only for user-provided keys

## Performance Guidelines

- **Database**: Use batch operations for SRS updates, implement proper indexing
- **AI Requests**: Implement token tracking and daily limits
- **Caching**: Use `hooks/useCache.ts` for intelligent cache management
- **Assets**: Optimize images and implement lazy loading where appropriate
- **Code Splitting**: Dynamic imports for heavy components and routes

## Do/Don't

### ✅ **DO**

- Keep code simple, readable, and maintainable
- Use project conventions and established patterns
- Test full user journeys (onboarding → AI setup → flashcard creation → study)
- Handle errors gracefully with user-friendly messages
- Follow the established file organization structure
- Use TypeScript strictly - avoid `any` types
- Implement proper loading states and optimistic updates

### ❌ **DON'T**

- Over-engineer simple features or add unnecessary abstractions
- Break SRS logic or hardcode intervals/ease factors
- Store sensitive data (API keys) in the database
- Ignore error states or loading states in UI components
- Use global state unless absolutely necessary
- Bypass validation or sanitization for user inputs
- Implement features without proper authentication checks

---

For specific implementation details, refer to:

- `docs/API.md` - Complete API documentation
- `docs/UTILS.md` - Utility functions documentation
- `docs/todo.md` - Feature implementation status
- Individual component files for usage patterns
