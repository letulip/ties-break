// SUCCESSION S2e (06.10) – THE CAREER'S START YEAR, FOR EVERY DATE THE UI PRINTS. docs/specs/succession-2026-10.md §2 «The calendar».
//
// S1 made `startYear` an optional LAST argument of every year-dependent date call (shared/dates.ts) and put it on `Snapshot`; a call that
// leaves it out answers 2031, which is right for every generation-1 career and WRONG for a 2048-born generation-2 one. This is the one
// place the UI reads it from, so a screen writes `weekLabel(week, startYear)` and never asks where the year came from.
//
// ⚠ IT READS THE STORE'S SNAPSHOT, NOT A PROP. The store is the single career the player is in; a screen that took the year from a prop
// could be handed a different one than the snapshot it renders. And ⚠ IT ANSWERS 2031 WHEN THERE IS NO STORE OR NO SNAPSHOT YET –
// a dialog mounted alone under test, or the boot screen, must keep printing what it always printed. `useGameStore()` THROWS with no
// active Pinia, which is why it sits in a try: the alternative, `getActivePinia()`, answers without throwing but makes Vue warn
// «injection "Symbol(pinia)" not found» on every mount that activated a Pinia without installing it – the way most component tests do.
//
// A `ComputedRef` on purpose: a template unwraps it (`{{ weekLabel(w, startYear) }}`), a script writes `startYear.value`, and a career
// switch (a different snapshot in the store) re-labels every screen without a remount.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { DEFAULT_START_YEAR } from '../shared/dates'

export function useStartYear(): ComputedRef<number> {
  let game: ReturnType<typeof useGameStore> | null = null
  try {
    game = useGameStore()
  } catch {
    game = null
  }
  return computed(() => game?.snapshot?.startYear ?? DEFAULT_START_YEAR)
}
