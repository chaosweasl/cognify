# Copilot Instructions for Cognify

## Project Overview

Cognify is an AI-powered flashcard application built with Next.js 15, React 19, TypeScript, and Supabase. It converts notes and documents into interactive flashcards using a sophisticated Spaced Repetition System (SRS) similar to Anki.

## Core Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with DaisyUI components
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth
- **State Management**: Zustand stores with sophisticated caching layer
- **Build Tool**: Turbopack for development
- **Package Manager**: pnpm

### Project Structure

```
app/
├── (main)/                 # Authenticated routes
│   ├── dashboard/          # Main dashboard
│   ├── projects/           # Project management
│   │   ├── [id]/          # Individual project pages
│   │   └── components/     # Project-specific components
│   └── settings/          # User settings
├── api/                   # API routes
├── auth/                  # Authentication pages
└── login/                 # Login functionality

components/                # Shared UI components
utils/supabase/           # Database utilities
hooks/                    # Custom React hooks
```

## Development Guidelines

### Code Standards

- Use TypeScript for all new code with strict type safety
- **Never use `any` or `unknown` types** - always specify proper interfaces/types
- **Clean up unused imports and variables** - maintain zero linting warnings
- Follow Next.js App Router conventions
- Use Tailwind CSS classes, prefer DaisyUI components
- Implement proper error handling with try-catch blocks
- Use Supabase client utilities for database operations
- **Add console.log statements liberally for debugging** - they help track data flow and identify issues
- Remove console.logs only when explicitly asked or in production builds

### Performance & Caching Architecture

**CRITICAL**: Cognify implements a sophisticated multi-layer caching system to avoid N+1 queries and optimize performance.

#### Caching Patterns

- **Zustand-based global cache** (`hooks/useCache.ts`) with TTL and versioning
- **SessionStorage batch caching** for project statistics (`ProjectList.tsx`)
- **Automatic cache invalidation** on data mutations
- **Batch APIs** for reducing multiple requests to single calls

```typescript
// Use the global caching system
import { cachedFetch, CacheInvalidation } from "@/hooks/useCache";

const data = await cachedFetch(
  "projects",
  async () => supabase.from("projects").select("*"),
  { ttl: 60000 } // 1 minute cache
);
```

#### Key Performance Patterns

- **Batch API example**: `/api/projects/batch-stats` consolidates 25+ individual requests into 1
- **Cache-first data fetching**: Always check cache before hitting database
- **Automatic cleanup**: Expired cache entries removed every 5 minutes
- **Development utilities**: `window.cognifyCache` available in dev mode for debugging

### SRS System (Protected Core Logic)

**CRITICAL**: The SRS algorithm is the core of Cognify and should NOT be modified without explicit approval.

#### Key SRS Components

- `SRSScheduler.ts` - Core Anki-compatible SM-2 algorithm implementation
- `SRSSession.ts` - Session management and daily limits
- Default settings follow Anki-inspired intervals and ease factors
- Supports learning steps, relearning, ease factors, and leech detection

#### SRS Usage Pattern

```typescript
import { scheduleCardWithSessionLimits, SRSRating } from "./SRSScheduler";

// Always use session-aware scheduling
const { updatedCard, updatedSession } = scheduleCardWithSessionLimits(
  card,
  rating,
  settings,
  session
);
```

### Database Patterns

#### Core Schema

```sql
projects (id, user_id, name, description, created_at)
flashcards (id, project_id, front, back, extra, created_at, updated_at)
srs_states (id, user_id, card_id, project_id, state, due, interval, ease, ...)
daily_study_stats (user_id, date, new_cards_studied, reviews_completed)
```

#### Database Best Practices

- **RLS (Row Level Security)** policies on all user tables
- **Foreign key constraints** maintain referential integrity
- **Batch queries** instead of individual lookups (see `batch-stats` API)
- **Proper indexing** on user_id, project_id, due dates

### API Design Patterns

#### REST API Conventions

- GET for data retrieval (never use POST for fetching)
- Batch endpoints for multiple related queries
- Consistent error handling with proper HTTP status codes
- Server-side authentication validation on all routes

```typescript
// API route pattern
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Implementation
}
```

### State Management Patterns

#### Zustand Store Structure

- **Cached stores**: `useCachedProjectsStore`, `useCachedUserProfileStore`
- **Settings store**: `useSettings` with SRS configuration
- **Global cache store**: `useCacheStore` for performance optimization

```typescript
// Store pattern with caching
const store = create<State>((set, get) => ({
  data: [],
  loadData: async () => {
    const data = await cachedFetch("key", fetcher);
    set({ data });
  },
}));
```

### Developer Workflow

#### Essential Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Production build
- `pnpm lint` - ESLint check
- `pnpm exec tsx scripts/SCRIPT_NAME.ts` - Run utility scripts

#### Development Scripts

- `scripts/createTestProject.ts` - Create test data
- `scripts/deleteTestUserProjects.ts` - Clean up test data
- `scripts/debugSRSCardStates.ts` - Debug SRS states

#### Testing & Debugging

- **SRS Tests**: Built-in test suite in `SRSTest.ts` validates Anki compatibility
- **Cache utilities**: `useCacheUtilities()` for debugging cache performance
- **Database health**: Debug utilities in `utils/debug/` directory
- **Error logging**: Enhanced error tracking in `dailyStudyStats.ts`

### Project-Specific Conventions

#### Component Organization

- **Project components**: `app/(main)/projects/components/`
- **Shared components**: `components/`
- **SRS components**: Keep algorithm logic in `SRSScheduler.ts`
- **UI components**: Follow DaisyUI patterns consistently

#### Error Handling

- **Try-catch blocks** around all async operations
- **Meaningful error messages** for users
- **Console logging** for developer debugging
- **Graceful degradation** when services are unavailable

### Integration Points

#### Supabase Integration

- **Server client**: `utils/supabase/server.ts` for API routes
- **Client**: `utils/supabase/client.ts` for browser code
- **Middleware**: `utils/supabase/middleware.ts` for auth handling
- **Admin client**: `utils/supabase/superClient.ts` for scripts

#### External Dependencies

- **AI Integration**: User-provided API keys (OpenAI, Anthropic)
- **Analytics**: Vercel Analytics and Speed Insights
- **UI Framework**: DaisyUI components with custom themes

## Critical Patterns to Follow

1. **Cache-first data access** - Always use caching layer for database queries
2. **Batch API calls** - Consolidate multiple requests into single endpoints
3. **Session-aware SRS** - Use `scheduleCardWithSessionLimits` for all card scheduling
4. **Proper TypeScript** - No `any` types, define interfaces for all data shapes
5. **Zustand stores** - Use existing cached stores rather than creating new ones
6. **Error boundaries** - Implement proper error handling at component boundaries

### Key Patterns

#### Database Operations

```typescript
import { createClient } from "@/utils/supabase/server";

const supabase = createClient();
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("user_id", userId);
```

#### Component Structure

- Use functional components with TypeScript interfaces
- Implement proper loading and error states
- Follow DaisyUI component patterns
- Use semantic HTML with proper accessibility

#### State Management

- Use Zustand for complex state (settings, user profile)
- Prefer React state for component-local state
- Use Supabase real-time subscriptions for live data

### Spaced Repetition System (SRS)

**CRITICAL**: The SRS algorithm is the core of Cognify and should NOT be modified without explicit approval.

#### Key SRS Components

- `SRSScheduler.ts` - Core algorithm implementation
- `StudyFlashcards.tsx` - Main study interface
- `AnkiRatingControls.tsx` - Rating system (Again, Hard, Good, Easy)
- Default settings follow Anki-inspired intervals

#### SRS Features

- New cards progress through learning steps
- Review cards use SM-2 algorithm with ease factors
- Failed cards enter relearning mode
- Daily limits for new cards and reviews
- Customizable settings in user preferences

### Selective Open Source Approach

#### Areas Open for Contribution

- **Themes & UI**: DaisyUI themes, component styling, animations
- **Documentation**: Guides, tutorials, API docs
- **QoL Features**: Small improvements, accessibility, UX enhancements
- **Bug Fixes**: UI bugs, error handling, performance issues

#### Protected Areas (Core Logic)

- SRS algorithm and scheduling logic
- Database schema and migrations
- Authentication flows
- AI integration architecture
- Payment/billing system (future)
- Core business logic

### When Working on Cognify

#### For UI/Theme Contributions

- Follow existing DaisyUI patterns
- Test across different screen sizes
- Ensure accessibility compliance
- Maintain consistent spacing and typography
- Test theme switching functionality

#### For Documentation

- Use clear, beginner-friendly language
- Include code examples and screenshots
- Update both inline comments and external docs
- Consider non-technical users

#### For Bug Fixes

- Reproduce the issue first
- Add proper error handling
- Test edge cases
- Ensure fix doesn't break other functionality
- Add console logging for debugging if needed

### Component Guidelines

#### Flashcard Components

- `FlashcardDisplay.tsx` - Card presentation
- `FlashcardEditor.tsx` - Card creation/editing
- `ProjectCard.tsx` - Project overview cards
- Follow consistent prop interfaces and error handling

#### Study Session Components

- Maintain separation between UI and SRS logic
- Handle loading states gracefully
- Implement keyboard shortcuts (spacebar to flip, 1-4 for ratings)
- Show progress indicators

### Database Patterns

#### User Data

- All user data tied to `user_id` from Supabase Auth
- Implement RLS (Row Level Security) policies
- Use proper foreign key relationships

#### Project Structure

```sql
projects (id, user_id, name, description, created_at)
flashcards (id, project_id, front, back, created_at)
srs_states (id, user_id, flashcard_id, state, due, interval, ease, etc.)
```

### Styling Guidelines

#### Tailwind CSS Usage

- Use utility classes over custom CSS
- Prefer DaisyUI component classes
- Follow responsive design principles
- Use CSS variables for theme customization

#### DaisyUI Components

- Button variants: `btn`, `btn-primary`, `btn-outline`
- Cards: `card`, `card-body`, `card-title`
- Forms: `input`, `textarea`, `select`
- Themes: Support multiple themes via data-theme

### Performance Considerations

#### Optimization Strategies

- Use React.memo for expensive components
- Implement proper loading states
- Debounce database writes (SRS state updates)
- Use Supabase real-time subscriptions efficiently
- Optimize bundle size with proper imports

#### Study Session Performance

- Batch SRS state updates
- Minimize re-renders during study
- Preload next cards when possible
- Cache computed values

### Error Handling

#### User-Facing Errors

- Use toast notifications for feedback
- Provide clear error messages
- Implement retry mechanisms
- Graceful degradation for network issues

#### Developer Errors

- Use proper try-catch blocks
- Log errors for debugging
- Validate data at boundaries
- Handle edge cases

### Testing Approach

#### Manual Testing Requirements

- Test theme switching
- Verify mobile responsiveness
- Check study session flow
- Validate SRS scheduling accuracy
- Test with various content types

#### Areas to Test

- Authentication flows
- Flashcard creation and editing
- Study session functionality
- Settings persistence
- Project management

### AI Integration

**Note**: AI features are in development and architecture may change.

#### Current Approach

- User-provided API keys (stored securely)
- Configurable AI models
- Content analysis for flashcard generation
- No server-side AI processing

### Future Considerations

#### Planned Features

- Enhanced AI integration options
- Mobile app development
- Advanced analytics
- Import/export functionality
- Community features

#### Technical Debt

- Improve TypeScript coverage
- Add comprehensive testing
- Optimize bundle size
- Enhance error monitoring

## Development Workflow

### Getting Started

1. Clone and install dependencies with `pnpm install`
2. Set up Supabase environment variables
3. Run development server with `pnpm dev`
4. Focus on approved contribution areas

### Before Contributing

1. Check existing issues and discussions
2. Create issue for non-trivial changes
3. Follow coding standards and patterns
4. Test thoroughly across devices
5. Update documentation as needed

Remember: Cognify aims to be a high-quality, focused learning platform. Maintain the balance between open collaboration and protected core functionality.
