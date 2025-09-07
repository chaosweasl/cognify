## 🔮 POST-MVP FEATURES

### Future Enhancements (Not MVP)

- [ ] **Advanced AI Features**
  - [ ] YouTube video transcription and flashcard generation
  - [ ] AI essay writing assistance
  - [ ] Worksheet and cheatsheet generation
  - [ ] Multi-language support
- [ ] **Collaboration & Sharing**
  - [ ] Public flashcard libraries
  - [ ] Team study groups
  - [ ] Flashcard marketplace
- [ ] **Mobile & Extensions**
  - [ ] React Native mobile app
  - [ ] Browser extension
  - [ ] Desktop application
- [ ] **Advanced Analytics**
  - [ ] ML-powered study insights
  - [ ] Personalized learning recommendations
  - [ ] Progress prediction models

---

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
- [ ] **Gamification Elements** (moved from MVP)
  - [ ] Achievement badge system with unlock animations
  - [ ] Progress levels with visual feedback
  - [ ] Study streak indicators and tracking
  - [ ] Interactive achievement tooltips
  - [ ] Daily goals completion celebrations
- [ ] Advanced notification/reminder scheduling

---

## UI/UX MVP: polish and release readiness

This section outlines a practical, prioritized plan to make the app look nicer, cleaner, and ready for an MVP release. It includes an audit, design system, page-level improvements, accessibility, performance, QA, and deliverables.

High-level goals:

- Create a consistent visual language (colors, spacing, type).
- Improve clarity of core workflows: onboarding, project creation, study sessions.
- Ensure responsive and accessible UI across devices.
- Make the app feel fast with lightweight animations and optimized assets.

Roadmap (prioritized)

1. UI/UX audit & quick wins

- Run a site-wide audit covering: landing, dashboard, projects, flashcards/study, auth/onboarding.
- Capture screenshots, list severity (critical/high/medium/low), and propose quick fixes.
- Implement top 10 quick wins (spacing, type scale, CTA prominence, empty states).

2. Design tokens & component library

- Define color palette (primary, accent, neutral, success, warning, error), typographic scale, and spacing tokens.
- Wire tokens into Tailwind config (extend colors, spacing, fontSizes) and create a short `design-tokens.md` in `docs/`.
- Create/refactor shared UI primitives in `components/ui/`: Button, Card, Input, Modal, Toast, Skeleton.

3. Page-level polish

- Dashboard & Projects: card layout, project thumbnails, prominent new-project CTA, loading skeletons, and empty states.
- Flashcards / Study: large readable card, clear controls (show/hide answer), progress bar, keyboard navigation, and mobile gestures.
- Auth & Onboarding: friendly copy, clear form field states, helpful errors, and progress steps.

4. Accessibility & responsiveness

- Run automated checks (axe / Lighthouse), fix color contrast, add aria attributes, ensure focus management and keyboard support.
- Ensure responsive breakpoints and usable touch targets on mobile.

5. Performance & assets

- Optimize images (use webp/avif where possible), implement next/image where appropriate, lazy-load heavy modules, and audit bundle size.
- Add simple loading skeletons for asynchronous screens.

6. QA, visual regression, and release checklist

- Create a release checklist that includes: accessibility report, Lighthouse score targets, core workflow manual tests, and visual diffs for major screens.
- Add smoke tests for critical routes (home, dashboard, study session, new project, login).

Checklist mapping to repo files (where to change)

- Global layout: `app/layout.tsx`, `app/(main)/layout.tsx`.
- Landing: `app/home/page.tsx` and `app/(main)/components/*`.
- Dashboard/projects: `app/(main)/dashboard/`, `app/(main)/projects/`, `components/*`.
- Flashcards/study: `app/api/flashcards/*` (backend API), `app/(main)/flashcards/`, `components/ui/*`.
- Auth/onboarding: `app/auth/*` and `app/(main)/onboarding/`.
