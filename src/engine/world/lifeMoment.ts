// ⭐⭐ ROUND 46 #11c – THE BIG DAYS THAT GET A SCREEN: the wedding and the birth.
//
// The owner, round 46 #11 (05.10, verbatim): «Я дождался свадьбы, но самого экрана этого события не было!
// Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать оверлей на
// весь экран, например.»
//
// WHAT WAS WRONG: `landWedding` and `landBirth` resolve as a feed line plus an album milestone – a SILENT
// resolution – so a wedding day passed as one more row, though the bride painting has been on disk since the
// art set shipped. The funeral and the two announcement cards (`'engaged'`, `'expecting'`) are life BEATS and
// already have a card (`LifeBeatDialog`, the funeral with its painting); only the DAYS themselves had none.
//
// ⚠ DERIVED, NEVER STORED: the milestone ledger already says on which week each day landed, and a day is
// «this week's moment» exactly when that week is the world's current week – so no new field exists to migrate,
// no schema moves, and a reload in the same week re-derives the same moment. The line is the FEED'S OWN kept
// text for the day (found by the milestone's identity), so the screen and the feed cannot say different things
// and not one new sentence is written here; the painting's KIND is `MEMORY_EMOTION`'s own (the album's table),
// and the view resolves the band (`portraitUrl`), the seam `LifeBeatDialog`'s `BEAT_FACE` documents.
// ⚠ A MOMENT WITHOUT ITS LINE IS NO MOMENT: if the feed row is gone the function answers null rather than
// showing a picture with nothing to say. Pure: zero draws, no writes.
import { MEMORY_EMOTION, milestoneKey } from '../diary/facts'
import type { LifeMoment } from '../../shared/protocol/narrative'
import { LIFE_MOMENT_CONFIRM } from './lifeMomentCopy'
import type { WorldState } from './state'

/** Which milestone types are a day worth a screen, in the order that wins when two land in one week (the rarer
 *  first). The funeral is not here on purpose: bereavement is a blocking life beat with its own card. */
const MOMENT_TYPES = ['wedding', 'birth'] as const

export function lifeMomentOf(world: WorldState): LifeMoment | null {
  for (const type of MOMENT_TYPES) {
    const m = world.milestones.find((x) => x.type === type && x.week === world.week)
    if (m === undefined) continue
    const key = milestoneKey(m)
    const event = world.events.find((e) => e.milestoneKey === key)
    if (event === undefined) continue
    return { kind: type, week: m.week, face: MEMORY_EMOTION[type], line: event.text, confirm: LIFE_MOMENT_CONFIRM }
  }
  return null
}
