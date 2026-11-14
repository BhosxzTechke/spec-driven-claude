# Feature Specification: Upcoming Notes

**Feature Branch**: `001-upcoming-notes`

**Created**: 2026-11-13

**Status**: Approved

**Input**: User description: "A tiny notes app. The user types a short note that includes a date, like "bayad kuryente sa Nov 15", and saves it. Saved notes appear in an "Upcoming" list, soonest first, so the user can see what's coming. Notes must still be there after reloading the page."

## Clarifications

### Session 2026-11-13

- Q: Which date formats should the app recognize inside a note? → A: English month names in either order ("Nov 15", "15 Nov"), full or short month names, with an optional year ("Nov 15, 2027"). Numeric dates (e.g. "11/15") and non-English month names are not recognized.
- Q: If a note has an explicit year already in the past, should it be saved and shown? → A: Yes. It is saved and shown, sorted first.
- Q: For an impossible date like "Feb 30", show a specific invalid-date message or the generic "include a date" one? → A: A specific message saying the date isn't a real date.
- Q: If stored data is only partly damaged, show the readable notes or an empty list? → A: Show the readable notes and skip the damaged ones.
- Follow-up (2026-11-14): When saving a new note, damaged entries are preserved exactly as stored (hidden, never overwritten), to match constitution Principle IV.
- Q: Should Enter save the note, or only a Save button? → A: Both: Enter saves, and there is also a Save button.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save a note with a date (Priority: P1)

The user types a short note that contains a date, for example "bayad kuryente sa Nov 15", and saves it. The note is added to the Upcoming list right away.

**Why this priority**: This is the core of the app. Without saving a dated note, nothing else has value.

**Independent Test**: Type "bayad kuryente sa Nov 15", save it, and check that it shows up in the Upcoming list with its date.

**Acceptance Scenarios**:

1. **Given** an empty app, **When** the user types "bayad kuryente sa Nov 15" and saves, **Then** the note appears in the Upcoming list showing the note text and the date November 15.
2. **Given** the user just saved a note, **When** the save finishes, **Then** the input box is cleared and ready for the next note.
3. **Given** the user types a note with no recognizable date (e.g. "bili gatas"), **When** they try to save, **Then** the note is not saved and a short, friendly message tells them to include a date.
4. **Given** the input box is empty or only spaces, **When** the user tries to save, **Then** nothing is saved and the user is told a note is needed.

---

### User Story 2 - See what's coming, soonest first (Priority: P1)

The user opens the app and reads the Upcoming list. Notes are ordered by date, with the nearest date at the top, so the user sees what comes next at a glance.

**Why this priority**: Seeing "what's coming" is the whole reason for dating a note. It is part of the core value.

**Independent Test**: Save notes dated Nov 30, Nov 15, and Nov 20 in that order, and check the list reads Nov 15, Nov 20, Nov 30.

**Acceptance Scenarios**:

1. **Given** notes dated Nov 30, Nov 15 and Nov 20 were saved in that order, **When** the user looks at the list, **Then** they appear as Nov 15, Nov 20, Nov 30.
2. **Given** two notes share the same date, **When** the user looks at the list, **Then** both appear together, with the one saved first shown first.
3. **Given** a new note with an earlier date than all existing notes, **When** it is saved, **Then** it appears at the top of the list.
4. **Given** no notes have been saved, **When** the user opens the app, **Then** an empty-state message explains that nothing is upcoming yet.

---

### User Story 3 - Notes survive a page reload (Priority: P1)

The user reloads the page or closes and reopens the browser tab on the same device. All previously saved notes are still there, in the same order.

**Why this priority**: A notes app that forgets notes cannot be trusted. The user asked for this explicitly.

**Independent Test**: Save two notes, reload the page, and check both are still listed in the right order.

**Acceptance Scenarios**:

1. **Given** the user saved two notes, **When** they reload the page, **Then** both notes are still in the Upcoming list in the same order.
2. **Given** the stored notes data is damaged or unreadable, **When** the user opens the app, **Then** the app still opens normally (showing every note it could read and skipping only the damaged ones; if nothing is readable, an empty list) and does not crash.
3. **Given** the stored notes data is damaged, **When** the app opens, **Then** the damaged data is left exactly as it is; opening the app never changes stored data.
4. **Given** some stored entries are unreadable, **When** the user saves a new note, **Then** the new note is added and every unreadable entry is kept exactly as it was (not shown, not changed, not deleted).
5. **Given** the whole stored value is unreadable (or was written in a newer format version), **When** the user saves a new note, **Then** a backup copy of the original value is kept, the new note is saved and shown, and nothing is lost.

---

### Edge Cases

- A date with no year (like "Nov 15") means the next time that date occurs on or after today. For example, if today is 2026-11-13, "Nov 15" means 2026-11-15, but "Nov 10" means 2027-11-10.
- "Feb 29" with no year means the next Feb 29 that really exists (the next leap year), not an impossible date. "Feb 29" with an explicit non-leap year (e.g. "Feb 29, 2027") is an impossible date.
- A note with an impossible date (e.g. "Feb 30") is not saved, and the user sees a specific message saying that date isn't a real date (different from the "please include a date" message for notes with no date).
- A note with more than one date: the first date found in the text is used.
- A note dated today still appears in the list (today counts as upcoming).
- A note with an explicit year already in the past (e.g. "Nov 15, 2024") is saved and shown like any other note; soonest-first ordering puts it at the top.
- Very long notes are accepted, but are shown wrapped so they do not break the page layout.
- Notes with identical text and date are allowed as separate notes.
- Storage is unavailable or full: the app keeps working for the current visit and tells the user that notes may not be kept.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to type a short note and save it, either by pressing Enter in the input box or by clicking a Save button.
- **FR-002**: The system MUST find a date inside the note text and use it as the note's date. Recognized formats are English month names (full or short) in either order ("Nov 15", "November 15", "15 Nov"), with an optional year ("Nov 15, 2027"). Numeric dates such as "11/15" and non-English month names are NOT recognized.
- **FR-003**: The system MUST NOT save a note that has no recognizable valid date, and MUST show a clear message telling the user why. A note with no date gets a "please include a date" message; a note with an impossible date (e.g. "Feb 30") gets a separate message saying the date isn't a real date.
- **FR-004**: The system MUST NOT save an empty or whitespace-only note, and MUST tell the user.
- **FR-005**: The system MUST show all saved notes in an "Upcoming" list, ordered by date with the soonest first.
- **FR-006**: Each item in the Upcoming list MUST show the note text and its date.
- **FR-007**: Notes with the same date MUST keep the order in which they were saved.
- **FR-008**: When a date has no year, the system MUST use the next occurrence of that date on or after today.
- **FR-009**: Saved notes MUST still be present, with the same order, after the page is reloaded.
- **FR-010**: Unreadable or damaged stored data MUST NOT crash the app, and the app MUST NOT lose it: opening the app never changes stored data, and saving a new note never alters or deletes an unreadable entry. If only some stored notes are damaged, the app MUST still show the notes it can read, skip displaying the damaged ones, and keep them exactly as stored when saving new notes. If the whole stored value is unreadable (or was written in a format version this app does not understand), saving a new note MUST first keep a backup copy of the original value and only then store the new note, so nothing is lost.
- **FR-011**: The system MUST show a helpful empty-state message when there are no notes.
- **FR-012**: Notes MUST stay on the user's own device; the app MUST NOT require an account or send notes anywhere.

### Key Entities

- **Note**: One saved entry. It has the text the user typed, the date found in that text, and the moment it was saved (informational; notes that share a date are ordered by the order they were saved).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can type and save a dated note in under 10 seconds.
- **SC-002**: A newly saved note appears in the Upcoming list immediately, with no page reload needed.
- **SC-003**: In a list of 20 notes with mixed dates, 100% appear in correct soonest-first order.
- **SC-004**: 100% of notes saved before a page reload are still present and in the same order after it.
- **SC-005**: Opening the app with damaged saved data shows a usable page 100% of the time, never an error screen.
- **SC-006**: A first-time user can save their first note without any instructions.

## Assumptions

- The app is for one person on one device and browser; syncing across devices is out of scope.
- Notes are written in any language (including Tagalog or Taglish); only the date needs to be written with an English month name (see FR-002).
- Editing, deleting, completing, or searching notes is out of scope for this version, to keep the app tiny.
- Notes with a date already in the past are never rejected or hidden. Because dates without a year roll forward to the next occurrence, past dates only come up when the user types an explicit past year.
- No login, backend, or server storage is used, in line with the project constitution.
