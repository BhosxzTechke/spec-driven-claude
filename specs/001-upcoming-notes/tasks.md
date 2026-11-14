---

description: "Task list for Upcoming Notes"
---

# Tasks: Upcoming Notes

**Input**: Design documents from `/specs/001-upcoming-notes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (no `contracts/`: the app has no external interface)

**Tests**: Not requested, and no test runner is configured (adding one is a new dependency). Validation is `npm run lint`, `npx tsc --noEmit`, and the manual checks in [quickstart.md](./quickstart.md).

**Organization**: Grouped by user story. All three stories are P1 and all code lives in two files (`app/notes.ts`, `app/page.tsx`), so tasks touching the same file are sequential and none are marked [P].

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 = save a note, US2 = soonest-first list, US3 = survives reload and damaged data
- Quality gate for EVERY task: `npm run lint` and `npx tsc --noEmit` must pass before it is marked done (constitution)
- Before writing code, skim the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md rule); this Next.js version differs from older ones

## Path Conventions

Single Next.js App Router project. New logic in `app/notes.ts`; UI in `app/page.tsx` (`'use client'`); `app/layout.tsx` gets a text-only edit. Path alias `@/*` points at the repo root.

---

## Phase 1: Setup

**Purpose**: Replace the scaffold so there is a clean place to build.

- [X] T001 Edit `app/layout.tsx`: change only the `metadata` values to `title: "Mkeni Notes"` and `description: "Notes with dates, soonest first"`. Leave fonts and everything else unchanged.
- [X] T002 Replace the whole body of `app/page.tsx` (the create-next-app demo, including the `next/image` imports) with a minimal `'use client'` component that renders a `<main>` with an `<h1>Upcoming</h1>`. Keep the file's default export. Confirm `npm run dev` shows it at http://localhost:3000.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: The `Note` type and the safe read path. Every story needs to read stored notes without ever crashing or writing (Principle IV).

**CRITICAL**: Complete before any user story.

- [X] T003 Create `app/notes.ts` with: `export type Note = { text: string; date: string; savedAt: number }` (`date` is `YYYY-MM-DD`); `export const STORAGE_KEY = "mkeni.notes"`; and a small `isNote(x: unknown): x is Note` check: `text` is a string, `date` matches `YYYY-MM-DD` and is a real calendar date, `savedAt` is a number.
- [X] T004 In `app/notes.ts` add `export function parseNotes(raw: string | null): Note[]`. It MUST be read-only (never touches `localStorage`) and never throw. Rules from data-model.md: the value must parse (inside try/catch) as an object with `version === 1` and `notes` an array; otherwise return `[]`. From `notes`, return only items that pass `isNote`; skip the rest (skipping is display-only, nothing is deleted).
- [X] T005 In `app/notes.ts` add `export function readRaw(): string | null` (returns `localStorage.getItem(STORAGE_KEY)` inside try/catch, `null` on any error) and `export function subscribe(onChange: () => void): () => void`, which listens to the `window` `storage` event and to a custom `"mkeni-notes-changed"` event, and returns a cleanup function.
- [X] T006 In `app/page.tsx` read notes with `useSyncExternalStore<string | null | undefined>(subscribe, readRaw, () => undefined)` (the explicit type is needed so TypeScript accepts `undefined` from the server snapshot). `undefined` means "not loaded yet" (server and first client render agree, no hydration error, no empty-state flash); render nothing for the list until it is not `undefined`. Derive `notes = useMemo(() => parseNotes(raw ?? null), [raw])`. Do NOT use `useEffect` + `setState` for loading.

**Checkpoint**: App opens with an empty page and never writes to storage. Quickstart #14 and #16 (reload with bad data) show no crash, and stored values stay unchanged.

---

## Phase 3: User Story 1 - Save a note with a date (P1) MVP

**Goal**: Type a note with a date, save it, and see it in the list.

**Independent Test**: Quickstart #1-#4, #9, #11: save "bayad kuryente sa Nov 15", see it listed and the input cleared; no-date, empty, and impossible-date notes are refused with different messages.

- [X] T007 [US1] In `app/notes.ts` add `export type FindDateResult = { ok: true; date: string } | { ok: false; reason: "none" | "impossible" }` and `export function findDate(text: string, today: Date): FindDateResult`, following research.md R1:
  - Two case-insensitive, whole-word regexes: month-first (`Nov 15`, `November 15, 2027`) and day-first (`15 Nov`, `15 November 2027`). Month names: full and 3-letter short forms only (no "Sept", no trailing "."). Day is 1-2 digits; year is 4 digits.
  - Run both regexes and use whichever match starts earliest in the text (spec: first date found). No match -> `{ ok: false, reason: "none" }`.
  - Real-date check: build `new Date(year, month, day)` and confirm it keeps the same month and day (catches "Feb 30"). Fail -> `{ ok: false, reason: "impossible" }`.
  - No year: use `today`'s year; if that date is before today (compare calendar days, not times), use the next year. For "Feb 29" with no year, try the next 8 years and take the first where it is real. Today itself counts as upcoming.
  - Return `date` as a `YYYY-MM-DD` string built from numbers (no `toISOString`, so no time-zone shifts).
  - `findDate` MUST take `today` as a parameter and never call `new Date()` itself.
- [X] T008 [US1] In `app/notes.ts` add `export function addNote(note: Note): { ok: boolean }`, written to be safe from the start (Principle IV, research.md R4). It is the ONLY code that writes to `mkeni.notes`, and it never silently overwrites data it could not read:
  - Read the raw string with `readRaw()`. If it is `null` (nothing stored) -> start from `{ version: 1, notes: [] }`.
  - If it parses (inside try/catch) to an object with `version === 1` and a `notes` array -> keep the stored `notes` array AS IS (including unreadable items, untouched), push the new note on the end, and write back `{ ...parsed, version: 1, notes }`. Never filter, reorder, or rewrite existing items.
  - Anything else (invalid JSON, not an object, no `notes` array, `version` other than 1) -> FIRST write the original string, unchanged, to `localStorage` key `` `mkeni.notes.backup-${note.savedAt}` ``; only if that backup write succeeds, write `{ "version": 1, "notes": [note] }` to `mkeni.notes`. If the backup write fails, do NOT overwrite `mkeni.notes`; return `{ ok: false }`.
  - After a successful write, call `window.dispatchEvent(new Event("mkeni-notes-changed"))`.
  - Wrap all storage access in try/catch; return `{ ok: false }` if anything throws (storage full or unavailable), and never throw.
- [X] T009 [US1] In `app/page.tsx` add the form: a text `<input>` (label it, with a placeholder like `bayad kuryente sa Nov 15`) and a `Save` button, inside a `<form onSubmit>` so that Enter and the button both save (FR-001). On submit: `trim()` the text; if empty -> show "Please type a note first." and stop. Call `findDate(text, new Date())` (this is the only place "today" is created); `reason: "none"` -> show "Please include a date, like Nov 15."; `reason: "impossible"` -> show "That date isn't a real date. Please check it." (a different message). On success call `addNote({ text, date, savedAt: Date.now() })`. If it returns `{ ok: true }`, clear the input and any message. If it returns `{ ok: false }`, show "Couldn't save. Your notes may not be kept after you leave this page." (T014 later keeps such a note visible for the current visit and clears the input, so nothing the user typed is lost.) Keep the message in `useState`, shown in a line under the form (use `role="alert"`).
- [X] T010 [US1] In `app/page.tsx` render each note from `notes` as a list item showing the note text and its date formatted from the ISO string, like `Nov 15, 2026`, using a plain month-name array (not `toLocaleDateString`, which would differ between server and browser). Add `break-words` so long notes wrap (spec edge case). Order is added in US2.

**Checkpoint**: Quickstart #1-#4, #9, #11, #12 pass. Saving shows the note immediately without a reload (SC-002). Because `addNote` is already safe, #15, #17, #19 and #20 (save over damaged data) can already be checked here, and the app never overwrites unreadable data at any point.

---

## Phase 4: User Story 2 - See what's coming, soonest first (P1)

**Goal**: The list is ordered by date, nearest first, with a helpful empty state.

**Independent Test**: Quickstart #5-#8, #10: Nov 30, Nov 15, Nov 20 saved in that order read Nov 15, 20, 30; same-date notes keep saved order; empty app shows the empty message; "Nov 10" with no year shows 2027.

- [X] T011 [US2] In `app/page.tsx` sort the displayed notes by `date` ascending before rendering: use `[...notes].sort((a, b) => a.date.localeCompare(b.date))` inside the `useMemo`. `Array.prototype.sort` is stable, and notes are stored in saved order, so same-date notes keep saved order (FR-007). Do not reorder or rewrite the stored array.
- [X] T012 [US2] In `app/page.tsx`, when notes are loaded and the list is empty, show an empty-state message such as "Nothing upcoming yet. Add a note with a date above." (FR-011). Show nothing while loading (`raw === undefined`).
- [x] T013 [US2] Run quickstart #5-#8 and #10 by hand in the browser and fix anything that does not match. Past-year notes (#10) must be saved and shown at the top.

**Checkpoint**: Stories 1 and 2 both work. SC-003 holds for a mixed 20-note list.

---

## Phase 5: User Story 3 - Notes survive a reload, even with bad data (P1)

**Goal**: Reload keeps notes in order; damaged data never crashes the app and is never lost. (The safe read and write code already exists from Phases 2-3; this phase adds the in-visit fallback when storage fails and verifies the whole story.)

**Independent Test**: Quickstart #13-#20.

- [X] T014 [US3] In `app/page.tsx`, when `addNote` returns `{ ok: false }` (the message already exists from T009), also keep the note visible for the current visit: hold unsaved notes in a `useState` array, merge them into the displayed list (sorted with the rest), and clear the input since the note is now shown. This is the spec edge case "the app keeps working for the current visit". It MUST NOT write anything to storage itself.
- [x] T015 [US3] Verify by hand: quickstart #13 (reload keeps order), #14 and #15 (invalid JSON, without and with a save), #16 and #17 (one junk item inside `notes`; it must still be in storage after a save), #18 and #19 (version 2 value), #20 (saved format). Fix any mismatch.

**Checkpoint**: All three stories work; SC-004 and SC-005 hold.

---

## Phase 6: Polish and cross-cutting

- [X] T016 Run `npm run lint` and `npx tsc --noEmit`; fix every error and warning in `app/notes.ts`, `app/page.tsx`, `app/layout.tsx`.
- [X] T017 Run `npm run build` and confirm it succeeds under `cacheComponents` (no error about reading time or browser APIs during prerender).
- [x] T018 Go through every row of [quickstart.md](./quickstart.md) once more on a clean `localStorage.clear()` and tick them off.
- [x] T019 Simplicity check against the constitution: no new packages in `package.json`, no files besides `app/notes.ts`, `app/page.tsx`, `app/layout.tsx` changed, no edit/delete/search added, and no network calls anywhere (search the code for `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`; FR-012). Remove anything extra. Then run the `spec-reviewer` subagent before committing.

---

## Dependencies and execution order

- Phase 1 -> Phase 2 -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3) -> Phase 6.
- Strictly sequential on purpose: every task edits `app/notes.ts` or `app/page.tsx`, so there is nothing safe to run in parallel.
- US2 builds on US1's list rendering (T010). US3 builds on T008/T009 (it adds the in-visit fallback, T014, and the verification pass, T015).
- Within Phase 3: T007 and T008 (both `app/notes.ts`) before T009 and T010 (both `app/page.tsx`).
- **Principle IV holds after every task**: the read path (T003-T006) is read-only and never throws, and the only writer, `addNote` (T008), is safe from the moment it exists (preserves unreadable entries, backs up an unreadable value before replacing it). No later task is needed to make saving safe, and T014 keeps the note visible for the current visit if a save fails.

## Implementation strategy

- **MVP = through Phase 3 (US1)**: you can save a dated note and see it listed, and it is already safe against damaged data. Stop and check quickstart #1-#4 there.
- Then add US2 (ordering), then US3 (in-visit fallback and full verification).
- Commit after each phase.

## Task counts

| Phase | Tasks |
|-------|-------|
| 1 Setup | 2 (T001-T002) |
| 2 Foundational | 4 (T003-T006) |
| 3 US1 | 4 (T007-T010) |
| 4 US2 | 3 (T011-T013) |
| 5 US3 | 2 (T014-T015) |
| 6 Polish | 4 (T016-T019) |
| **Total** | **19** |
