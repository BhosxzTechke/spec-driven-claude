# Quickstart: Validating Upcoming Notes

No test runner exists, so validation is the two quality gates plus a short manual run.

## Prerequisites

- `npm install` done
- Today in the browser is 2026-11-13 or later in 2026 (the examples assume 2026-11-14; adjust
  year-rollover expectations if your date differs)

## Quality gates (must pass)

```text
npm run lint
npx tsc --noEmit
```

## Run

```text
npm run dev
```

Open http://localhost:3000. To start clean, run `localStorage.clear()` in the browser console.

## Manual checks

| # | Do this | Expect | Spec |
|---|---------|--------|------|
| 1 | Save `bayad kuryente sa Nov 15` | Appears under Upcoming with "Nov 15"; input clears | US1 |
| 2 | Save `bili gatas` | Not saved; friendly "include a date" message | US1 |
| 3 | Try an empty / spaces-only note | Not saved; "a note is needed" message | US1 |
| 4 | Press Enter instead of clicking Save | Saves the same way | FR-001 |
| 5 | Save `Nov 30`, `Nov 15`, `Nov 20` notes in that order | List reads Nov 15, 20, 30 | US2 |
| 6 | Save two notes on the same date | Shown in the order saved | FR-007 |
| 7 | Empty app (clear storage, reload) | Empty-state message | US2 |
| 8 | Save `x Nov 10` (no year, already passed this year) | Shown as 10 Nov **2027** | FR-008 |
| 9 | Save `x Feb 30` | Not saved; "not a real date" message (different from #2) | FR-003 |
| 10 | Save `x Nov 15, 2024` | Saved, shown at the top | Edge case |
| 11 | Save `15 Nov`, `November 15`, `nov 15 2027` | All recognized | FR-002 |
| 12 | Save a very long note | Wraps, page layout holds | Edge case |
| 13 | Reload the page | Same notes, same order | US3 |
| 14 | Console: `localStorage.setItem('mkeni.notes','{oops')`, reload | App opens, empty list, no crash; stored value still `{oops` | US3, FR-010 |
| 15 | With #14 state, save a note | New note shows; `mkeni.notes.backup-…` holds `{oops` | R4 |
| 16 | Console: `localStorage.setItem('mkeni.notes', '{"version":1,"notes":[{"text":"ok Nov 15","date":"2026-11-15","savedAt":1},42]}')`, reload | Good note shown, junk skipped, stored value unchanged | US3 |
| 17 | With #16 state, save a new note | New note added; `42` is still in the stored `notes` array | US3 / FR-010 |
| 18 | Console: `localStorage.setItem('mkeni.notes', '{"version":2,"notes":[]}')`, reload | Empty list, no crash, stored value unchanged | R4 |
| 19 | With #18 state, save a note | New note shows; a backup key holds the version 2 text; `mkeni.notes` is now version 1 | R4 |
| 20 | After any save, check `localStorage.getItem('mkeni.notes')` | Starts with `{"version":1,"notes":[` | data-model |
| 21 | Save about 20 notes with mixed dates in random order (some with and without a year) | List matches the same dates sorted soonest first; same-date notes in saved order | SC-003 |

## Done when

Lint and typecheck pass and all rows above behave as listed.
