# Cognify API Documentation

This document provides a comprehensive overview of all API endpoints available in the Cognify application.

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [AI & Content Processing APIs](#ai--content-processing-apis)
- [Project Management APIs](#project-management-apis)
- [Flashcard APIs](#flashcard-apis)
- [SRS (Spaced Repetition System) APIs](#srs-spaced-repetition-system-apis)
- [User Management APIs](#user-management-apis)
- [System & Analytics APIs](#system--analytics-apis)

---

## Authentication APIs

### `/api/auth/login`

**Methods:** POST  
**Purpose:** Handle user authentication through various OAuth providers  
**Parameters:**

- `provider`: OAuth provider (e.g., 'google', 'github')
- `redirectUrl`: URL to redirect after successful authentication

**Usage:**

```typescript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "google", redirectUrl: "/dashboard" }),
});
```

### `/api/auth/github`

**Methods:** GET  
**Purpose:** Handle GitHub OAuth authentication callback  
**Parameters:** URL query parameters from GitHub OAuth

---

## AI & Content Processing APIs

### `/api/ai/test-connection`

**Methods:** POST  
**Purpose:** Test AI provider connection and configuration  
**Parameters:**

```typescript
{
  provider: 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'deepseek',
  apiKey?: string,
  model: string,
  baseUrl?: string // For local/custom endpoints
}
```

**Response:**

```typescript
{
  success: boolean,
  message: string,
  modelInfo?: {
    name: string,
    provider: string,
    version?: string
  }
}
```

### `/api/ai/extract-pdf`

**Methods:** POST  
**Purpose:** Extract text content from uploaded PDF files  
**Parameters:** FormData with:

- `file`: PDF file (max 50MB)
- `projectId`: Associated project ID

**Response:**

```typescript
{
  text: string,
  metadata: {
    pages: number,
    wordCount: number,
    fileName: string
  }
}
```

### `/api/ai/generate-flashcards`

**Methods:** POST  
**Purpose:** Generate flashcards from text using AI  
**Parameters:**

```typescript
{
  text: string,
  projectId: string,
  fileName: string,
  config: AIConfiguration,
  options?: {
    maxCards?: number,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    focusAreas?: string[]
  }
}
```

**Response:**

```typescript
{
  flashcards: Array<{
    front: string,
    back: string,
    tags?: string[]
  }>,
  tokensUsed: number,
  processingTime: number
}
```

---

## Project Management APIs

### `/api/projects`

**Methods:** GET, POST

**GET** - Retrieve user's projects  
**Response:**

```typescript
Array<{
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  // SRS settings
  new_cards_per_day: number;
  max_reviews_per_day: number;
  learning_steps: number[];
  // ... other SRS configuration
}>;
```

**POST** - Create new project  
**Parameters:**

```typescript
{
  name: string,
  description?: string,
  // Optional SRS settings (defaults applied if not provided)
  new_cards_per_day?: number,
  max_reviews_per_day?: number,
  learning_steps?: number[],
  // ... other SRS settings
}
```

### `/api/projects/[id]`

**Methods:** GET, PUT, DELETE

**GET** - Get specific project details  
**PUT** - Update project  
**DELETE** - Delete project and all associated data

### `/api/projects/[id]/stats`

**Methods:** GET  
**Purpose:** Get project statistics  
**Response:**

```typescript
{
  totalFlashcards: number,
  dueCards: number,
  newCards: number,
  learningCards: number,
  reviewCards: number,
  masteredCards: number,
  averageEase: number,
  streakDays: number,
  totalStudyTime: number
}
```

### `/api/projects/[id]/daily-stats`

**Methods:** GET  
**Purpose:** Get daily study statistics for a project  
**Response:**

```typescript
Array<{
  date: string;
  new_cards_studied: number;
  reviews_completed: number;
  study_time_minutes: number;
  cards_mastered: number;
}>;
```

---

## Flashcard APIs

### `/api/flashcards`

**Methods:** GET, POST, PUT, DELETE

**GET** - Retrieve flashcards  
**Query Parameters:**

- `projectId`: Filter by project
- `limit`: Number of cards to return
- `offset`: Pagination offset

**POST** - Create flashcards  
**Parameters:**

```typescript
{
  projectId: string,
  flashcards: Array<{
    front: string,
    back: string,
    tags?: string[]
  }>
}
```

**PUT** - Update flashcard  
**DELETE** - Delete flashcard

---

## SRS (Spaced Repetition System) APIs

### `/api/srs/states`

**Methods:** GET, POST  
**Purpose:** Manage SRS card states

**GET** - Get SRS states for cards  
**Query Parameters:**

- `projectId`: Project to filter by
- `cardIds`: Specific card IDs (comma-separated)

**Response:**

```typescript
{
  [cardId: string]: {
    id: string,
    state: 'new' | 'learning' | 'review' | 'relearning',
    interval: number,
    ease: number,
    due: number,
    repetitions: number,
    lapses: number,
    learningStep: number,
    isLeech: boolean,
    isSuspended: boolean
  }
}
```

### `/api/srs/upsert`

**Methods:** POST  
**Purpose:** Update or insert SRS states after study session  
**Parameters:**

```typescript
{
  states: Array<{
    card_id: string;
    project_id: string;
    state: string;
    interval: number;
    ease: number;
    due: string;
    last_reviewed: string;
    repetitions: number;
    lapses: number;
    learning_step: number;
    is_leech: boolean;
    is_suspended: boolean;
  }>;
}
```

### `/api/srs/due-projects`

**Methods:** GET  
**Purpose:** Get projects with due cards for study  
**Response:**

```typescript
Array<{
  project_id: string;
  project_name: string;
  due_count: number;
  new_count: number;
  learning_count: number;
  next_due_time?: string;
}>;
```

---

## User Management APIs

### `/api/user/profile`

**Methods:** GET, PUT  
**Purpose:** Manage user profile data

**GET Response:**

```typescript
{
  id: string,
  username: string,
  display_name?: string,
  bio?: string,
  avatar_url?: string,
  email: string,
  created_at: string,
  onboarding_completed: boolean
}
```

**PUT Parameters:**

```typescript
{
  username?: string,
  display_name?: string,
  bio?: string,
  avatar_url?: string
}
```

### `/api/user/settings`

**Methods:** GET, PUT  
**Purpose:** Manage user preferences and settings

**Response/Parameters:**

```typescript
{
  theme: 'light' | 'dark' | 'system',
  notifications_enabled: boolean,
  daily_reminder: boolean,
  reminder_time?: string, // HH:MM:SS format
  study_goal?: number,
  language?: string,
  timezone?: string
}
```

### `/api/user/avatar`

**Methods:** POST  
**Purpose:** Upload and update user avatar  
**Parameters:** FormData with `avatar` file

### `/api/user/export`

**Methods:** GET  
**Purpose:** Export user data for backup  
**Response:**

```typescript
{
  export_date: string,
  user: UserProfile,
  projects: Project[],
  flashcards: Flashcard[],
  srs_states: SRSCardState[],
  settings: UserSettings
}
```

### `/api/user/import`

**Methods:** POST  
**Purpose:** Import user data from backup  
**Parameters:** JSON file with exported data structure

### `/api/user/reminders`

**Methods:** GET, POST, PUT, DELETE  
**Purpose:** Manage study reminders and notifications

**GET Response:**

```typescript
Array<{
  id: string;
  title: string;
  message: string;
  type: "study_reminder" | "achievement" | "system";
  scheduled_for: string;
  is_active: boolean;
  project_id?: string;
}>;
```

---

## System & Analytics APIs

### `/api/system/analytics`

**Methods:** GET  
**Purpose:** Get system-wide analytics (admin only)  
**Response:**

```typescript
{
  total_users: number,
  active_users: number,
  total_projects: number,
  total_flashcards: number,
  total_study_sessions: number,
  ai_requests_today: number,
  system_health: {
    database: 'healthy' | 'warning' | 'error',
    ai_services: 'healthy' | 'warning' | 'error',
    storage: 'healthy' | 'warning' | 'error'
  }
}
```

### `/api/system/errors`

**Methods:** POST  
**Purpose:** Log client-side errors for monitoring  
**Parameters:**

```typescript
{
  error: string,
  stack?: string,
  url: string,
  user_agent: string,
  user_id?: string,
  additional_data?: any
}
```

---

## Authentication & Error Handling

### Authentication

Most API endpoints require authentication via Supabase. Include the user's session token in requests:

```typescript
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();

fetch("/api/endpoint", {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  },
});
```

### Common Error Responses

```typescript
{
  error: string,
  details?: string,
  code?: string
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **AI endpoints:** 100 requests per hour per user
- **File upload:** 10 requests per minute per user
- **General APIs:** 1000 requests per hour per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
```

---

## Examples

### Complete Study Flow

```typescript
// 1. Get due projects
const dueProjects = await fetch("/api/srs/due-projects").then((r) => r.json());

// 2. Get flashcards for study
const flashcards = await fetch(
  `/api/flashcards?projectId=${projectId}&due=true`
).then((r) => r.json());

// 3. Get current SRS states
const srsStates = await fetch(
  `/api/srs/states?projectId=${projectId}&cardIds=${cardIds.join(",")}`
).then((r) => r.json());

// 4. After study session, update SRS states
await fetch("/api/srs/upsert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ states: updatedStates }),
});
```

### AI Flashcard Generation

```typescript
// 1. Test AI configuration
const testResult = await fetch("/api/ai/test-connection", {
  method: "POST",
  body: JSON.stringify({
    provider: "openai",
    apiKey: "sk-...",
    model: "gpt-3.5-turbo",
  }),
});

// 2. Extract text from PDF
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("projectId", projectId);

const extractResult = await fetch("/api/ai/extract-pdf", {
  method: "POST",
  body: formData,
});

// 3. Generate flashcards
const generateResult = await fetch("/api/ai/generate-flashcards", {
  method: "POST",
  body: JSON.stringify({
    text: extractedText,
    projectId,
    fileName: "document.pdf",
    config: aiConfig,
  }),
});
```

---

This documentation covers all major API endpoints in the Cognify application. For implementation details, refer to the specific route files in `/app/api/`.
