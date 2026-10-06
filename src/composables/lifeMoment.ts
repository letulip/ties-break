// ⭐⭐ ROUND 46 #11c – WHEN THE FULL-SCREEN MOMENT MAY BE ON SCREEN, and the one record of «already shown».
//
// The owner, round 46 #11 (05.10, verbatim): «Я дождался свадьбы, но самого экрана этого события не было!
// Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать оверлей на
// весь экран, например.» The moment itself is the engine's (`lifeMomentOf`, handed over on
// `snapshot.lifeMoment`); this file answers the two questions that are the UI's: is something more urgent
// already up, and has the player already pressed Continue on this one.
//
// ⚠ IT IS NOT IN `blockingOverlay`'s LIST AND MUST NOT BE – the soft beat's and the tour briefing's own reason.
// That list answers «which question is the engine waiting on», and the engine is waiting on nothing here: the
// day has already happened. So the moment waits BEHIND that list (`blockingOverlay(...) === null`) – a birthday
// or a life beat in the same week is answered first and the moment follows it, never two dialogs trapping one
// keyboard – and behind a tournament takeover or a live friendly through the shared `popupMayShow` rule, like
// every other report.
//
// ⚠ DISMISSAL IS IN MEMORY AND KEYED BY KIND AND WEEK, never persisted. A moment is shown once for the week it
// landed in, and the next week the engine simply stops handing it over, so there is nothing to migrate and
// nothing to forget. The one honest limit: a reload inside the SAME week shows it once more.
import { computed, ref, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { blockingOverlay, popupMayShow } from './blockingOverlay'
import type { LifeMoment, Snapshot } from '../shared/protocol'

/** `kind:week` of the moment the player last pressed Continue on, or null. Module-level on purpose, so it
 *  survives the App's `v-if` unmounting and remounting the overlay. */
const dismissedKey = ref<string | null>(null)

export function momentKey(m: Pick<LifeMoment, 'kind' | 'week'>): string {
  return `${m.kind}:${m.week}`
}

/** The pure gate App.vue asks: is there a moment, not yet dismissed, with no blocking question ahead of it and
 *  the screen not mid-sentence. App.vue adds the two report popups that are its own locals. */
export function lifeMomentMayShow(snapshot: Snapshot | null, liveMatch = false): boolean {
  const m = snapshot?.lifeMoment ?? null
  if (m === null || dismissedKey.value === momentKey(m)) return false
  if (blockingOverlay(snapshot) !== null) return false
  return popupMayShow('life-moment', snapshot, liveMatch)
}

/** What the overlay renders: the snapshot's moment unless it has been dismissed, and the one way to dismiss. */
export function useLifeMoment(): { moment: ComputedRef<LifeMoment | null>; dismiss: () => void } {
  const game = useGameStore()
  const moment = computed(() => {
    const m = game.snapshot?.lifeMoment ?? null
    return m !== null && dismissedKey.value !== momentKey(m) ? m : null
  })
  function dismiss(): void {
    const m = game.snapshot?.lifeMoment ?? null
    if (m !== null) dismissedKey.value = momentKey(m)
  }
  return { moment, dismiss }
}

/** Test seam: the record is module state, so a mounted test resets it between cases. */
export function resetLifeMomentForTests(): void {
  dismissedKey.value = null
}
