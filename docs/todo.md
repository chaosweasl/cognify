# Cognify Project TODO List

---

## MVP (Minimum Viable Product)

### Core Features

- [ ] **Authentication**
  - [x] Only allow authenticated users to access any feature
  - [ ] Secure, clean auth flow (Supabase)
  - [ ] Onboarding process for freshly authenticated users (creating a profile, configuring AI settings, etc..)
- [ ] **Flashcard Creation**
  - [ ] Import PDFs for flashcard generation
  - [ ] ~~Import YouTube videos for flashcard generation~~
  - [ ] AI-powered flashcard creation (user brings own API key, stored in localStorage only)
  - [x] Manual flashcard creation/editing
- [ ] **SRS (Spaced Repetition System)**
  - [x] Bug-free SRS algorithm (project-specific settings from DB)
  - [ ] Study sessions persist across reloads (localStorage)
  - [ ] Batch SRS state updates (see `lib/srs/SRSDBUtils.ts`)
- [ ] **Projects**
  - [ ] Create, edit, delete projects with all the necessary steps
  - [ ] Organize flashcards by project
- [ ] **Settings**
  - [ ] Per-user and per-project SRS config (sync with DB and localStorage)
  - [ ] Theme selection (sync with DB and localStorage)
- [ ] **Notifications**
  - [ ] Personal and app notifications (with RLS)
  - [ ] Clean up reminders when projects/cards are deleted
  - [ ] UI to view and manage notifications (`NotificationBell`)
- [ ] **UI/UX**
  - [ ] Clean, modern design (Tailwind CSS + DaisyUI)
  - [ ] Responsive layouts
  - [ ] Accessible components
- [ ] **Security**
  - [ ] Enforce RLS on all data
  - [ ] Never store API keys or LLM endpoints in DB (localStorage only)
  - [ ] Avoid leaking data between users

### Developer Experience

- [ ] Monorepo structure (`app/`, `lib/`, `src/components/`, `hooks/`)
- [ ] Linting, typechecking, and build scripts (`pnpm lint`, `pnpm typecheck`, `pnpm build`)
- [ ] Manual testing of full user flows

---

## Non-MVP / Future Features

### AI & Study Tools

- [ ] AI-powered essay writing assistance
- [ ] Worksheet/cheatsheet generation from PDF/YouTube
- [ ] Support for user-connected LLM endpoints (beyond OpenAI)
- [ ] Advanced flashcard import/export (e.g., Anki, CSV)

### Admin & Monitoring

- [ ] Admin dashboard (manage users, projects, content)
- [ ] Monitoring/statistics dashboard (usage, study stats, etc.)

### Collaboration & Sharing

- [ ] Share projects/flashcards with other users
- [ ] Public project templates

### Integrations

- [ ] Browser extension for quick flashcard creation
- [ ] Mobile app

### Other Enhancements

- [ ] In-app onboarding/tutorial
- [ ] Gamification (badges, streaks)
- [ ] Advanced notification/reminder scheduling

---

## Current State (from codebase)

- [x] Notification system (personal/app notifications, UI, RLS)
- [x] Supabase integration for data and auth
- [x] SRS logic (project-specific, batch updates)
- [x] Modern UI with Tailwind CSS + DaisyUI
- [x] Monorepo structure and conventions
- [x] Settings (theme, SRS config) framework in place

---

**Next Steps:**  
Focus on completing and polishing the MVP features above. Once stable, prioritize admin/monitoring and advanced AI tools
