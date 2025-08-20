---
## 🐞 Bug Report: Console Errors and New Card Limit Not Updating After Study

**Summary:**
Console errors appear when clicking on "easy", "good", "again", or "hard" while studying a new flashcard. Additionally, after leaving a study session, the new card limit and review card limit do not update correctly (e.g., it may show 3/20 new cards today or 5/100 reviews, but after leaving, they reset to the full limit again).

**Console Output / Error:**
```text
fetch.ts:15   POST https://hiiipwgvyavnelzksgrr.supabase.co/rest/v1/daily_study_stats 400 (Bad Request)
dailyStudyStats.ts:10  [Error inserting new daily study stats] Supabase error: {code: '23502', details: null, hint: null, message: 'null value in column "project_id" of relation "daily_study_stats" violates not-null constraint'}

fetch.ts:15   POST https://hiiipwgvyavnelzksgrr.supabase.co/rest/v1/user_notifications?columns=%22user_id%22%2C%22type%22%2C%22title%22%2C%22message%22%2C%22url%22%2C%22trigger_at%22 400 (Bad Request)
scheduleSRSReminderClient.ts:18  Failed to schedule SRS reminder {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'trigger_at' column of 'user_notifications' in the schema cache"}
```

**Steps to Reproduce:**
1. Start a study session with new flashcards.
2. Click on "easy", "good", "again", or "hard" for a card.
3. Observe the console for errors.
4. Leave the study session and return to the dashboard or project page.
5. Check if the new card limit and review card limit update correctly (they may reset instead of reflecting progress).

**Expected:**
- No console errors when submitting study responses.
- New card limit and review card limit should update and persist after leaving a study session.

---

---

## 🐞 Enhancement: Add Zustand Store Reset for Reliable Data Refresh

**Summary:**
Currently, after editing or saving flashcards/projects, the UI relies on a query param (`refresh=1`) or a page reload to update the project/flashcard list. This is not always reliable and can require multiple reloads for components to sync.

**Proposed Solution:**

- Add a `reset` or `clear` method to all relevant Zustand stores (e.g., `useProjectsStore`, `useFlashcardsStore`, and any others managing user, settings, study, or notification state).
- After saving, updating, or deleting data in any part of the app (not just `/projects` or the editor), call the appropriate store's `reset` method to clear cached data.
- Ensure all pages and components that depend on shared state (dashboard, study, settings, notifications, etc.) re-fetch fresh data from the backend when the store is empty or reset.
- Remove reliance on the `refresh=1` query param for state sync throughout the app.

**Benefits:**

- More reliable and instant UI updates after edits
- No need for full page reloads or URL hacks
- Cleaner, more maintainable state management

**Steps to Implement:**

1. Add a `reset` method to each relevant Zustand store (set state to initial/default values).
2. Call the `reset` method after successful save/update/delete actions in editors or modals.
3. Update data-loading logic in all relevant pages and components (dashboard, study, settings, notifications, etc.) to re-fetch if store is empty/reset.
4. Remove or deprecate the use of `refresh=1` in navigation across the app.

**Expected:**
Project and flashcard lists always reflect the latest changes immediately after edits, with no manual reloads required.

---

---

## 🐞 Bug Report: App Notification Errors on Landing Page (Unauthenticated)

**Summary:**
App notification fetch fails with 401/permission denied for unauthenticated users on the landing page.

**Console Output:**

```text
fetch.ts:15   GET https://hiiipwgvyavnelzksgrr.supabase.co/rest/v1/app_notifications?select=*&published=eq.true&order=created_at.desc 401 (Unauthorized)
NotificationBell.tsx:95  [Supabase] getAppNotifications error {code: '42501', details: null, hint: null, message: 'permission denied for table app_notifications'}
```

**Steps to Reproduce:**

1. Log out
2. Go to the landing page: http://localhost:3000
3. Check browser console for errors

**Expected:**
No errors in the console for unauthenticated users; public notifications should be readable or the request should be skipped.

---

## 📝 Issue Template

**Title:**
_Short, descriptive summary_

**Summary:**
_What is the problem?_

**Console Output / Error:**

```text
_Paste relevant error logs or stack traces here_
```

**Steps to Reproduce:**

1. _Step one_
2. _Step two_
3. _..._

**Expected:**
_What should happen instead?_

**Screenshots (optional):**
_Add screenshots if helpful_

---
