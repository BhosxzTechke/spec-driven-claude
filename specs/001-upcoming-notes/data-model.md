# Data Model: Upcoming Notes

## Entity: Note

| Field | Type | Meaning | Rules |
|-------|------|---------|-------|
| `text` | string | Exactly what the user typed (trimmed at the ends) | Not empty. Any length. Any language. |
| `date` | string `YYYY-MM-DD` | The date found in the text | Must be a real calendar date. No-year dates are resolved to a full date **at save time** and never recalculated. |
| `savedAt` | number (ms since 1970) | The moment the note was saved | Informational; set once. Same-date ordering uses the array (saved) order, not this field. |

There is no `id`: notes cannot be edited or deleted in this version, so nothing needs to point at
one note. (Add an id only if a later spec adds edit/delete.)

## Storage format

- **Key**: `mkeni.notes`
- **Value**: a JSON object with a format version and the notes, saved order (oldest first).

```text
{"version":1,"notes":[{"text":"bayad kuryente sa Nov 15","date":"2026-11-15","savedAt":1794000000000}]}
```

- **`version`**: the number `1`. It exists so a future spec can change the format and migrate
  old data. This feature only understands version 1.
- **Unknown version** (for example `2`, or a missing `version`): treated the same as an
  unreadable value. The app shows an empty list, changes nothing on load, and on save makes a
  backup copy first (see below). This protects data written by a newer version of the app.
- **Migration is not built now.** Only the version field is added (Principle I); a later spec
  adds migration code when a version 2 actually exists.

- **Backup key** (only created when the whole value was unreadable at save time):
  `mkeni.notes.backup-<savedAt of the new note>`, containing the original string unchanged.

## Display order

Sort by `date` ascending (string order works for `YYYY-MM-DD`). Ties keep array order, which is
saved order (FR-007). Use a stable sort; do not reorder the stored array itself.

## Validation

| Moment | Check | Result if it fails |
|--------|-------|--------------------|
| Save | `text.trim()` is not empty | Message: a note is needed (FR-004) |
| Save | `findDate` finds a month-name date | Message: please include a date (FR-003) |
| Save | the found date is a real date | Message: that date isn't a real date (FR-003) |
| Load | value parses as an object with `version === 1` and `notes` is an array | Else: show empty list, change nothing |
| Load | each item in `notes` has string `text`, valid `date`, number `savedAt` | Else: skip that item for display, change nothing |

## State transitions

```text
(nothing stored) --save--> [note]
[notes] --save--> [notes + new note at end]          (display re-sorts)
[some items damaged] --save--> same notes array + new note (damaged items untouched)
[whole value unreadable or unknown version] --save--> backup copy made, then {version:1, notes:[new note]}
```

No transition ever happens on page load.
