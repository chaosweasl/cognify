# Cognify App TODO

This document lists the remaining features and improvements needed to complete the Cognify app, based on current project state and your requirements.

## Core Features To Implement

### 1. AI Features

- [ ] Integrate AI-powered flashcard generation (user provides API key, configurable in settings).
- [ ] Add UI for AI setup and API key entry (initial setup page).
- [ ] Allow users to select AI model and options for flashcard generation.
- [ ] Add documentation page explaining AI features and setup.

### 2. Flashcard Study & Review System

- [ ] Track user performance and show reminders for overdue flashcards.
- [ ] UI for upcoming/review due flashcards (dashboard or notifications).

### 3. User Reminders & Notifications

- [ ] Remind users to restudy flashcards based on performance and schedule.
- [ ] Option to enable/disable notifications/reminders.

### 4. Cookies & Terms of Service

- [ ] Implement cookie consent banner and logic (store consent in cookies).
- [ ] Add Terms of Service (TOS) page and link in footer/sidebar.
- [ ] Store user preferences (theme, consent, etc.) in cookies/localStorage.

### 5. Documentation & Help

- [ ] Add in-app documentation page (/docs) explaining:
  - How to use the app
  - How to set up AI features
  - How spaced repetition works
  - Privacy, cookies, and TOS
- [ ] Link to docs from sidebar or main menu.

### 6. Initial Setup Page

- [ ] Create onboarding/setup page for new users:
  - Prompt for AI API key
  - Select AI model/options
  - Explain privacy and TOS
  - Set initial preferences

## Additional Improvements

- [ ] Polish UI/UX for DaisyUI components and mobile responsiveness.
- [ ] Add more test coverage for new features.
- [ ] Update README and CONTRIBUTING docs as features are added.

## Refactor user state hooks

- [ ] Refactor codebase to use `useUserProfile` everywhere instead of `useUserId` for unified user state management

---

For details on current conventions and architecture, see `/CONTRIBUTING.md` and `/README.md`.
