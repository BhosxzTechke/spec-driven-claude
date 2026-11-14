"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { addNote, findDate, parseNotes, readRaw, subscribe, type Note } from "./notes";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-15" -> "Nov 15, 2026". Plain lookup, so server and browser always agree.
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export default function Home() {
  // undefined = not read yet (server and first render agree, so no hydration error and no empty-state flash).
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, readRaw, () => undefined);
  // Notes that could not be saved to storage; kept for this visit only.
  const [unsaved, setUnsaved] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const loaded = raw !== undefined;
  const notes = useMemo(() => {
    // Stored order is saved order; sort is stable, so same-date notes keep saved order.
    return [...parseNotes(raw ?? null), ...unsaved].sort((a, b) => a.date.localeCompare(b.date));
  }, [raw, unsaved]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setMessage("Please type a note first.");
      return;
    }
    const found = findDate(trimmed, new Date());
    if (!found.ok) {
      setMessage(
        found.reason === "none"
          ? "Please include a date, like Nov 15."
          : "That date isn't a real date. Please check it.",
      );
      return;
    }
    const note: Note = { text: trimmed, date: found.date, savedAt: Date.now() };
    if (addNote(note).ok) {
      setMessage("");
    } else {
      setUnsaved((u) => [...u, note]);
      setMessage("Couldn't save. Your notes may not be kept after you leave this page.");
    }
    setText("");
  }

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Upcoming</h1>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="note" className="sr-only">
          Note with a date
        </label>
        <input
          id="note"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="bayad kuryente sa Nov 15"
          className="min-w-0 flex-1 rounded border border-zinc-400 bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 font-medium text-background"
        >
          Save
        </button>
      </form>
      <p role="alert" className="mt-2 min-h-6 text-sm text-red-600 dark:text-red-400">
        {message}
      </p>

      {loaded &&
        (notes.length === 0 ? (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Nothing upcoming yet. Add a note with a date above.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {notes.map((n, i) => (
              <li key={`${n.savedAt}-${i}`} className="rounded border border-zinc-300 p-3 dark:border-zinc-700">
                <p className="break-words">{n.text}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDate(n.date)}</p>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
