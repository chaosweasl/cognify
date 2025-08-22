## Toast Notification Architecture

- Toast notifications are provided via [shadcn/ui] and [sonner].
- The `ToasterProvider` component (in `components/ui/toaster-provider.tsx`) should be included at the root layout level.
- Use the `toast` API from `sonner` in any client component for user feedback (success, error, info, etc).

**Example:**

```tsx
import { toast } from "sonner";
toast.success("Project deleted successfully!");
```

# Cognify Architecture

## Core Philosophy

Cognify is designed to be **lightweight and maintainable**. Every architectural decision prioritizes simplicity over sophistication, enabling rapid development and easy debugging.

## Design Principles

### 1. **Simplicity First**

- Minimal abstractions and layers
- Clear, linear data flow
- Avoid over-engineering for future scale
- Choose readable code over clever code

### 2. **Efficient by Default**

- Batch database operations where possible
- Smart caching with automatic invalidation
- Lazy loading and memoization patterns
- Minimal re-renders and API calls

### 3. **Type Safety Without Complexity**

- Strong TypeScript usage throughout
- Simple, clear type definitions
- Avoid complex generic abstractions
- Prefer explicit types over inference where clarity matters

### 4. **Solo-Developer Maintainability**

- Self-documenting code structure
- Consistent patterns across features
- Easy debugging and error tracking
- Minimal external dependencies

## Design System & Color Palette

### Core Palette

- **Primary (Accent):** Blue-500 (#3B82F6)
  - Calming, futuristic blue for trust, focus, and a modern AI feel
- **Secondary (Highlight/Contrast):** Violet-500 (#8B5CF6)
  - Vibrant, creative, and tech-forward; used for highlights and CTAs
- **Optional Secondary:** Teal-500 (#14B8A6)
  - Balanced, calming; can be swapped for a more serious tone
- **Neutral Backgrounds:**
  - Light: Gray-50 (#F9FAFB) background, Gray-900 (#111827) text
  - Dark: Slate-900 (#0F172A) background, Gray-50 (#F9FAFB) text
- **Success/Progress:** Green-500 (#22C55E) for mastered cards
- **Warning/Error:** Red-500 (#EF4444), softened for non-hostile feedback

#### Light vs. Dark Mode

- **Light mode:** Bright backgrounds, blue as main accent, violet for highlights
- **Dark mode:** Deep slate-900 with glowing blue/violet highlights for immersive study

#### UX Rationale

- Avoid harsh pure black/white for long study sessions
- Blue + violet combo differentiates Cognify from typical academic apps
- Consistent palette across flashcards, dashboards, and analytics for strong brand identity

**Locked-in Theme:**

- Primary: Blue-500 (#3B82F6)
- Secondary: Violet-500 (#8B5CF6)
- Background (Light): Gray-50 (#F9FAFB)
- Background (Dark): Slate-900 (#0F172A)

This gives Cognify a crisp, intelligent, and slightly futuristic aesthetic without being overwhelming.

---

## Copilot Instructions

- See `.github/copilot-instructions.md` for detailed guidelines on code patterns, file structure, and design consistency.
- All UI and code contributions should follow the color palette and design system above for a unified user experience.

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, DaisyUI for components
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: Zustand (minimal global state)
- **Deployment**: Vercel

### Key Libraries

- `lucide-react` - Icons
- `react-hot-toast` - Notifications
- `zustand` - Global state (projects list only)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase DB   │    │  Supabase Auth  │
│   (App Router)  │◄──►│   (PostgreSQL)  │    │      (JWT)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Client State   │    │   RLS Policies  │    │  Middleware     │
│   (Zustand)     │    │   Row Security  │    │  Auth Guard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow

### 1. Authentication Flow

1. User accesses login page at `/auth/login`
2. Login/signup handled via API routes (`/api/auth/login`, `/api/auth/github`)
3. JWT token stored in httpOnly cookies via Supabase Auth
4. Middleware validates tokens and handles auth redirects
5. Onboarding flow at `/auth/onboarding` for new users
6. Row Level Security enforces data isolation

### 2. Application Data Flow

1. **Page Component** receives initial data via Server Components
2. **Client Components** use hooks for interactive data
3. **Hooks** coordinate with cached API calls
4. **Cache Layer** prevents duplicate requests
5. **Database** enforces security and data integrity

### 3. Study Session Flow

1. Load project and flashcards
2. Calculate available cards using SRS algorithm
3. Present cards in optimized order
4. Track responses and update SRS states
5. Batch save states to database

## Core Features

### Projects

- **Purpose**: Container for related flashcards
- **Key Files**:
  - `app/(main)/projects/` - Pages and layouts
  - `hooks/useProjects.ts` - Data management
  - `src/components/projects/` - UI components

### Flashcards

- **Purpose**: Basic front/back card structure
- **Key Files**:
  - `app/(main)/projects/actions/flashcard-actions.ts` - CRUD operations
  - `src/components/flashcards/` - UI components

### Spaced Repetition System (SRS)

- **Purpose**: SM-2 algorithm implementation for optimal learning
- **Key Files**:
  - `lib/srs/` - Core SRS logic
  - `src/components/study/` - Study interface
  - Database triggers for automatic SRS state creation

### User Management

- **Purpose**: Authentication and profile management
- **Key Files**:
  - `hooks/useUserId.ts` - User identification
  - `hooks/useUserProfile.ts` - Profile management

## Database Schema

### Core Tables

- `profiles` - User profiles and preferences
- `projects` - Study projects/decks
- `flashcards` - Card content (front/back)
- `srs_states` - Spaced repetition algorithm state
- `daily_study_stats` - Progress tracking

### Key Relationships

```sql
profiles (1) ──── (∞) projects
projects (1) ──── (∞) flashcards
flashcards (1) ──── (1) srs_states
profiles (1) ──── (∞) srs_states
```

## Caching Strategy

### Cache Layers

1. **Zustand Store** - Global project list only
2. **Custom Cache Hook** - API response caching with TTL
3. **Session Storage** - Browser-level persistence

### Cache Invalidation

- **Pattern-based**: Invalidate related data (e.g., all project data)
- **Version-based**: Global cache busting
- **Automatic cleanup**: Every 5 minutes

## File Organization

```
cognify/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main application pages (protected)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints (login, github)
│   │   ├── flashcards/    # Flashcard CRUD operations
│   │   └── projects/      # Project management
│   └── auth/              # Authentication pages
│       ├── login/         # Login/signup form
│       ├── onboarding/    # Profile setup for new users
│       ├── callback/      # OAuth callback handler
│       └── confirm/       # Email confirmation
├── src/
│   ├── components/        # Reusable UI components
│   └── types/            # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── lib/
│   ├── srs/              # Spaced repetition logic
│   ├── supabase/         # Database clients
│   └── utils/            # Utility functions
├── middleware.ts         # Auth middleware with onboarding checks
└── schema-dump.sql       # Database schema
```

## Development Guidelines

### Code Organization

- **Server Components** for initial data loading
- **Client Components** for interactivity
- **Custom Hooks** for data logic
- **Pure Functions** for business logic

### Error Handling

- Clear error messages for users
- Comprehensive logging for debugging
- Graceful fallbacks for failed operations
- Type-safe error boundaries

### Performance

- Batch database operations
- Memoize expensive calculations
- Lazy load components and data
- Monitor and eliminate N+1 queries

### Testing Philosophy

- Manual testing for UI workflows
- Database integrity via constraints
- Type safety via TypeScript
- Simple integration tests only

## Deployment

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_SITE_URL=<site-url>
```

### Build Process

```bash
npm run build    # Next.js production build
npm start        # Start production server
```

### Database Migrations

- Use Supabase dashboard for schema changes
- Update `schema-dump.sql` for documentation
- Test with production data dumps

## Scaling Considerations

### Current Limitations (By Design)

- Single developer maintenance
- No complex CI/CD pipeline
- Minimal testing infrastructure
- Simple monitoring

### Future Scaling Points

1. **User Growth**: Add database indexing and query optimization
2. **Feature Complexity**: Consider feature flags and A/B testing
3. **Team Growth**: Add comprehensive testing and CI/CD
4. **Performance**: Implement edge caching and CDN

## Security

### Authentication

- **API Routes**: Login/signup via `/api/auth/login`, GitHub OAuth via `/api/auth/github`
- **Client-side**: Form submissions use fetch() to API endpoints
- **Token Storage**: JWT tokens in httpOnly cookies via Supabase Auth
- **Middleware**: Handles auth redirects and onboarding checks
- **Onboarding**: New users redirected to `/auth/onboarding` to complete profile

### Authorization

- Row Level Security (RLS) in database
- User-specific data isolation
- Admin privilege checking

### Data Protection

- Environment variable validation
- Input sanitization
- SQL injection prevention via Supabase client

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Monitor error logs weekly
- Review performance metrics
- Clean up unused code

### Debugging Tools

- Browser dev tools for frontend
- Supabase dashboard for database
- Vercel analytics for performance
- Simple logging for application flow

---

_This architecture prioritizes developer velocity and maintainability over enterprise-scale complexity. As the application grows, individual components can be enhanced without major architectural changes._
