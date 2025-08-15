# GitHub Copilot Instructions for Cognify

## Project Overview

Cognify is an Anki-like spaced repetition learning platform with AI-powered flashcard generation. The project prioritizes **simplicity, maintainability, and solo-developer efficiency** over enterprise-scale complexity.

## Core Development Principles

### 1. **Lightweight Architecture**

- Prefer simple solutions over sophisticated ones
- Avoid over-engineering for future scale
- Choose readable code over clever abstractions
- Minimize dependencies and complexity

### 2. **Solo-Developer Friendly**

- Self-documenting code patterns
- Consistent file organization
- Easy debugging and error tracking
- Clear separation of concerns

### 3. **TypeScript Best Practices**

- Use explicit types over `any`
- Prefer interfaces over complex generic types
- Document complex type relationships
- Keep type definitions simple and clear

## Technology Stack

**Framework**: Next.js 15 (App Router), React 19, TypeScript
**Database**: Supabase (PostgreSQL) with Row Level Security
**Styling**: Tailwind CSS + DaisyUI
**State**: Zustand (minimal global state only)
**Auth**: Supabase Auth with JWT tokens

## Code Patterns to Follow

### File Organization

```
app/(main)/[feature]/
├── page.tsx              # Main page component
├── layout.tsx            # Feature layout
├── actions/              # Server actions
├── [id]/page.tsx         # Dynamic routes
└── components/           # Feature-specific components

src/components/[feature]/
├── [Feature]List.tsx     # List components
├── [Feature]Card.tsx     # Card components
└── [Feature]Form.tsx     # Form components

hooks/
├── use[Feature].ts       # Data management hooks
└── use[Feature]Form.ts   # Form management hooks
```

### Component Patterns

```typescript
// Server Components for initial data
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsList projects={projects} />;
}

// Client Components for interactivity
("use client");
export function ProjectsList({ projects }: { projects: Project[] }) {
  const { createProject } = useProjects();
  // Interactive logic here
}

// Custom hooks for data management
export function useProjects() {
  return {
    createProject: async (data: CreateProjectData) => {
      /* ... */
    },
    updateProject: async (id: string, data: Partial<Project>) => {
      /* ... */
    },
    deleteProject: async (id: string) => {
      /* ... */
    },
  };
}
```

### Database Patterns

```typescript
// Always use Supabase client for database operations
const supabase = await createClient();

// Batch operations when possible
const { data, error } = await supabase.from("table").insert(items);

// Use RLS for security
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", user.id);
```

### Error Handling

```typescript
// Simple, user-friendly error handling
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error("Operation failed:", error);
  throw new Error("User-friendly error message");
}
```

## What NOT to Do

### ❌ Avoid Over-Engineering

- Don't create complex abstractions for simple operations
- Don't add sophisticated caching for data that doesn't need it
- Don't create extensive debugging utilities for production code
- Don't add dependencies unless absolutely necessary

### ❌ Avoid Complex State Management

- Don't use Redux or complex state libraries
- Don't create global state for temporary UI state
- Don't create complex event systems
- Keep component state local when possible

### ❌ Avoid TypeScript Anti-Patterns

```typescript
// DON'T use 'any'
function process(data: any) {}

// DO use proper types
function process(data: ProcessData) {}

// DON'T create overly complex generics
function complexGeneric<T extends Record<K, V>, K extends string, V>() {}

// DO keep types simple and clear
function processProjects(projects: Project[]) {}
```

## What TO Do

### ✅ Prefer Simple Solutions

```typescript
// ✅ Good: Simple, clear data fetching
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ✅ Good: Simple state management
const [projects, setProjects] = useState<Project[]>([]);

// ✅ Good: Clear component structure
function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card">
      <h3>{project.name}</h3>
      <button onClick={() => onEdit(project.id)}>Edit</button>
      <button onClick={() => onDelete(project.id)}>Delete</button>
    </div>
  );
}
```

### ✅ Follow Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase, descriptive names
- **Functions**: camelCase, verb-based names
- **Types**: PascalCase interfaces, descriptive names
- **Database**: snake_case following PostgreSQL conventions

### ✅ Handle Loading and Error States

```typescript
function ProjectsList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <div>{/* content */}</div>;
}
```

## Feature Development Guidelines

### Creating New Features

1. Start with the database schema and types
2. Create server actions for data operations
3. Build basic UI components
4. Add client-side interactivity
5. Test manually with real user flows

### Modifying Existing Features

1. Understand the current data flow
2. Make minimal changes to achieve the goal
3. Update types if data structure changes
4. Test affected user workflows
5. Update documentation if needed

### SRS (Spaced Repetition) Specific

- All SRS state changes should batch to database
- Use database functions for complex SRS calculations
- Keep SRS logic in `/lib/srs/` directory
- Maintain SM-2 algorithm compatibility

### Authentication & Authorization

- Always check user authentication in server actions
- Use RLS policies for data access control
- Store minimal user data in global state
- Handle authentication errors gracefully

## Performance Guidelines

### Database

- Use batch operations for multiple inserts/updates
- Leverage database functions for complex queries
- Add indexes for frequently queried columns
- Monitor query performance in Supabase dashboard

### Frontend

- Use React.memo for expensive components
- Implement lazy loading for large datasets
- Cache API responses appropriately
- Minimize re-renders through proper dependency arrays

### Caching Strategy

- Cache project lists and statistics
- Invalidate cache on data mutations
- Use session storage for temporary data
- Keep cache logic simple and predictable

## Testing Philosophy

**Manual Testing First**: Focus on user workflows rather than unit tests
**Type Safety**: Let TypeScript catch errors at compile time
**Database Constraints**: Use database constraints for data integrity
**Integration Tests**: Simple tests for critical user flows only

## Security Checklist

- [ ] User input is validated and sanitized
- [ ] Database operations use parameterized queries (via Supabase)
- [ ] Authentication is checked in all server actions
- [ ] RLS policies protect user data
- [ ] Sensitive data is not logged or exposed

## When to Refactor

**Refactor When**:

- Code is repeated more than 3 times
- Function is longer than 50 lines
- Component has more than 10 props
- File is longer than 300 lines
- Performance issues are identified

**Don't Refactor When**:

- Code works and is readable
- Change is purely stylistic
- No clear benefit to maintainability
- Refactor would add complexity

---

Remember: **Simplicity is the ultimate sophistication**. When in doubt, choose the simpler solution that's easier to understand and maintain.
