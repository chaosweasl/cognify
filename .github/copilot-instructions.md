# Copilot Instructions for Cognify

## Project Overview

Cognify is an AI-powered flashcard application built with Next.js 15, React 19, TypeScript, and Supabase. It converts notes and documents into interactive flashcards using a sophisticated Spaced Repetition System (SRS) similar to Anki.

## Core Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with DaisyUI components
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth
- **State Management**: Zustand stores
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

- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Use Tailwind CSS classes, prefer DaisyUI components
- Implement proper error handling with try-catch blocks
- Use Supabase client utilities for database operations

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
