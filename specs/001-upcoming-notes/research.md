# Research: Upcoming Notes

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`. These are the technical decisions.

## R1. Finding the date in the text (own function)

- **Decision**: one function, `findDate(text, today)`, using a single regular expression for each
  of the two orders, then picking whichever match appears first in the text:
  - Month-first: `(month name) (day)(, year)?`, such as "Nov 15", "November 15, 2027"
  - Day-first: `(day) (month name)(,? year)?`, such as "15 Nov", "15 November 2027"
  - Month names: full and 3-letter short forms, case-insensitive, whole words only. Nothing
    else ("Sept", "Nov.") is accepted; keep it simple.
  - Day is 1 or 2 digits. Year is 4 digits.
- **Validity check**: build a `Date` from year/month/day and confirm it comes back with the same
  month and day. This catches "Feb 30" (it would roll to March). Result is "impossible date".
- **No-year rule**: try `today`'s year; if the date is before today, use next year. "Feb 29" with
  no year is the one tricky case: the plan is to try each of the next 8 years and take the first
  one where Feb 29 is real, so it is not wrongly rejected as impossible. "Feb 30" fails in every
  year, so it is still "impossible".
- **Output**: a date string `YYYY-MM-DD`, not a `Date` object, so there are no time-zone shifts.
  "Today" is the user's local calendar date.
- **Rationale**: the user asked for our own small function and no libraries. Regex over a fixed
  month list is short and easy to read.
- **Alternatives considered**: `Date.parse` on the whole text (inconsistent between browsers and
  cannot find a date inside a sentence); a date library such as date-fns or chrono-node (rejected
  by Principle III and the user's instruction).
- **Accepted edge**: a number sitting next to a month word can be read as a day, for example
  "bili 2 Nov" reads as 2 Nov. That is fine for this app. When a note has several candidate
  dates, the one that appears first in the text wins (spec: first date found).

## R2. Reading `localStorage` without a hydration error

- **Problem**: the server has no `localStorage`, so the first server render cannot show saved
  notes. Reading it directly in a Client Component during render would make the server HTML and
  the browser HTML differ (hydration error). The Next.js docs list "Deferring to `useEffect`"
  as flash-prone, and `useEffect` + `setState` also trips the React lint rules.
- **Decision**: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`.
  - `getSnapshot` returns the raw stored string (or `null`). A string is a stable value, so React
    does not loop. Parsing into notes happens afterwards with `useMemo`.
  - `getServerSnapshot` returns a "not loaded yet" marker, so the server and first client render
    agree. The page shows nothing (or a neutral placeholder) until the browser value is known,
    rather than flashing the empty-state message.
  - `subscribe` listens to the `storage` event (other tabs) and to a small custom event fired
    after our own save.
- **Rationale**: React's built-in tool for exactly this problem; no library needed.
- **Alternatives considered**: `useEffect` load (flash, lint warning); lazy `useState`
  initializer (causes a hydration mismatch); inline-script trick from the Next.js guide (more
  moving parts than a notes list needs).

## R3. Cache Components (`cacheComponents: true`)

- **Decision**: no special handling. The page makes no server data requests and reads no
  request-time data (cookies, headers, `Date.now()` on the server). All time-dependent work
  ("today") runs in the browser, inside event handlers and the client render after hydration.
- **Care point**: computing "today" during render on the server would bake in the build date.
  `findDate` therefore takes `today` as a parameter, and only the Save handler supplies it.
- **Rationale**: keeps the page statically prerenderable and correct.

## R4. Damaged data and saving (Principle IV, FR-010)

- **Stored format**: `{ "version": 1, "notes": [...] }` (see data-model.md). The version number
  lets a later spec migrate the format. Only the field is added now; no migration code.
- **Reading**: `JSON.parse` inside try/catch. If the result is not an object with `version === 1`
  and a `notes` array, treat the list as empty (this includes an unknown version, so data from a
  newer app is never misread). Each item in `notes` is checked (`text` is a string, `date` is a
  valid `YYYY-MM-DD`, `savedAt` is a number). Valid items are shown; invalid items are skipped,
  not deleted.
- **Opening the app never writes**: reading is read-only.
- **Saving, partly damaged `notes`**: take the stored `notes` array as-is (all items, including
  the unreadable ones, untouched), push the new note on the end, write it back with
  `version: 1`. Unreadable items stay exactly as stored.
- **Saving, whole value unreadable** (not valid JSON, not an object, no `notes` array, or a
  version other than 1): we cannot append to it without replacing it. **Decision (confirmed by
  the user)**: first copy the original string to a backup key, `mkeni.notes.backup-<timestamp>`,
  then write `{ "version": 1, "notes": [new note] }`. Nothing is lost, and the replace only
  happens because the user pressed Save. This matches the constitution wording "MUST NOT
  overwrite ... without the user's action".
- **Spec note**: the spec does not mention this backup copy. Consider adding one line to the spec
  (FR-010) so spec and plan agree; `/speckit-analyze` may also flag it.
- **Storage unavailable or full**: reading returns "empty"; saving catches the error, keeps the
  note in memory for this visit, and shows "Notes may not be kept". (Spec edge case.)
- **Alternatives considered**: silently overwrite (violates Principle IV); refuse to save
  (blocks the user from using the app at all).

## R5. Styling

- **Decision**: Tailwind classes already available in the project, directly in `page.tsx`. No
  component library, no custom CSS beyond what exists.
- **Rationale**: Principle I. Long notes wrap using `break-words` (spec edge case).
