# Cognify Development Standards Implementation

This implementation provides comprehensive development guidelines and enforcement mechanisms for Cognify, an AI-powered flashcard application with sophisticated SRS (Spaced Repetition System).

## 🎯 Overview

The development standards ensure:
- **Quality over speed** with flawless functionality
- **Cache-first data access** to prevent performance issues  
- **Batch API operations** to eliminate N+1 queries
- **Strict TypeScript** with zero `any` types
- **Comprehensive error handling** with graceful degradation
- **Line-by-line verification** for bug prevention

## 🏗️ Architecture Components

### 1. Cache-First Data Access (`hooks/useCache.ts`)

Multi-layer caching system with TTL, versioning, and automatic cleanup:

```typescript
import { cachedFetch, CacheInvalidation } from '@/hooks/useCache';

// Cache-first data fetching
const projects = await cachedFetch(
  'user_projects',
  async () => supabase.from('projects').select('*'),
  { ttl: 5 * 60 * 1000 } // 5 minute cache
);

// Cache invalidation
CacheInvalidation.invalidatePattern('projects');
```

**Features:**
- TTL-based cache expiration
- Version-based cache invalidation
- Automatic cleanup every 5 minutes
- Development debugging utilities
- Global cache accessible via `window.cognifyCache`

### 2. Batch API Operations (`lib/utils/batchAPI.ts`)

Prevents N+1 queries by consolidating multiple requests:

```typescript
import { BatchAPI } from '@/lib/utils/batchAPI';

// Batched project statistics (instead of N individual calls)
const stats = await BatchAPI.getProjectStats(projectId, userId);

// Batched flashcard creation
const flashcard = await BatchAPI.createFlashcard({
  front: "Question",
  back: "Answer", 
  projectId: "uuid"
});
```

**Features:**
- Automatic request batching with configurable delays
- Deduplication of identical requests
- Batch size limits with automatic splitting
- Error handling with partial success support

### 3. Comprehensive Error Handling (`lib/utils/errorHandling.ts`)

Standardized error handling with schema validation:

```typescript
import { ErrorHandling, Validators, ValidationError } from '@/lib/utils/errorHandling';

// Schema validation
const validation = Validators.project(projectData);
if (!validation.isValid) {
  throw validation.errors[0];
}

// Async error wrapping
const safeCreateProject = ErrorHandling.wrapAsync(
  createProject, 
  'createProject'
);

// Graceful degradation
const result = await ErrorHandling.withFallback(
  () => risky function(),
  fallbackValue,
  'Operation failed, using fallback'
);
```

**Features:**
- Typed error classes for different error types
- Schema validation against database constraints
- Graceful degradation utilities
- Retry mechanisms with exponential backoff

### 4. Strict TypeScript Types (`lib/types/index.ts`)

Zero `any` types with branded types and comprehensive interfaces:

```typescript
import { ProjectId, UserId, TypeGuards, createProjectId } from '@/lib/types';

// Branded types for type safety
const projectId: ProjectId = createProjectId(uuid);
const userId: UserId = createUserId(user.id);

// Type guards
if (TypeGuards.isProjectRow(data)) {
  // TypeScript knows data is ProjectRow
  console.log(data.name);
}
```

**Features:**
- Branded types for IDs and special values
- Strict database schema types
- Type guards and validation utilities
- Comprehensive interfaces for all data shapes

### 5. Development Utilities (`lib/utils/devUtils.ts`)

Performance monitoring and debugging tools:

```typescript
import { useRenderMonitor, logger, PerfUtils } from '@/lib/utils/devUtils';

// Component render monitoring
function MyComponent() {
  useRenderMonitor('MyComponent');
  // Component logic
}

// Performance measurement
const result = await PerfUtils.measure('API Call', async () => {
  return await apiCall();
});

// Debug logging
logger.info('Operation completed successfully');
```

**Features:**
- React render monitoring
- API call tracking and analysis
- Memory usage monitoring
- Debug logging with levels
- Performance measurement utilities

### 6. Development Standards Enforcement (`lib/utils/devStandards.ts`)

Runtime enforcement of development guidelines:

```typescript
import { DevStandards } from '@/lib/utils/devStandards';

// Pre-development analysis
const checklist = DevStandards.analyzeBeforeCoding();

// Quality gates validation
const gates = DevStandards.validateQualityGates();

// Line-by-line verification
DevStandards.verifyLineByLine(code, 'API integration');
```

**Features:**
- Pre-development analysis checklist
- Quality gates validation
- Runtime violation detection
- Performance monitoring integration

## 🚀 Development Workflow

### 1. Pre-Development Analysis (MANDATORY)

Before writing ANY code, verify:

```typescript
const checklist = DevStandards.analyzeBeforeCoding();
// ✅ Schema Compliance
// ✅ Cache Impact
// ✅ Performance Considerations  
// ✅ Authentication Handling
// ✅ Error Boundaries
// ✅ Dependency Analysis
```

### 2. Implementation Standards

**Cache-First Data Access:**
```typescript
// ✅ Good - Cache-first approach
const data = await cachedFetch('key', fetcher, { ttl: 300000 });

// ❌ Bad - Direct database call
const data = await supabase.from('table').select('*');
```

**Batch Operations:**
```typescript
// ✅ Good - Batch API usage
const stats = await BatchAPI.getProjectStats(projectId, userId);

// ❌ Bad - Individual API calls in loop
for (const project of projects) {
  const stats = await getProjectStats(project.id); // N+1 query
}
```

**Strict TypeScript:**
```typescript
// ✅ Good - Proper interfaces
interface ProjectData {
  name: string;
  description?: string;
}

// ❌ Bad - Any types
function processData(data: any) { // Violation!
  return data.something;
}
```

**Error Handling:**
```typescript
// ✅ Good - Comprehensive error handling
const result = await ErrorHandling.wrapAsync(async () => {
  const validation = Validators.project(data);
  if (!validation.isValid) throw validation.errors[0];
  
  return await createProject(data);
}, 'createProject')();

// ❌ Bad - No error handling
const result = await createProject(data); // Can crash
```

### 3. Quality Gates (MUST PASS)

```typescript
const gates = DevStandards.validateQualityGates();
// ✅ Build Success
// ✅ Zero TypeScript Errors
// ✅ Zero Lint Warnings
// ✅ No Console Errors
// ✅ Network Efficiency
// ✅ Cache Utilization
```

## 🔧 Development Tools

### Global Development Utilities

In development mode, access tools via browser console:

```javascript
// Cache management
window.cognifyCache.stats(); // View cache statistics
window.cognifyCache.utils.clear(); // Clear cache

// Batch API monitoring  
window.cognifyBatch.stats(); // View batch queue status

// Performance tracking
window.cognifyDev.getPerformanceSummary(); // Performance metrics

// Error tracking
window.cognifyErrors.Validators.project(data); // Validate data

// Development standards
window.cognifyStandards.analyzeBeforeCoding(); // Run analysis
```

### Performance Monitoring

```typescript
// Component performance tracking
function MyComponent() {
  const renderCount = useRenderMonitor('MyComponent');
  
  useEffect(() => {
    if (renderCount > 10) {
      logger.warn('Component re-rendering excessively');
    }
  }, [renderCount]);
}

// API performance tracking
const metrics = usePerformanceMonitor();
console.log(`API calls: ${metrics.totalAPIcalls}, Slow: ${metrics.slowAPICalls}`);
```

## 📋 Common Patterns

### 1. Creating New Components

```typescript
import React from 'react';
import { useRenderMonitor } from '@/lib/utils/devUtils';
import { WithClassName, WithChildren } from '@/lib/types';

interface MyComponentProps extends WithClassName, WithChildren {
  title: string;
  onAction: (id: string) => Promise<void>;
}

export function MyComponent({ title, children, className, onAction }: MyComponentProps) {
  useRenderMonitor('MyComponent');
  
  const handleAction = useCallback(async (id: string) => {
    try {
      await onAction(id);
    } catch (error) {
      logger.error('Action failed:', error);
      // Handle error appropriately
    }
  }, [onAction]);
  
  return (
    <div className={className}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### 2. Creating API Functions

```typescript
import { cachedFetch, CacheInvalidation } from '@/hooks/useCache';
import { ErrorHandling, Validators } from '@/lib/utils/errorHandling';
import { logger } from '@/lib/utils/devUtils';

export const projectApi = {
  async loadProjects(): Promise<Project[]> {
    return await cachedFetch(
      'user_projects',
      async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        return data || [];
      },
      { ttl: 5 * 60 * 1000 }
    );
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    return await ErrorHandling.wrapAsync(async () => {
      const validation = Validators.project(data);
      if (!validation.isValid) {
        throw validation.errors[0];
      }

      const supabase = createClient();
      const { data: project, error } = await supabase
        .from("projects")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      CacheInvalidation.invalidatePattern('user_projects');
      logger.info(`Created project: ${project.name}`);
      
      return project;
    }, 'createProject')();
  }
};
```

### 3. Using Zustand Stores

```typescript
import { create } from 'zustand';
import { useCallback } from 'react';
import { useRenderMonitor } from '@/lib/utils/devUtils';

interface StoreState {
  data: DataType[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadData: () => Promise<void>;
  addItem: (item: DataType) => void;
  updateItem: (id: string, updates: Partial<DataType>) => void;
}

const useStore = create<StoreState>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  loadData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await cachedFetch('data_key', fetcherFunction);
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  addItem: (item) => set(state => ({ 
    data: [...state.data, item] 
  })),
  
  updateItem: (id, updates) => set(state => ({
    data: state.data.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
}));

// Component usage
export function MyComponent() {
  useRenderMonitor('MyComponent');
  
  const { data, loading, error, loadData, addItem } = useStore();
  
  const handleAdd = useCallback(async (newData: CreateDataType) => {
    try {
      const item = await api.createItem(newData);
      addItem(item);
    } catch (error) {
      logger.error('Failed to add item:', error);
    }
  }, [addItem]);
  
  // Component logic
}
```

## 🔍 Debugging and Monitoring

### Cache Debugging

```javascript
// View cache contents
window.cognifyCache.stats();

// Check specific cache entry
window.cognifyCache.store.getState().get('user_projects');

// Clear cache for testing
window.cognifyCache.utils.clear();
```

### Performance Debugging

```javascript
// View performance summary
window.cognifyDev.getPerformanceSummary();

// View detailed metrics
window.cognifyDev.getDetailedMetrics();

// Clear performance data
window.cognifyDev.clearMetrics();
```

### Development Standards Monitoring

```javascript
// Check current violations
window.cognifyStandards.enforcer.getViolations();

// Get quality score
window.cognifyStandards.enforcer.getQualityScore();

// Run full analysis
window.cognifyStandards.analyzeBeforeCoding();
```

## ⚠️ Common Anti-Patterns to Avoid

### 1. Cache Bypass
```typescript
// ❌ Don't do this
const data = await supabase.from('table').select('*');

// ✅ Do this instead
const data = await cachedFetch('table_data', 
  () => supabase.from('table').select('*')
);
```

### 2. N+1 Queries
```typescript
// ❌ Don't do this
for (const project of projects) {
  const stats = await getStats(project.id);
}

// ✅ Do this instead
const allStats = await BatchAPI.getProjectStats(projectIds, userId);
```

### 3. Any Types
```typescript
// ❌ Don't do this
function process(data: any) {
  return data.something;
}

// ✅ Do this instead
interface ProcessData {
  something: string;
}
function process(data: ProcessData) {
  return data.something;
}
```

### 4. Missing Error Handling
```typescript
// ❌ Don't do this
const result = await riskyOperation();

// ✅ Do this instead
const result = await ErrorHandling.wrapAsync(
  riskyOperation,
  'riskyOperation'
)();
```

## 🎯 Quality Standards Checklist

Before any code submission, ensure:

- [ ] **TypeScript compiles** with zero errors (`npx tsc --noEmit`)
- [ ] **Linting passes** with zero warnings (`pnpm lint`)
- [ ] **Cache-first approach** used for all data access
- [ ] **Batch operations** used where applicable
- [ ] **Error handling** implemented comprehensively
- [ ] **Type safety** maintained with no `any` types
- [ ] **Performance monitoring** integrated
- [ ] **Line-by-line verification** completed
- [ ] **Quality gates** validated
- [ ] **No console errors** in browser

## 🔧 Extending the System

### Adding New Validation Rules

```typescript
// In lib/utils/errorHandling.ts
const newValidationSchema: ValidationRule[] = [
  {
    field: 'customField',
    required: true,
    type: 'string',
    custom: (value) => {
      // Custom validation logic
      return value.includes('required_prefix');
    }
  }
];

export const Validators = {
  // ... existing validators
  customData: (data: unknown) => validateData(data as Record<string, unknown>, newValidationSchema),
};
```

### Adding New Cache Patterns

```typescript
// Custom cache pattern
const customCachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
) => {
  // Add custom caching logic
  return await cachedFetch(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};
```

### Adding New Batch Operations

```typescript
// In lib/utils/batchAPI.ts
const newBatchProcessor: BatchProcessor<NewInput, NewOutput> = async (inputs) => {
  // Implement batch logic
  const response = await fetch('/api/new-batch-endpoint', {
    method: 'POST',
    body: JSON.stringify({ items: inputs })
  });
  
  return await response.json();
};

const newBatchManager = new BatchManager(newBatchProcessor, {
  maxBatchSize: 50,
  debounceMs: 100,
});
```

This implementation provides a comprehensive foundation for maintaining high-quality, performant code that follows the strictest development standards while ensuring optimal user experience and system reliability.