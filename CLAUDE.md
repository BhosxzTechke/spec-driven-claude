@AGENTS.md
# CLAUDE.md

Mkeni Spec — a tiny notes app: type a note with a date, see it in an Upcoming list. Practice project for learning Spec Kit.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)
- `npx tsc --noEmit` — typecheck
- No test runner is configured yet.

## Next.js version warning

Next.js 16.4.x / React 19.3 is newer than typical training data; follow the AGENTS.md guidance above and read `node_modules/next/dist/docs/` first.

## Architecture

Fresh `create-next-app` scaffold (App Router, TypeScript, `@/*` → repo root alias).

Non-default config in `next.config.ts` that affects how code must be written:
- `cacheComponents: true` and `partialPrefetching: true` — Cache Components / PPR model; check the docs for how dynamic data access and caching work under it.
- `experimental.agentFeedback: true`.
- Tailwind v4 is wired through Turbopack rules (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. Styles use `@import "tailwindcss"` and `@theme inline` in `app/globals.css`.

## Spec Kit

The project is set up with Spec Kit 1.4.0 (Claude integration, PowerShell scripts). Workflow is driven by the `speckit-*` skills in `.claude/skills` (constitution → specify → clarify → plan → tasks → analyze → implement). Templates, scripts and the workflow definition live in `.specify/`. `.specify/memory/constitution.md` is still the unfilled template; run `speckit-constitution` to populate it before relying on it.

## Working with me

I'm learning. Explain your reasoning in simple English. Product and engineering rules live in .specify/memory/constitution.md — don't repeat them here.
