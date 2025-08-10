# Cache Migration Guide

This guide shows how to migrate from the existing hooks to the new cached versions to improve performance and reduce database calls.

## Quick Start

### 1. Add CacheProvider to your app layout

```tsx
// app/layout.tsx or your main layout
import { CacheProvider } from "@/components/CacheProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CacheProvider
          enableAutoLoad={true}
          enableDebugLogs={process.env.NODE_ENV === "development"}
        >
          {children}
        </CacheProvider>
      </body>
    </html>
  );
}
```

### 2. Replace existing hook usage

## Settings Migration

### Before (useSettings)

```tsx
import { useSettingsStore } from "@/hooks/useSettings";

function SettingsPage() {
  const {
    srsSettings,
    userSettings,
    isLoading,
    loadSettings,
    updateSRSSettings,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Component code...
}
```

### After (useCachedSettings)

```tsx
import { useEnhancedSettings } from "@/components/CacheProvider";

function SettingsPage() {
  const { srsSettings, userSettings, isLoading, updateSRSSettings } =
    useEnhancedSettings();

  // No need for manual loading - handled automatically!
  // Component code...
}
```

## User Profile Migration

### Before (useUserProfile)

```tsx
import { useUserProfileStore } from "@/hooks/useUserProfile";

function ProfilePage() {
  const { userProfile, isLoading, fetchUserProfile, updateUserProfile } =
    useUserProfileStore();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Component code...
}
```

### After (useCachedUserProfile)

```tsx
import { useEnhancedUserProfile } from "@/components/CacheProvider";

function ProfilePage() {
  const { userProfile, isLoading, updateUserProfile } =
    useEnhancedUserProfile();

  // Auto-loaded and cached!
  // Component code...
}
```

## Projects Migration

### Before (manual project fetching)

```tsx
import { getProjects } from "@/app/(main)/projects/actions";

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  // Component code...
}
```

### After (useCachedProjects)

```tsx
import { useEnhancedProjects } from "@/components/CacheProvider";

function ProjectsList() {
  const { projects, isLoadingProjects } = useEnhancedProjects();

  // Auto-loaded and cached!
  // Component code...
}
```

## Individual Project Migration

### Before (manual data fetching)

```tsx
import { getProjectById } from "@/app/(main)/projects/actions";
import { getFlashcardsByProjectId } from "@/app/(main)/projects/actions/flashcard-actions";

function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProjectById(params.id),
      getFlashcardsByProjectId(params.id),
    ]).then(([proj, cards]) => {
      setProject(proj);
      setFlashcards(cards);
      setLoading(false);
    });
  }, [params.id]);

  // Component code...
}
```

### After (useEnhancedProject)

```tsx
import { useEnhancedProject } from "@/components/CacheProvider";

function ProjectPage({ params }) {
  const {
    project,
    flashcards,
    srsStates,
    stats,
    isLoadingFlashcards,
    createFlashcard,
    updateProject,
  } = useEnhancedProject(params.id);

  // Everything loaded and cached automatically!
  // Component code...
}
```

## Daily Stats Migration

### Before (manual stats fetching)

```tsx
function Dashboard() {
  const [todayStats, setTodayStats] = useState(null);

  useEffect(() => {
    // Manual database calls
    fetchTodayStats().then(setTodayStats);
  }, []);
}
```

### After (useCachedDailyStats)

```tsx
import { useTodayStats, useWeeklyStats } from "@/hooks/useCachedDailyStats";

function Dashboard() {
  const { stats: todayStats, loading } = useTodayStats();
  const { totalStats: weeklyStats } = useWeeklyStats();

  // Auto-loaded and cached!
}
```

## Cache Management

### Invalidation Patterns

The cache automatically invalidates when data changes:

```tsx
import { CacheInvalidation } from "@/hooks/useCache";

// After updating a project
CacheInvalidation.onProjectUpdate(projectId);

// After creating/updating flashcards
CacheInvalidation.onFlashcardUpdate(projectId);

// After SRS updates
CacheInvalidation.onSRSUpdate(projectId, userId);

// After settings changes
CacheInvalidation.onSettingsUpdate(userId);
```

### Manual Cache Management

```tsx
import { useCacheProvider } from "@/components/CacheProvider";

function AdminPanel() {
  const { refreshAll, clearAll, cacheStats } = useCacheProvider();

  return (
    <div>
      <button onClick={refreshAll}>Refresh All Data</button>
      <button onClick={clearAll}>Clear Cache</button>
      <div>Cache Hit Rate: {(cacheStats.cacheHitRate * 100).toFixed(1)}%</div>
    </div>
  );
}
```

## Benefits of Migration

### 1. **Reduced Database Calls**

- Data is cached with configurable TTL
- Automatic cache invalidation on updates
- Shared cache across components

### 2. **Better Performance**

- LocalStorage persistence
- Instant data availability on reload
- Background refresh capabilities

### 3. **Improved UX**

- Faster page loads
- Reduced loading states
- Seamless navigation

### 4. **Smart Caching**

- Different TTL for different data types
- Version-based cache invalidation
- Memory management with cleanup

## Cache Configuration

Different data types have different cache durations:

```typescript
const CACHE_CONFIGS = {
  projects: { ttl: 5 * 60 * 1000 }, // 5 minutes
  flashcards: { ttl: 10 * 60 * 1000 }, // 10 minutes
  srs_states: { ttl: 2 * 60 * 1000 }, // 2 minutes (more dynamic)
  user_settings: { ttl: 30 * 60 * 1000 }, // 30 minutes
  user_profile: { ttl: 30 * 60 * 1000 }, // 30 minutes
  daily_stats: { ttl: 60 * 60 * 1000 }, // 1 hour
};
```

## Debug Tools

In development, you can see cache performance:

```tsx
import { CacheDebugInfo } from "@/components/CacheProvider";

function App() {
  return (
    <div>
      {/* Your app */}
      <CacheDebugInfo /> {/* Shows cache stats in dev mode */}
    </div>
  );
}
```

## Best Practices

### 1. **Use Enhanced Hooks**

Always prefer the enhanced hooks over direct store usage:

- `useEnhancedSettings()` instead of `useCachedSettingsStore()`
- `useEnhancedProjects()` instead of `useCachedProjectsStore()`

### 2. **Force Refresh When Needed**

```tsx
// Force refresh after critical updates
await settingsStore.loadSettings(true);
await projectsStore.loadProjects(true);
```

### 3. **Handle Cache Misses Gracefully**

```tsx
const { project, isLoadingFlashcards } = useEnhancedProject(projectId);

if (!project) {
  return <ProjectSkeleton />;
}

return (
  <div>
    <ProjectHeader project={project} />
    {isLoadingFlashcards ? <FlashcardsSkeleton /> : <FlashcardsList />}
  </div>
);
```

### 4. **Batch Operations**

```tsx
// Good: Batch related operations
const handleStudySession = async () => {
  await Promise.all([
    updateSRSState(cardId, newState),
    incrementDailyStats(today, { reviews_completed: 1 }),
    updateProjectStats(projectId),
  ]);
};
```

## Migration Checklist

- [ ] Add CacheProvider to app layout
- [ ] Replace useSettingsStore with useEnhancedSettings
- [ ] Replace useUserProfileStore with useEnhancedUserProfile
- [ ] Replace manual project fetching with useEnhancedProjects
- [ ] Replace manual flashcard fetching with useEnhancedProject
- [ ] Update daily stats to use useTodayStats/useWeeklyStats
- [ ] Remove manual useEffect data loading
- [ ] Add cache invalidation to update operations
- [ ] Test cache behavior in development
- [ ] Verify performance improvements

The cache system is designed to be a drop-in replacement that requires minimal code changes while providing significant performance benefits!
