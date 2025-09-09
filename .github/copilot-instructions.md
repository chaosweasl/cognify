# Cognify AI Coding Assistant Instructions

## Project Overview

Cognify is an AI-powered spaced repetition study platform built with Next.js 15, Supabase, and multi-provider AI integration. Users bring their own API keys (BYO model) to generate flashcards, cheatsheets, and quizzes from PDFs and text.

## Architecture & Key Patterns

### Next.js App Router Structure

- `app/(main)/[feature]/` - Feature routes (server components for data, client components for UI)
- `app/api/` - API routes with security middleware (`withApiSecurity`)
- All data fetching uses server components, client components handle interactivity

### Authentication & Security

- **Supabase Auth**: All API routes require authentication via `createClient()`
- **RLS**: Database access relies on Row Level Security - never bypass with service role
- **API Security**: Wrap all API routes with `withApiSecurity` from `lib/utils/apiSecurity.ts`
- **Input validation**: Use `validateAndSanitizeText`, `validateUUID` from `lib/utils/security.ts`

```typescript
// Standard API route pattern
export const POST = withApiSecurity(
  async (request: NextRequest) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // ... implementation
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["POST"],
  }
);
```

### AI Integration (BYO Keys Model)

- **Provider Support**: OpenAI, Anthropic, Ollama, LM Studio, DeepSeek, custom OpenAI-compatible
- **Key Storage**: API keys in localStorage only via `hooks/useAISettings.ts` + `aiKeyStorage`
- **Generation Flow**: `app/api/ai/generate-flashcards/route.ts` - server validates, calls provider, returns drafts
- **Security**: Never store API keys server-side, always require user acceptance before DB save

```typescript
// AI provider integration pattern
const fullConfig = {
  ...currentConfig,
  apiKey: aiKeyStorage.getApiKey(config.provider),
};
```

### Database Patterns

- **Supabase Client**: Use `lib/supabase/client.ts` (browser) or `lib/supabase/server.ts` (server)
- **Actions**: Database operations in `app/(main)/[feature]/actions/`
- **Relations**: projects → flashcards → srs_states (user isolation via RLS)
- **Migrations**: Schema in `schema-dump.sql`, create a .sql migration file for changes.

### State Management

- **Zustand**: Global stores in `hooks/` (useProjects, useAISettings, useFlashcards)
- **Persistence**: Use `persist` middleware, separate sensitive data (API keys in localStorage)
- **Local State**: Prefer React hooks over Zustand when data doesn't need sharing

### SRS (Spaced Repetition System)

- **Core Logic**: `lib/srs/SRSScheduler.ts` - handles intervals, difficulty adjustments
- **Sessions**: `lib/srs/SRSSession.ts` - manages study sessions, progress tracking
- **Database**: `lib/srs/SRSDBUtils.ts` - database operations for SRS states

### UI & Styling Patterns

- **Design System**: ShadCN components in `components/ui/`, customize via Tailwind
- **Theming**: CSS variables for colors, semantic naming (`--surface-primary`, `--text-muted`)
- **Glass Effects**: `glass-surface` class for cards, `bg-gradient-brand` for CTAs
- **Loading States**: Use skeleton components from `src/components/ui/skeleton-layouts.tsx`
- **Animations**: Prefer CSS animations over JS, use `transition-all transition-normal`

## Development Workflows

### Key Commands

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint check
npx tsc --noEmit  # Type checking
```

### Testing Strategy

- Unit tests for core logic (SRS, AI parsing, validation)
- Integration tests for API routes with mock providers
- Manual QA for AI workflows (generation → preview → accept)

### File Organization

```
app/(main)/feature/          # Feature pages (server components)
├── components/              # Feature-specific client components
├── actions/                 # Server actions for data mutations
└── page.tsx                 # Main feature page

src/components/feature/      # Reusable components
components/ui/              # Design system primitives
hooks/                      # Zustand stores and React hooks
lib/                        # Core utilities and integrations
```

## AI-Specific Development Notes

### Content Generation Pipeline

1. **Input**: User provides text/PDF + AI config (provider, model, API key)
2. **Processing**: Server chunks content, calls AI provider, parses JSON response
3. **Preview**: Client shows generated content in draft state with edit capability
4. **Acceptance**: User reviews and accepts items for database save

### Provider Integration Pattern

```typescript
// Add new AI provider in lib/ai/types.ts
export const AI_PROVIDERS = {
  'new-provider': {
    id: 'new-provider',
    name: 'New Provider',
    requiresApiKey: true,
    models: [/* model definitions */],
    configFields: [/* configuration fields */]
  }
};

// Implement in app/api/ai/generate-flashcards/route.ts
case "new-provider":
  return generateWithNewProvider(config, prompt);
```

### Error Handling Priorities

1. **CORS Issues**: Detect and redirect to manual import flow
2. **Rate Limits**: Show provider-specific guidance
3. **Invalid JSON**: Parse errors with helpful formatting suggestions
4. **Auth Failures**: Clear messaging about API key issues

## Common Pitfalls

- ❌ Don't bypass RLS with service role client
- ❌ Don't store API keys server-side or in Zustand
- ❌ Don't save AI-generated content without user acceptance
- ❌ Don't forget `withApiSecurity` wrapper on API routes
- ✅ Always validate user input and sanitize content
- ✅ Use semantic CSS variables for theming
- ✅ Implement proper loading states and error boundaries
- ✅ Test AI workflows with multiple providers

## Key Integration Points

- **Authentication**: `lib/supabase/middleware.ts` handles session management
- **Caching**: Custom cache invalidation in `hooks/useCache.ts`
- **Notifications**: In-app notifications via `lib/supabase/appNotifications.ts`
- **Analytics**: Event tracking in `lib/utils/analytics.ts`
- **Admin Tools**: System monitoring in `src/components/admin/`
