# New Card Bug Fix - Test Suite

This directory contains comprehensive tests and diagnostic tools for the "newly created flashcards don't appear as new cards in study queue" bug.

## Bug Summary

**Root Cause**: Flashcard creation succeeded but SRS state creation silently failed, leaving orphaned flashcards that were invisible to the study system.

**Location**: `app/(main)/projects/actions/flashcard-actions.ts` - Error handling that ignored SRS state creation failures.

## Test Files

### `validate-fix.ts` ⭐ **Start Here**
Quick validation that all fixes are properly implemented.
```bash
npm exec tsx tests/debug/validate-fix.ts
```

### `new-card-bug-test.ts`
Comprehensive end-to-end test simulating the complete flashcard creation and study flow.
- Creates test project and flashcards
- Verifies database integrity
- Tests study logic
- **Note**: Requires Next.js server context

### `reproduce-new-card-bug.ts`
Reproduces the exact user workflow that exposes the bug.
- Simulates user creating flashcards
- Simulates navigating to study page
- Checks if cards appear in study queue

### `test-cache-interference.ts`
Tests for caching-related issues that might interfere with real-time updates.
- Tests rapid flashcard creation
- Verifies cache invalidation
- Checks race conditions

### `database-diagnostic.ts`
Direct database-level diagnostic tool.
- Checks for orphaned flashcards
- Validates SRS state configuration
- Analyzes recent flashcard creation
- **Note**: Requires Supabase credentials

## Fix Implementation

### Database Migration: `migrations/001_fix_missing_srs_states.sql`

1. **Immediate Fix**: Creates missing SRS states for existing orphaned flashcards
2. **Prevention**: Adds database trigger to automatically create SRS states
3. **Atomic Function**: Provides transactional flashcard + SRS state creation

**To Apply:**
```sql
-- Run this migration in your Supabase SQL editor
-- File: migrations/001_fix_missing_srs_states.sql
```

### Application Fix: `flashcard-actions.ts`

1. **Verification**: Checks that SRS states were created after flashcard insertion
2. **Rollback**: Deletes flashcards if SRS state creation fails
3. **Error Handling**: Eliminates silent failures that caused the bug

## Manual Testing Steps

### Pre-Migration Test (to confirm bug exists)
1. Create a project
2. Add flashcards via editor or API
3. Check database for orphaned flashcards:
   ```sql
   SELECT f.id, f.front 
   FROM flashcards f 
   LEFT JOIN srs_states s ON s.card_id = f.id 
   WHERE s.card_id IS NULL;
   ```
4. Navigate to study page - orphaned cards won't appear

### Post-Migration Test (to confirm fix works)
1. Apply the migration
2. Create new flashcards
3. Verify no orphaned flashcards exist (query above returns 0 rows)
4. Navigate to study page - all cards should appear immediately

### End-to-End Validation
1. Create a fresh project
2. Add multiple flashcards via different methods:
   - Individual card creation
   - Batch card creation via editor
   - API batch insertion
3. Navigate to study page immediately
4. Verify all cards appear as "new" and are available for study
5. Study a few cards to verify SRS progression works

## Database Queries for Manual Verification

### Check for Orphaned Flashcards
```sql
SELECT 
  f.id as flashcard_id,
  f.front,
  f.created_at,
  p.name as project_name
FROM flashcards f
INNER JOIN projects p ON f.project_id = p.id
LEFT JOIN srs_states s ON s.card_id = f.id
WHERE s.card_id IS NULL
ORDER BY f.created_at DESC;
```

### Verify New Card Configuration
```sql
SELECT 
  s.card_id,
  s.state,
  s.due,
  s.interval,
  s.ease,
  (s.due <= NOW()) as is_available_now
FROM srs_states s
WHERE s.state = 'new'
ORDER BY s.due;
```

### Check Recent Flashcard Creation
```sql
SELECT 
  f.id,
  f.front,
  f.created_at,
  s.state,
  s.due,
  (s.due <= NOW()) as available_for_study
FROM flashcards f
LEFT JOIN srs_states s ON s.card_id = f.id
WHERE f.created_at >= NOW() - INTERVAL '1 day'
ORDER BY f.created_at DESC;
```

## Expected Behavior After Fix

1. **Immediate Availability**: All newly created flashcards appear immediately in study queue
2. **No Orphans**: Every flashcard has a corresponding SRS state
3. **Consistent Creation**: All creation methods (single, batch, API) work reliably
4. **Error Handling**: Failed SRS state creation causes entire operation to fail (no partial success)
5. **Database Integrity**: Trigger ensures consistency even if application logic fails

## Troubleshooting

### If Cards Still Don't Appear
1. Check browser console for JavaScript errors
2. Verify migration was applied successfully
3. Check for RLS (Row Level Security) policy issues
4. Verify user authentication context
5. Check cache invalidation in development tools

### If Performance Issues
1. Monitor database trigger performance
2. Check if batch operations are overwhelming the trigger
3. Consider implementing application-level batching for large imports

### If Migration Fails
1. Check for foreign key constraint violations
2. Verify all referenced projects exist
3. Ensure no circular dependencies in the trigger
4. Test migration on a copy of the database first