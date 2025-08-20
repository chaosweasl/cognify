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
