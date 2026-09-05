// ⭐⭐ THE EVENTS SHE IS ENTERED FOR – one predicate, round 36 phase 6.
//
// `snapshot.upcoming` carries every event in the open window; the ones she has COMMITTED TO are the
// rows with `entered: true`, and that is the whole rule. It is one line, and one line is exactly the
// kind of derivation that gets copied: it was already written out three times before this file
// existed – `SeasonScreen.vue`'s «My entries» strip, `HomeScreen`/`ThisWeekScreen`'s `nearestEntered`
// (the same filter with a `find`), and `art/autoPreload.ts`'s preload key.
//
// It moved here because the owner's rail dashboard now carries a «My entries» card on every page:
//
//     «карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске»
//
// ⚠ A CARD THAT RE-DERIVED THE LIST WOULD BE A FOURTH COPY, and a rail that disagreed with the
// screen it is a shortcut TO is the worst version of this defect: the two are on screen at the same
// time on a desktop. So the strip and the card call the same function, and a mutation to the
// predicate below moves both.
//
// ⚠ A PURE FUNCTION AND NOT A COMPOSABLE, deliberately. `SeasonScreen` already holds its own
// `upcoming` computed (it filters and groups the same array four other ways); handing it a second
// store reader would be a second subscription to the same field. The rail card passes the snapshot's
// array straight in.
import type { UpcomingEvent } from '../shared/protocol'

/** The events she has committed to, in the snapshot's own order (which is by week). */
export function enteredEvents(upcoming: readonly UpcomingEvent[]): UpcomingEvent[] {
  return upcoming.filter((e) => e.entered)
}
