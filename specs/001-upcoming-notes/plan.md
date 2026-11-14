# Implementation Plan: Upcoming Notes

**Branch**: `001-upcoming-notes` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-upcoming-notes/spec.md`

## Summary

A one-page notes app. The user types a note containing an English-month date, saves it, and sees
it in an "Upcoming" list sorted soonest-first. Notes live in `localStorage`. A small hand-written
function finds the date in the text. The whole feature is one new source file plus edits to two existing
files (`app/page.tsx`, and a text-only change in `app/layout.tsx`): no new libraries, no backend.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4.6 (App Router)

**Primary Dependencies**: none new (Next.js, React, Tailwind v4 already installed)

**Storage**: browser `localStorage`, one key (`mkeni.notes`) holding `{ "version": 1, "notes": [...] }`

**Testing**: no test runner is configured. Quality gates are `npm run lint` and `npx tsc --noEmit` (constitution); behavior is checked by hand using [quickstart.md](./quickstart.md). Adding a test runner would be a new dependency, so it is out of scope.

**Target Platform**: modern desktop and mobile browsers

**Project Type**: single Next.js web app (client-rendered page)

**Performance Goals**: save appears instantly (SC-002); list is tiny, no optimization needed

**Constraints**: works offline after load; no account, no network calls (FR-012); must never crash on bad stored data (FR-010)

**Scale/Scope**: one user, one device, tens of notes, one screen

## Constitution Check

*GATE: checked before research and again after design.*

| Principle | Status | How the plan meets it |
|-----------|--------|-----------------------|
| I. Simplicity First | PASS | One new file. No edit/delete/search, no extra options, no abstractions beyond a date function and storage helpers. |
| II. Client-Only | PASS | `localStorage` only. No API route, database, or login. |
| III. Minimal Dependencies | PASS | No new packages. Date parsing is our own function (browser `Date` is only used to check a date is real). |
| IV. Never Lose or Break User Data | PASS | Reads are wrapped in try/catch with an empty-list fallback. Opening the app never writes. Damaged entries are kept as-is on save; a wholly unreadable value is copied to a backup key before being replaced (see research.md R4). |
| V. Spec Before Code | PASS | Spec is clarified; this plan comes next, then `/speckit-tasks`. No code is written yet. |
| Quality Gates | PASS (at implement time) | `npm run lint` and `npx tsc --noEmit` must pass before each task is done. |

No violations, so Complexity Tracking is empty.

**Post-design re-check**: still PASS. The design added no files, packages or services beyond what is listed below.

## Project Structure

### Documentation (this feature)

```text
specs/001-upcoming-notes/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and reasons
├── data-model.md        # Phase 1: Note shape, storage format, rules
├── quickstart.md        # Phase 1: manual validation steps
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

No `contracts/` folder: the app exposes no API or external interface. Its only boundary is the
`localStorage` format, which is documented in data-model.md.

### Source Code (repository root)

```text
app/
├── notes.ts      # NEW  pure logic: findDate(), parseNotes(), readRaw(), subscribe(), addNote() (no React)
├── page.tsx      # EDIT replace scaffold with the 'use client' UI: input, Save, Upcoming list
└── layout.tsx    # EDIT only the <title>/description text in `metadata`
```

**Structure Decision**: keep everything under `app/`, the folder that already exists. `notes.ts`
is separate from `page.tsx` for one reason: the date logic and the storage logic are plain
TypeScript with no React, so they are easy to read, and easy to test later if a runner is ever
added. Merging them into `page.tsx` would save one file but mix three jobs in one place.

## Design Notes

- **Rendering**: `page.tsx` is a Client Component (`'use client'`) because it uses `localStorage`,
  state, and event handlers (docs: Server and Client Components). It reads storage with
  `useSyncExternalStore`, which gives a safe server/first-render value and avoids a hydration
  mismatch (research.md R2).
- **`findDate(text, today)`** returns one of: a valid ISO date, "no date", or "impossible date".
  It scans for the first month-name match in either order, with an optional year. A no-year date
  becomes the next occurrence on or after `today` (FR-008). Details in research.md R1.
- **Sorting**: by date, then by saved order. Notes are only ever appended, so a stable sort on
  date alone keeps same-date notes in saved order (FR-007).
- **Errors shown to the user**: empty note, no date, impossible date, storage unavailable or full
  (spec FR-003, FR-004, Edge Cases).

## Complexity Tracking

No violations to justify.
