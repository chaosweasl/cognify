# GitHub Copilot Instructions for Cognify

## Project Overview

Cognify is an Anki-like spaced repetition learning platform with AI-powered flashcard generation. Built as a web-based platform where users can create accounts, build flashcard projects (decks), and study using the SM-2 algorithm. The project prioritizes **simplicity, maintainability, and solo-developer efficiency** over enterprise-scale complexity.

## Core Product Vision

### User Journey

1. **Landing Page** → Sign up/Login (or redirect to dashboard if authenticated)
2. **Dashboard** → Overview of projects, due cards, and statistics
3. **Project Creation** → Create new flashcard projects with customizable settings
4. **Content Import** → Manual flashcard creation or JSON import (CSV + LaTeX planned)
5. **Study Experience** → SM-2 algorithm-based spaced repetition sessions
6. **Progress Tracking** → Statistics, notifications, and study reminders
7. **Settings Management** → Profile, UI preferences, and project-specific SRS settings

### Key Features

- **User Accounts**: Username, bio, profile picture, and authentication
- **Projects (Decks)**: Flashcard collections with individual SM-2 settings
- **Study System**: Anki-compatible spaced repetition algorithm
- **Notifications**: Study reminders and app announcements
- **AI Integration** (Future): PDF import and automated flashcard generation

## Core Development Principles

### 1. **Lightweight Architecture**

- Prefer simple solutions over sophisticated ones
- Avoid over-engineering for future scale
- Choose readable code over clever abstractions
- Minimize dependencies and complexity
- Zero users = breaking changes are acceptable

### 2. **Solo-Developer Friendly**

- Self-documenting code patterns
- Consistent file organization
- Easy debugging and error tracking
- Clear separation of concerns
- Manual testing over extensive test suites

### 3. **Performance Focused**

- Efficient database queries and caching
- Smart use of local storage
- Batch operations where possible
- Lightweight but functional caching system

## Technology Stack

**Framework**: Next.js 15 (App Router), React 19, TypeScript  
**Database**: Supabase (PostgreSQL) with Row Level Security  
**Styling**: Tailwind CSS + DaisyUI  
**State**: Zustand (minimal global state only)  
**Auth**: Supabase Auth with JWT tokens  
**Database Schema**: Available in `schema-dump.sql` at repository root

## Database Schema Overview

### Core Tables

- `profiles` - User profiles (username, bio, avatar, admin status)
- `user_settings` - UI preferences and notification settings
- `projects` - Flashcard decks with project-specific SRS configuration
- `flashcards` - Individual cards with front/back content
- `srs_states` - SM-2 algorithm state for each card per user
- `study_sessions` - Session tracking and progress
- `daily_study_stats` - Daily learning analytics
- `user_notifications` - Study reminders and user-specific alerts
- `app_notifications` - System-wide announcements

### Key Relationships

- Projects belong to users and contain flashcards
- SRS states track learning progress per user/card combination
- Study sessions group learning activities
- Settings are split between global user preferences and project-specific SRS parameters

## Code Patterns to Follow

### File Organization

```
app/(main)/[feature]/
├── page.tsx              # Main page component (Server Component)
├── layout.tsx            # Feature layout
├── actions/              # Server actions for data mutations
│   ├── create.ts         # Creation operations
│   ├── update.ts         # Update operations
│   └── delete.ts         # Deletion operations
├── [id]/page.tsx         # Dynamic routes
└── components/           # Feature-specific components

src/components/[feature]/
├── [Feature]List.tsx     # List/grid components
├── [Feature]Card.tsx     # Individual item display
├── [Feature]Form.tsx     # Form components
└── [Feature]Modal.tsx    # Modal dialogs

hooks/
├── use[Feature].ts       # Data management hooks
├── use[Feature]Form.ts   # Form state management
└── use[Feature]Study.ts  # Study session hooks

lib/
├── srs/                  # Spaced repetition algorithm
├── database/             # Database utilities
├── auth/                 # Authentication helpers
└── utils/                # General utilities
```

### Component Patterns

```typescript
// Server Components for initial data loading
export default async function ProjectsPage() {
  const projects = await getProjects();
  const stats = await getDailyStats();
  return (
    <div>
      <ProjectsList initialProjects={projects} />
      <StatsOverview stats={stats} />
    </div>
  );
}

// Client Components for interactivity
("use client");
export function ProjectsList({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const { createProject, updateProject, deleteProject } = useProjects();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={updateProject}
          onDelete={deleteProject}
        />
      ))}
    </div>
  );
}

// Custom hooks for data management
export function useProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    loading,
    error,
    createProject: async (data: CreateProjectData) => {
      setLoading(true);
      try {
        const result = await createProjectAction(data);
        return result;
      } catch (err) {
        setError("Failed to create project");
        throw err;
      } finally {
        setLoading(false);
      }
    },
  };
}
```

### Database Patterns

```typescript
// Always use Supabase client for database operations
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      flashcards:flashcards(count),
      srs_states:srs_states(
        count,
        state,
        due
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Batch operations for SRS updates
export async function updateSRSStates(updates: SRSStateUpdate[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("srs_states").upsert(updates);

  if (error) throw error;
}

// Use RLS for automatic security
export async function getUserProjects(userId: string) {
  const supabase = await createClient();
  // RLS automatically filters by authenticated user
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  return data || [];
}
```

### SRS Algorithm Implementation

```typescript
// Keep SM-2 algorithm logic in /lib/srs/
export interface SRSCalculation {
  nextState: "new" | "learning" | "review" | "relearning";
  nextInterval: number;
  nextEase: number;
  nextDue: Date;
  isGraduating: boolean;
}

export function calculateNextSRS(
  currentState: SRSState,
  response: "again" | "hard" | "good" | "easy",
  projectSettings: ProjectSRSSettings
): SRSCalculation {
  // SM-2 algorithm implementation
  // Use project-specific settings, not hardcoded values
  // Handle learning steps, intervals, and ease calculations
}

// Study session management
export async function processCardResponse(
  cardId: string,
  response: CardResponse,
  sessionId: string
) {
  const srsCalculation = calculateNextSRS(currentState, response, settings);

  // Batch update SRS state and session progress
  await Promise.all([
    updateSRSState(cardId, srsCalculation),
    updateStudySession(sessionId, { cardsStudied: 1 }),
    updateDailyStats(userId, projectId, response),
  ]);
}
```

### Notification System

```typescript
// Schedule study reminders
export async function scheduleStudyReminder(
  userId: string,
  projectId: string,
  dueDate: Date
) {
  const supabase = await createClient();
  await supabase.from("user_notifications").insert({
    user_id: userId,
    project_id: projectId,
    type: "study_reminder",
    title: "Cards are ready for review",
    message: `You have cards due for study in ${projectName}`,
    scheduled_for: dueDate,
  });
}

// Clean up notifications for deleted projects
export async function cleanupProjectNotifications(projectId: string) {
  const supabase = await createClient();
  await supabase
    .from("user_notifications")
    .delete()
    .eq("project_id", projectId);
}
```

## Toast Notifications (shadcn/sonner)

### Usage

- Use the `ToasterProvider` component (in `components/ui/toaster-provider.tsx`) to enable toast notifications across the app.

**Setup:**

- Use the `toast` API from `sonner` in your client components for notifications.

### Example: Showing a Toast

```tsx
import { toast } from "sonner";

// Example usage:
toast.success("Project deleted successfully!");
toast.error("Failed to delete project");
```

## What NOT to Do

### ❌ Avoid Over-Engineering

- Don't create complex caching systems for simple data
- Don't add sophisticated debugging tools
- Don't create extensive testing infrastructure
- Don't optimize prematurely for scale
- Don't create complex state management for simple UI state

### ❌ Avoid Breaking SRS Algorithm Logic

- Don't hardcode SRS intervals or ease factors
- Don't let learning cards become due inappropriately
- Don't ignore project-specific algorithm settings
- Don't break the graduation/learning state transitions

### ❌ Avoid Poor User Experience

- Don't show loading states for cached data
- Don't break study session continuity
- Don't lose user progress on page refreshes
- Don't show notifications for deleted projects

## What TO Do

### ✅ Study Experience Priority

```typescript
// Ensure smooth study sessions
export function useStudySession(projectId: string) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [currentCard, setCurrentCard] = useState<StudyCard | null>(null);

  // Preserve session state across navigation
  useEffect(() => {
    const savedSession = localStorage.getItem(`study-session-${projectId}`);
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, [projectId]);

  // Auto-save session progress
  const processResponse = async (response: CardResponse) => {
    if (!currentCard || !session) return;

    // Calculate next SRS state using project settings
    const srsUpdate = calculateNextSRS(
      currentCard.srs_state,
      response,
      session.project.srs_settings
    );

    // Update database and move to next card
    await updateSRSState(currentCard.id, srsUpdate);
    const nextCard = await getNextCard(projectId, session.id);

    setCurrentCard(nextCard);
    localStorage.setItem(
      `study-session-${projectId}`,
      JSON.stringify({
        ...session,
        cardsStudied: session.cardsStudied + 1,
      })
    );
  };
}
```

### ✅ Efficient Data Loading

```typescript
// Smart caching for dashboard
export function useDashboard() {
  const { data: projects, isLoading } = useSWR(
    "dashboard-projects",
    getDashboardData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update cache on mutations
  const createProject = async (data: CreateProjectData) => {
    const newProject = await createProjectAction(data);
    mutate("dashboard-projects"); // Revalidate cache
    return newProject;
  };

  return { projects, isLoading, createProject };
}
```

### ✅ Theme and Settings Management

```typescript
// Load theme immediately
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // Load from localStorage first for immediate application
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    // Then sync with database
    syncThemeFromDatabase();
  }, []);

  const updateTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    await updateUserSettings({ theme: newTheme });
  };

  return { theme, updateTheme };
}
```

### ✅ Project-Specific SRS Settings

```typescript
// Always use project settings for SRS calculations
export function useProjectSRS(projectId: string) {
  const [settings, setSettings] = useState<ProjectSRSSettings | null>(null);

  // Load settings with project
  useEffect(() => {
    loadProjectSettings(projectId).then(setSettings);
  }, [projectId]);

  const updateSRSSettings = async (updates: Partial<ProjectSRSSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await updateProject(projectId, { srs_settings: newSettings });

    // Show warning about changing active settings
    toast.warn("SRS settings changed. This affects future reviews only.");
  };

  const resetToDefaults = async () => {
    const defaults = getDefaultSRSSettings();
    setSettings(defaults);
    await updateProject(projectId, { srs_settings: defaults });
  };

  return { settings, updateSRSSettings, resetToDefaults };
}
```

## Feature Development Guidelines

### New Feature Development

1. **Start with database schema** - Update tables, constraints, and types
2. **Create server actions** - Data operations with proper validation
3. **Build basic UI** - Simple, functional components
4. **Add interactivity** - Client-side state and event handling
5. **Test user flows** - Manual testing of complete workflows
6. **Update notifications** - Ensure proper cleanup and scheduling

### SRS System Modifications

- Always test with different project settings
- Verify learning/graduation state transitions
- Ensure session continuity across page loads
- Test notification scheduling with real due dates
- Validate against Anki behavior for consistency

### Performance Optimization

- Cache dashboard data for quick loading
- Batch database operations during study sessions
- Use local storage for temporary state preservation
- Implement smart revalidation strategies
- Monitor database query performance

## Authentication & Security

### User Management

```typescript
// Handle authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN") {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### Row Level Security

- All tables have RLS policies based on `auth.uid()`
- Server actions automatically enforce user-based access
- No manual user ID validation needed in most queries
- Projects, flashcards, and SRS states are user-isolated

## Testing Strategy

**Manual Testing Priority**:

1. **Authentication flow** - Sign up, login, profile creation
2. **Project lifecycle** - Create, configure, study, delete
3. **Study sessions** - Card responses, state transitions, session continuity
4. **Notifications** - Reminders, cleanup, scheduling
5. **Settings** - Theme changes, SRS configuration, profile updates

**Type Safety**: Let TypeScript catch errors at compile time
**Database Integrity**: Use database constraints and RLS policies
**User Workflow Testing**: Focus on complete user journeys

## Deployment & Maintenance

### Database Management

- Use Supabase migrations for schema changes
- Monitor query performance in Supabase dashboard
- Review RLS policies for security
- Backup before major changes (though zero users currently)

### Performance Monitoring

- Watch for slow database queries
- Monitor client-side bundle size
- Track user session duration and completion rates
- Observe notification delivery and cleanup

---

## Remember: Lightweight & Functional

**Core Principle**: Build features that work well for the current scale, with room to improve when needed. Focus on user experience, code clarity, and maintainability over premature optimization.

When in doubt:

1. **Choose the simpler solution**
2. **Test manually with real user flows**
3. **Keep the SRS algorithm working correctly**
4. **Maintain fast load times and smooth interactions**
5. **Document complex logic for future reference**
