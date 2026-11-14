// Notes logic with no React: the Note type, safe reading, date finding, and safe saving.
// Storage format (see specs/001-upcoming-notes/data-model.md):
//   localStorage["mkeni.notes"] = { "version": 1, "notes": [Note, ...] }

export type Note = { text: string; date: string; savedAt: number };

export const STORAGE_KEY = "mkeni.notes";
const CHANGED_EVENT = "mkeni-notes-changed";

// ---------- Dates ----------

function isRealDate(year: number, month: number, day: number): boolean {
  // month is 0-11. setFullYear avoids the JS quirk that treats years 0-99 as 1900-1999.
  const d = new Date(2000, 0, 1);
  d.setFullYear(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function toIso(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month + 1, 2)}-${pad(day, 2)}`;
}

function dayKey(year: number, month: number, day: number): number {
  return year * 10000 + (month + 1) * 100 + day;
}

// ---------- Reading (never writes, never throws) ----------

function isNote(x: unknown): x is Note {
  if (typeof x !== "object" || x === null) return false;
  const n = x as Record<string, unknown>;
  if (typeof n.text !== "string" || typeof n.savedAt !== "number") return false;
  if (typeof n.date !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(n.date);
  if (!m) return false;
  return isRealDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Turn the raw stored string into the notes we can read. Unreadable items are skipped, not deleted. */
export function parseNotes(raw: string | null): Note[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return [];
    const obj = parsed as { version?: unknown; notes?: unknown };
    if (obj.version !== 1 || !Array.isArray(obj.notes)) return [];
    return obj.notes.filter(isNote);
  } catch {
    return [];
  }
}

export function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED_EVENT, onChange);
  };
}

// ---------- Finding the date in the text ----------

export type FindDateResult =
  | { ok: true; date: string }
  | { ok: false; reason: "none" | "impossible" };

// Full names first so "november" is not cut short to "nov". No "sept", no trailing "."
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december",
];
const MONTH_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_PATTERN = [...MONTH_NAMES, ...MONTH_SHORT].join("|");

function monthIndex(word: string): number {
  const w = word.toLowerCase();
  const full = MONTH_NAMES.indexOf(w);
  return full >= 0 ? full : MONTH_SHORT.indexOf(w);
}

// "Nov 15", "November 15, 2027"
const MONTH_FIRST = new RegExp(
  `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?!\\d)(?:\\s*,?\\s*(\\d{4})(?!\\d))?`,
  "i",
);
// "15 Nov", "15 November 2027"
const DAY_FIRST = new RegExp(
  `\\b(\\d{1,2})\\s+(${MONTH_PATTERN})\\b(?:\\s*,?\\s*(\\d{4})(?!\\d))?`,
  "i",
);

/**
 * Find the first date written with an English month name. `today` is passed in
 * (never read here) so the result does not depend on when the page was built.
 */
export function findDate(text: string, today: Date): FindDateResult {
  const a = MONTH_FIRST.exec(text);
  const b = DAY_FIRST.exec(text);
  if (!a && !b) return { ok: false, reason: "none" };

  let month: number;
  let day: number;
  let yearText: string | undefined;
  if (a && (!b || a.index <= b.index)) {
    month = monthIndex(a[1]);
    day = Number(a[2]);
    yearText = a[3];
  } else {
    // b is set here because a is missing or starts later
    month = monthIndex(b![2]);
    day = Number(b![1]);
    yearText = b![3];
  }

  if (yearText !== undefined) {
    const year = Number(yearText);
    return isRealDate(year, month, day)
      ? { ok: true, date: toIso(year, month, day) }
      : { ok: false, reason: "impossible" };
  }

  // No year: the next time this date happens on or after today.
  // Trying 9 years in a row also finds the next Feb 29.
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());
  for (let year = today.getFullYear(); year <= today.getFullYear() + 8; year++) {
    if (isRealDate(year, month, day) && dayKey(year, month, day) >= todayKey) {
      return { ok: true, date: toIso(year, month, day) };
    }
  }
  return { ok: false, reason: "impossible" };
}

// ---------- Saving (the only code that writes) ----------

/**
 * Add a note. Never throws. Unreadable stored entries are kept exactly as they were;
 * if the whole stored value is unreadable, a backup copy is made before it is replaced.
 */
export function addNote(note: Note): { ok: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let next: unknown = null;

    if (raw === null) {
      next = { version: 1, notes: [note] };
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }
      const obj = parsed as { version?: unknown; notes?: unknown } | null | undefined;
      if (
        typeof obj === "object" &&
        obj !== null &&
        obj.version === 1 &&
        Array.isArray(obj.notes)
      ) {
        // Keep every stored item as is, even ones we cannot read.
        next = { ...obj, version: 1, notes: [...obj.notes, note] };
      } else {
        // Whole value unreadable (or a newer version): back it up first, then replace.
        localStorage.setItem(`${STORAGE_KEY}.backup-${note.savedAt}`, raw);
        next = { version: 1, notes: [note] };
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGED_EVENT));
    return { ok: true };
  } catch {
    // Storage full or unavailable. If the backup write threw, we never reach the replace.
    return { ok: false };
  }
}
