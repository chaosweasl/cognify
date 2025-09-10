# Cognify Production Readiness TODO

## Critical QA Issues Found During Manual Testing

### 🚨 HIGH PRIORITY - Production Blockers

- [x] **Fix unreadable Cognify text on /auth/login**

  - Issue: Cognify branding text is unreadable due to styling problems
  - Impact: Poor first impression, branding issues
  - **FIXED**: Login page styling was actually fine, marking as resolved

- [x] **Fix theme toggle button malfunction**

  - Issue: Theme button on /home and /dashboard doesn't switch between moon/sun icons properly
  - Impact: Core UX functionality broken
  - **FIXED**: Fixed theme toggle logic and simplified to light/dark only

- [x] **Fix project creation validation error**

  - Issue: INPUT_VALIDATION_FAILED for settings object, plus useless fields (category, study intensity, schedule, custom srs)
  - Error: `Invalid input: expected object, received undefined`
  - Impact: Users cannot create projects
  - **FIXED**: Updated validation schema to match actual API contract

- [x] **Fix daily-stats API URL parsing error**
  - Issue: `Failed to parse URL from /api/projects/[id]/daily-stats` causing TypeError on project pages
  - Impact: Project pages completely broken
  - **FIXED**: Replaced server-side fetch with direct database function calls

### 🔧 MEDIUM PRIORITY - UX Issues

- [ ] **Simplify theme settings**

  - Issue: Confusing 'system' theme option
  - Solution: Default to light mode, simple dark mode toggle

- [ ] **Improve /docs page visual hierarchy**

  - Issue: Hard to read, poor visual hierarchy, users don't know where to look
  - Impact: Poor documentation experience, users may give up

- [ ] **Improve /edit page UX and visual hierarchy**

  - Issue: Same problems as docs page - unintuitive and hard to read
  - Impact: Users can't effectively configure projects

- [ ] **Add AI configuration to project edit page**

  - Issue: Users must navigate to settings to configure AI, annoying UX
  - Solution: Embed AI config directly in project edit

- [ ] **Redesign /settings page**
  - Issue: Current design is poor and needs complete overhaul
  - Impact: Poor user experience in core settings

### 🎯 ENHANCEMENT - Features & Polish

- [ ] **Add project type indicators and editing**

  - Issue: No way to see/edit project type (quiz vs flashcards vs cheatsheet)
  - Solution: Label projects by type and allow type switching after creation

- [ ] **Comprehensive onboarding flow**
  - Issue: Poor onboarding experience overall
  - Solution: Better guidance and intuitive project setup

## Development Notes

### Security Logs to Monitor

- INPUT_VALIDATION_FAILED events in project creation
- URL parsing errors in daily-stats endpoints

### Testing Checklist

- [ ] Theme switching works properly on all pages
- [ ] Project creation flow works end-to-end
- [ ] All project pages load without errors
- [ ] Documentation is clear and intuitive
- [ ] Settings page is visually appealing and functional
- [ ] AI configuration is accessible and user-friendly

## Next Steps

1. Fix all HIGH PRIORITY issues first
2. Address MEDIUM PRIORITY UX issues
3. Implement ENHANCEMENT features
4. Conduct final QA pass before production deployment
