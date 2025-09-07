# Cognify Utilities Documentation

This document provides comprehensive documentation for all utility functions and modules in the Cognify application located in `/lib/utils/`.

## Table of Contents

- [Core Utilities](#core-utilities)
- [Security & Validation](#security--validation)
- [Study & SRS Utilities](#study--srs-utilities)
- [UI & Theme Utilities](#ui--theme-utilities)
- [Development & Admin Utilities](#development--admin-utilities)
- [Performance & Optimization](#performance--optimization)

---

## Core Utilities

### `formatDate.ts`

**Purpose:** Date formatting and manipulation utilities for consistent date display across the application.

**Key Functions:**

```typescript
// Format date for display
formatRelativeDate(date: Date | string): string
formatStudyDate(date: Date): string
formatDueTime(dueTimestamp: number): string

// Date calculations
getDaysUntilDue(dueDate: Date): number
getStudyStreak(studyDates: Date[]): number
```

**Usage Example:**

```typescript
import { formatRelativeDate, getDaysUntilDue } from "@/lib/utils/formatDate";

const displayDate = formatRelativeDate(flashcard.due_date);
const daysLeft = getDaysUntilDue(new Date(flashcard.due_date));
```

### `validation.ts`

**Purpose:** Data validation utilities using Zod schemas for type-safe validation.

**Key Schemas:**

```typescript
// User input validation
const UsernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/);
const EmailSchema = z.string().email();
const ProjectNameSchema = z.string().min(1).max(100);

// Flashcard validation
const FlashcardSchema = z.object({
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
  tags: z.array(z.string()).optional(),
});

// SRS validation
const SRSRatingSchema = z.number().min(0).max(3);
```

**Usage Example:**

```typescript
import { FlashcardSchema, validateFlashcard } from "@/lib/utils/validation";

const result = validateFlashcard(userInput);
if (result.success) {
  // Valid flashcard data
  const flashcard = result.data;
} else {
  // Handle validation errors
  console.error(result.error.issues);
}
```

### `normalizeProject.ts`

**Purpose:** Project data normalization and transformation utilities.

**Key Functions:**

```typescript
// Normalize project data from different sources
normalizeProject(rawProject: any): Project
normalizeProjectSettings(settings: any): SRSSettings
mergeSRSSettings(user: SRSSettings, project: SRSSettings): SRSSettings

// Project statistics calculations
calculateProjectStats(project: Project, flashcards: Flashcard[]): ProjectStats
```

---

## Security & Validation

### `security.ts`

**Purpose:** Core security utilities for input sanitization and authentication.

**Key Functions:**

```typescript
// Input sanitization
sanitizeHtml(input: string): string
sanitizeUserInput(input: string): string
escapeRegexSpecialChars(str: string): string

// Authentication helpers
isAuthenticated(request: Request): boolean
getUserFromRequest(request: Request): Promise<User | null>
requireAuth(request: Request): Promise<User>

// Permission checks
canAccessProject(user: User, projectId: string): Promise<boolean>
canModifyFlashcard(user: User, flashcardId: string): Promise<boolean>
```

**Usage Example:**

```typescript
import { sanitizeUserInput, requireAuth } from "@/lib/utils/security";

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const { content } = await request.json();
  const safeContent = sanitizeUserInput(content);
  // Process safe content...
}
```

### `inputValidation.ts`

**Purpose:** Advanced input validation and data cleaning for user-submitted content.

**Key Functions:**

```typescript
// Content validation
validateFlashcardContent(front: string, back: string): ValidationResult
validateProjectName(name: string): ValidationResult
validateFileUpload(file: File, allowedTypes: string[]): ValidationResult

// Data cleaning
cleanTextContent(text: string): string
removeExcessiveWhitespace(text: string): string
normalizeLineEndings(text: string): string
```

### `apiSecurity.ts`

**Purpose:** API-specific security measures including rate limiting and request validation.

**Key Functions:**

```typescript
// Request validation
validateApiRequest(request: Request, schema: z.ZodSchema): Promise<ValidationResult>
checkRateLimit(userId: string, endpoint: string): Promise<boolean>
logSecurityEvent(event: SecurityEvent): Promise<void>

// API key management (for AI providers)
validateApiKey(provider: string, key: string): boolean
maskApiKey(key: string): string
```

### `securityAudit.ts`

**Purpose:** Security auditing and monitoring utilities for compliance and threat detection.

**Key Functions:**

```typescript
// Audit logging
logUserAction(userId: string, action: string, details: any): Promise<void>
logDataAccess(userId: string, resource: string, method: string): Promise<void>

// Security monitoring
detectSuspiciousActivity(userId: string): Promise<SecurityAlert[]>
checkDataIntegrity(tableName: string): Promise<IntegrityReport>
```

---

## Study & SRS Utilities

### `studyReminders.ts`

**Purpose:** Study reminder and notification management utilities.

**Key Functions:**

```typescript
// Reminder scheduling
scheduleStudyReminder(userId: string, projectId: string, time: string): Promise<void>
cancelStudyReminder(reminderId: string): Promise<void>
getActiveReminders(userId: string): Promise<StudyReminder[]>

// Notification management
sendStudyNotification(userId: string, message: string): Promise<void>
scheduleDailyReminders(projects: Project[], userSettings: UserSettings): Promise<void>
clearExpiredReminders(): Promise<void>
```

**Usage Example:**

```typescript
import {
  scheduleStudyReminder,
  sendStudyNotification,
} from "@/lib/utils/studyReminders";

// Schedule a daily reminder
await scheduleStudyReminder(userId, projectId, "09:00");

// Send immediate notification
await sendStudyNotification(userId, "You have 5 cards due for review!");
```

### `scheduleSRSReminderClient.ts`

**Purpose:** Client-side reminder scheduling using browser APIs.

**Key Functions:**

```typescript
// Browser notifications
requestNotificationPermission(): Promise<NotificationPermission>
scheduleNotification(title: string, body: string, scheduledTime: Date): void
showInstantNotification(title: string, body: string): void

// Local storage management
saveReminderPreferences(preferences: ReminderPreferences): void
loadReminderPreferences(): ReminderPreferences | null
```

---

## UI & Theme Utilities

### `theme.ts`

**Purpose:** Theme management and CSS utility functions.

**Key Functions:**

```typescript
// Theme management
getSystemTheme(): 'light' | 'dark'
applyTheme(theme: 'light' | 'dark' | 'system'): void
watchSystemTheme(callback: (theme: string) => void): () => void

// CSS utilities
generateThemeColors(baseColor: string): ThemeColorPalette
createGradientClass(from: string, to: string): string
```

**Usage Example:**

```typescript
import { applyTheme, getSystemTheme } from "@/lib/utils/theme";

// Apply user's preferred theme
const userTheme = getUserTheme();
if (userTheme === "system") {
  applyTheme(getSystemTheme());
} else {
  applyTheme(userTheme);
}
```

### `tabs.ts`

**Purpose:** Tab navigation and state management utilities.

**Key Functions:**

```typescript
// Tab management
createTabState(initialTab: string): TabState
switchTab(state: TabState, newTab: string): TabState
getActiveTab(state: TabState): string

// URL synchronization
syncTabWithUrl(tabState: TabState): void
getTabFromUrl(): string | null
```

### `errorBoundaries.tsx`

**Purpose:** React error boundary components for graceful error handling.

**Components:**

```typescript
// Global error boundary
<AppErrorBoundary fallback={<ErrorFallback />}>
  <App />
</AppErrorBoundary>

// Feature-specific error boundaries
<StudySessionErrorBoundary>
  <StudySession />
</StudySessionErrorBoundary>

<ProjectErrorBoundary>
  <ProjectList />
</ProjectErrorBoundary>
```

---

## Development & Admin Utilities

### `admin.ts`

**Purpose:** Administrative utilities for user and system management.

**Key Functions:**

```typescript
// User management
getAllUsers(filters?: UserFilters): Promise<User[]>
getUserStats(userId: string): Promise<UserStatistics>
suspendUser(userId: string, reason: string): Promise<void>

// System management
getSystemHealth(): Promise<SystemHealth>
performDatabaseMaintenance(): Promise<MaintenanceReport>
clearSystemCache(): Promise<void>
```

### `devUtils.ts`

**Purpose:** Development and debugging utilities (development mode only).

**Key Functions:**

```typescript
// Development logging
debugLog(message: string, data?: any): void
profileFunction<T>(fn: () => T, name: string): T
measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T, time: number }>

// Testing utilities
generateMockFlashcard(): Flashcard
createTestProject(overrides?: Partial<Project>): Project
mockSRSState(cardId: string): SRSCardState
```

**Note:** These utilities are only available in development mode and are automatically stripped from production builds.

### `analytics.ts`

**Purpose:** Analytics and tracking utilities for user behavior and system metrics.

**Key Functions:**

```typescript
// Event tracking
trackUserAction(action: string, properties?: any): void
trackStudySession(projectId: string, duration: number, cardsStudied: number): void
trackFlashcardGeneration(method: string, count: number, processingTime: number): void

// Performance monitoring
measurePageLoad(pageName: string): void
trackAPICall(endpoint: string, duration: number, success: boolean): void
```

---

## Performance & Optimization

### `assetOptimization.ts`

**Purpose:** Asset loading and optimization utilities.

**Key Functions:**

```typescript
// Image optimization
optimizeImageUrl(url: string, width: number, height: number): string
preloadCriticalImages(urls: string[]): Promise<void>
lazyLoadImage(element: HTMLImageElement): void

// Resource management
prefetchRoute(route: string): void
preloadComponent(componentLoader: () => Promise<any>): void
```

### `databaseOptimization.ts`

**Purpose:** Database query optimization and caching strategies.

**Key Functions:**

```typescript
// Query optimization
buildOptimizedQuery(table: string, filters: QueryFilters): string
batchInsertFlashcards(flashcards: Flashcard[]): Promise<void>
optimizeSRSStateQueries(cardIds: string[]): Promise<SRSCardState[]>

// Caching
cacheQueryResult(key: string, result: any, ttl: number): void
getCachedResult(key: string): any | null
invalidateCachePattern(pattern: string): void
```

### `codeSplitting.tsx`

**Purpose:** Dynamic imports and code splitting utilities for performance optimization.

**Key Functions:**

```typescript
// Dynamic component loading
const LazyStudySession = lazy(() => import("@/components/study/StudySession"));
const LazyProjectEditor = lazy(
  () => import("@/components/projects/ProjectEditor")
);

// Route-based splitting
const DynamicRoute = dynamic(() => import("@/app/study/page"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

### `rateLimit.ts`

**Purpose:** Rate limiting implementation for API endpoints and user actions.

**Key Functions:**

```typescript
// Rate limiting
createRateLimiter(requests: number, windowMs: number): RateLimiter
checkRateLimit(key: string, limiter: RateLimiter): Promise<RateLimitResult>
getRemainingRequests(key: string): Promise<number>

// Specific limiters
const aiRateLimiter = createRateLimiter(100, 60 * 60 * 1000); // 100/hour
const uploadRateLimiter = createRateLimiter(10, 60 * 1000); // 10/minute
```

---

## Error Handling Utilities

### `errorHandling.ts`

**Purpose:** Centralized error handling and logging utilities.

**Key Functions:**

```typescript
// Error processing
handleApiError(error: any): ApiErrorResponse
logError(error: Error, context?: ErrorContext): void
createUserFriendlyError(error: Error): string

// Error reporting
reportErrorToService(error: Error, user?: User): Promise<void>
aggregateErrors(errors: Error[]): ErrorSummary
```

**Usage Example:**

```typescript
import { handleApiError, logError } from "@/lib/utils/errorHandling";

try {
  // API call
} catch (error) {
  logError(error, { userId, endpoint: "/api/flashcards" });
  return handleApiError(error);
}
```

### `env-config.ts`

**Purpose:** Environment configuration and validation utilities.

**Key Functions:**

```typescript
// Environment validation
validateEnvironmentConfig(): EnvironmentValidation
getRequiredEnvVar(name: string): string
getOptionalEnvVar(name: string, defaultValue?: string): string | undefined

// Feature flags
isFeatureEnabled(feature: string): boolean
getFeatureConfig(feature: string): any
```

### `useProjectForm.ts`

**Purpose:** Custom React hook for project form management and validation.

**Hook Usage:**

```typescript
import { useProjectForm } from "@/lib/utils/useProjectForm";

function ProjectCreator() {
  const {
    formData,
    errors,
    isValid,
    updateField,
    validateForm,
    resetForm,
    submitForm,
  } = useProjectForm({
    initialData: {},
    onSubmit: async (data) => {
      // Handle form submission
    },
  });

  return <form onSubmit={submitForm}>{/* Form fields */}</form>;
}
```

---

## Usage Guidelines

### Import Patterns

```typescript
// Import specific functions
import { sanitizeUserInput, requireAuth } from "@/lib/utils/security";

// Import with alias for clarity
import { formatRelativeDate as formatDate } from "@/lib/utils/formatDate";

// Import types
import type { ValidationResult, SecurityEvent } from "@/lib/utils/types";
```

### Error Handling

Always handle errors gracefully when using utility functions:

```typescript
import { validateFlashcard } from "@/lib/utils/validation";

try {
  const result = validateFlashcard(data);
  if (!result.success) {
    // Handle validation errors
    console.error("Validation failed:", result.errors);
    return;
  }
  // Process valid data
} catch (error) {
  // Handle unexpected errors
  console.error("Unexpected error:", error);
}
```

### Performance Considerations

- Use lazy loading for heavy utilities in client components
- Cache results of expensive operations
- Prefer streaming for large data processing
- Use memoization for frequently called functions

### Security Best Practices

- Always sanitize user input before processing
- Validate all data at boundaries (API endpoints, form submissions)
- Use type-safe validation with Zod schemas
- Log security events for audit trails

---

This documentation covers all major utility modules in the Cognify application. For implementation details, refer to the specific files in `/lib/utils/`.
