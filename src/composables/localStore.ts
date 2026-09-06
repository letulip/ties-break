// ⚠⚠ U-07 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – WEB STORAGE, ASKED IN A
// WAY THAT CANNOT THROW.
//
// A browser that blocks site data throws `SecurityError` on the PROPERTY ACCESS itself, not on the
// call – so `localStorage.getItem(k)` throws before `getItem` is ever reached, and there is no `?.`
// that helps. In a `<script setup>` or at the top of a composable that is an exception during setup:
// the component does not render at all, and on the app's first screen that is a blank career.
//
// Every other reader in the app already wraps its own access (`weekRecap.ts`, `dayCross.ts`,
// `inboxCue.ts`, `matchDefaults.ts`, `audio/sfx.ts`, `audio/haptics.ts`, `audio/music.ts` – eight
// hand-rolled try/catches, each with its own default). This module is the shared spelling of the
// same guard, so the ninth is not written by hand; the eight migrate on touch rather than in a sweep
// nobody asked for.
//
// ⚠ SWALLOWING IS THE CORRECT BEHAVIOUR HERE AND IT IS A DECISION, not laziness. Everything this app
// keeps in web storage is a PREFERENCE or a one-shot mark – the sound switches, the day-cross pace,
// whether a callout has been seen. A career lives in IndexedDB and reaches the UI as a `Snapshot`,
// never through here (invariant 1), so nothing a player would call progress can be lost by a read
// that answers "nothing" or a write that goes nowhere. The cost of a failure is that a preference
// does not persist for the session; the cost of letting it throw is the screen.

/** The value at `key`, or null when web storage cannot be reached at all. */
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Write `value` at `key` if web storage will take it. Silent when it will not – see the header. */
export function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable or full – the preference holds for this session and does not persist */
  }
}
