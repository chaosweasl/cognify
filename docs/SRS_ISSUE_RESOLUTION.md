# SRS System Issue Resolution Documentation

## Overview

This document details the comprehensive analysis and resolution of critical issues in the Cognify SRS (Spaced Repetition System) that were preventing users from studying flashcards and causing confusing UI states.

## Issues Identified

### 1. **Primary Issue: Incorrect batch-stats API Logic**

#### Problem
The `/api/projects/batch-stats` endpoint was excluding new cards from the due cards count:

```typescript
// INCORRECT (before fix)
const dueCardsCount = projectSrsStates.filter(s => s.due <= now && s.state !== "new").length;
```

This caused:
- Users to see "6 review cards" in project stats
- But "no flashcards available" when trying to study
- Inconsistency between `reviewCards` and `dueCards` metrics

#### Root Cause
New cards ARE due cards that should be studied immediately upon creation. The logic incorrectly excluded them with `s.state !== "new"`.

#### Solution
Updated the logic to include all due cards regardless of state:

```typescript
// CORRECT (after fix)
const dueCardsCount = projectSrsStates.filter(s => s.due <= now).length;
```

### 2. **Database Constraint Violations**

#### Problem
Users experienced persistent `400 Bad Request` errors with:
```
new row for relation "srs_states" violates check constraint "srs_states_interval_positive"
```

#### Root Cause
The database has a constraint `CHECK (interval > 0)`, but some SRS calculations could result in `interval = 0`.

#### Solution
Added safety checks to ensure all interval assignments use `Math.max(1, intervalValue)`:

```typescript
// Examples of fixes applied
interval: Math.max(1, stepInterval), // Ensure interval is always ≥ 1
```

### 3. **Missing SRS State Creation in Test Scripts**

#### Problem
The `createTestProject.ts` script was creating flashcards but not their corresponding SRS states, leading to orphaned cards that couldn't be studied.

#### Solution
Updated the script to create SRS states alongside flashcards, matching the production behavior in `flashcard-actions.ts`.

### 4. **Statistics Calculation Inconsistency**

#### Problem
`reviewCards` and `dueCards` were supposed to represent the same value for user clarity, but used different calculation logic.

#### Solution
Unified both metrics to represent the total number of cards available for study (including new cards).

## Technical Implementation

### Files Modified

1. **`/app/api/projects/batch-stats/route.ts`**
   - Fixed due cards calculation logic
   - Unified review and due card metrics
   - Added detailed logging for debugging

2. **`/lib/srs/SRSScheduler.ts`**
   - Added `Math.max(1, ...)` safety checks to all interval assignments
   - Covers: learning steps, relearning steps, review card intervals
   - Ensures database constraint compliance

3. **`/tests/scripts/createTestProject.ts`**
   - Added SRS state creation for test flashcards
   - Ensures test environment matches production behavior

4. **`/tests/scripts/testSRSCreation.ts`** (New)
   - Comprehensive test suite for SRS functionality
   - Verifies card creation, state initialization, and statistics

### Safety Measures Implemented

1. **Interval Constraint Protection**
   ```typescript
   interval: Math.max(1, stepInterval) // Always ≥ 1
   ```

2. **Comprehensive Error Logging**
   - Enhanced logging in batch-stats API
   - Detailed error tracking in SRS operations

3. **Validation Tests**
   - Created test suite to verify SRS state creation
   - Validates interval constraints
   - Confirms statistics calculation accuracy

## Verification Steps

### Manual Testing Checklist

1. **Create a new project with flashcards**
   - ✅ Flashcards should be created successfully
   - ✅ SRS states should be initialized with `state: "new"`
   - ✅ All intervals should be ≥ 1

2. **Check project statistics**
   - ✅ `newCards` should equal the number of created flashcards
   - ✅ `dueCards` should equal `newCards` for new projects
   - ✅ `reviewCards` should equal `dueCards`

3. **Start a study session**
   - ✅ New cards should be available for study
   - ✅ No "no flashcards available" errors
   - ✅ No database constraint violations

### Automated Testing

Run the comprehensive test suite:

```bash
# Test SRS creation and statistics
pnpm exec tsx tests/scripts/testSRSCreation.ts

# Create test project with proper SRS states  
pnpm exec tsx tests/scripts/createTestProject.ts
```

## Database Schema Context

### Relevant Constraints

```sql
-- srs_states table constraints
CONSTRAINT "srs_states_interval_positive" CHECK (("interval" > 0))
CONSTRAINT "srs_states_state_check" CHECK (("state" = ANY (ARRAY['new', 'learning', 'review', 'relearning'])))
```

### Key Relationships

```sql
-- Foreign key relationships
srs_states.user_id -> auth.users.id
srs_states.project_id -> projects.id  
srs_states.card_id -> flashcards.id

-- Unique constraint
UNIQUE (user_id, project_id, card_id)
```

## Performance Considerations

### Batch API Optimization

The batch-stats API consolidates multiple individual requests into a single call:
- **Before**: ~25+ individual API calls per project list load
- **After**: 1 batch API call for all projects
- **Result**: Significant performance improvement and reduced server load

### Caching Strategy

The system uses a sophisticated multi-layer cache:
- Zustand-based global cache with TTL
- SessionStorage for project statistics
- Automatic cache invalidation on data mutations

## Future Maintenance

### Monitoring Points

1. **Database Constraint Violations**
   - Monitor for any `srs_states_interval_positive` errors
   - Alert if interval calculations produce values ≤ 0

2. **Statistics Accuracy**
   - Verify `reviewCards === dueCards` in all environments
   - Monitor for discrepancies in card counts

3. **Performance Metrics**
   - Track batch-stats API response times
   - Monitor cache hit rates

### Code Review Guidelines

When modifying SRS-related code:

1. **Always validate intervals**: Use `Math.max(1, calculatedInterval)`
2. **Maintain statistics consistency**: Ensure `reviewCards` and `dueCards` align
3. **Test with actual data**: Run the test suite after changes
4. **Check constraint compliance**: Verify database operations succeed

## Troubleshooting Guide

### Common Issues and Solutions

1. **"No flashcards available" despite having cards**
   - **Cause**: Likely statistics calculation error
   - **Check**: Verify SRS states exist for all flashcards
   - **Fix**: Run SRS state creation for orphaned cards

2. **Database constraint violations**
   - **Cause**: Interval calculations producing values ≤ 0
   - **Check**: Review all `interval` assignments in SRS code
   - **Fix**: Add `Math.max(1, ...)` safety checks

3. **Inconsistent card counts**
   - **Cause**: Cache invalidation or calculation errors
   - **Check**: Compare database counts with UI display
   - **Fix**: Clear cache and reload project statistics

### Debug Commands

```bash
# Check SRS states for a project
pnpm exec tsx tests/scripts/debugSRSCardStates.ts

# Fix stuck/orphaned cards
pnpm exec tsx tests/scripts/fixStuckSRSCards.ts

# Create test data for debugging
pnpm exec tsx tests/scripts/createTestProject.ts
```

## Conclusion

The implemented fixes address the core issues that were preventing the SRS system from functioning correctly:

1. **Immediate Resolution**: Users can now study flashcards without "no cards available" errors
2. **Data Integrity**: All database constraints are satisfied
3. **UI Consistency**: Card statistics display accurately
4. **System Reliability**: Comprehensive error handling and validation

The SRS system now operates as designed, providing a smooth Anki-like spaced repetition experience for users.