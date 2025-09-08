# Contributing to Cognify

Thanks for your interest in contributing. This project prefers focused contributions that keep the core system stable while improving UX, docs, themes, and small bug fixes.

## What to contribute

We welcome contributions in these areas:

- Documentation: README, how-to guides, API docs under `docs/`
- UI & Accessibility: component improvements, responsive fixes, themes
- Bug reports & small fixes: issues that can be reviewed and tested without complex infra
- Tests and type-safety improvements

Please avoid large-scale changes that touch core business logic without prior discussion (see "Not accepted" below).

## Before you start

1. Search existing issues and discussions to avoid duplicates.
2. For non-trivial work, open an issue describing the change and wait for maintainer feedback.

## Quick local development notes

Most contributors can work without a full local Supabase setup by focusing on docs, styles, and isolated UI changes. If you need to run the app locally:

1. Install dependencies: `pnpm install`
2. Copy env example: `copy .env.example .env.local`
3. Fill in required Supabase variables (or use a throwaway Supabase project for testing)
4. Start dev server: `pnpm dev`

Note: The codebase relies on Supabase and certain DB schemas; consider mocking or using test data scripts in `scripts/` for isolated UI work.

## Pull request process

1. Create a clear, focused branch: `git checkout -b feat/description`
2. If the change is non-trivial, open an issue first and reference it from the PR
3. Keep PRs small and focused. Provide screenshots for visual changes and clear reproduction steps for bug fixes
4. Ensure linting and types pass:

```bash
pnpm lint
npx tsc --noEmit
```

## PR checklist

- [ ] Lint passes (`pnpm lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Relevant docs updated
- [ ] Screenshots included for UI changes

## What we rarely accept

- Large changes to the SRS algorithm or core scheduling without maintainer review
- Database schema/migration changes without discussion
- Major architectural rewrites

If you're unsure, open an issue and describe your approach — maintainers will advise.

## Filing good issues

Provide a descriptive title, steps to reproduce, expected vs actual behavior, environment, and screenshots or console logs when relevant.

## License

By contributing you agree to license your work under the project's MIT license.

---

Thanks — your improvements help make Cognify better for everyone!
