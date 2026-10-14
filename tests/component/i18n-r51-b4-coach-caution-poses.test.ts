// r51 №7 (13.10), SECOND HALF of tests/component/i18n-r51-b4-coach-caution.test.ts – cut 14.10 under the radar law (scripts/units.mjs). The one file measured 26.0 s solo (21.1 s on a quiet machine) and 42.6–49.0 s inside the whole component run – about 61 s projected on the 2-core CI runner (×2.35), on birpc's 60 s wall. Solo, warm, the halves measure 7.8 s (the original) and 14.9 s (this file): the cut is lopsided because this ONE describe is 13.4 of the file's 19.5 s of test bodies, and a table is not split across files.
// THAT FILE'S HEADER DESCRIBES BOTH HALVES. This one carries its second bullet – «TEN REFS on one surface», each of the engine's sentences posed onto a real card and read on Season's card – and nothing else of it; the other three stay there.
// The Russian catalog, `expectedRu`, the engine's own card, `posed` and the lifecycle are tests/helpers/coachCautionSurfaces.ts's, shared with the original. ⚠ NO CYRILLIC IS TYPED HERE, as there.
import { describe, expect, it } from 'vitest'
import { coachEntryLineRef, coachLadderNoteRef } from '../../src/engine/world/coachMarket'
import { TIERS } from '../../src/engine/season/calendar'
import type { CopyRef } from '../../src/shared/i18n'
import { mountSeason } from '../helpers/mountSeason'
import { aheadPose, bookPose, outgrownPose, paysPose, shutPose, type Pose } from '../helpers/coachCautionPoses'
import { aheadCard, cardOf, expectedRu, inRussian, LATIN_WORD, namesIn, posed, useCautionLifecycle, withoutNames } from '../helpers/coachCautionSurfaces'
import { FLOOR } from '../helpers/r41EntryWarning'

useCautionLifecycle()

describe('every sentence the engine can say, posed onto a real card, on Season\'s card', () => {
  const ladder = (pose: Pose): CopyRef => coachLadderNoteRef(pose.world, pose.event, 'elite')!
  const POSE_REFS: Array<[string, () => CopyRef]> = [
    ['empty – she would not be taken', () => coachEntryLineRef('national', FLOOR - 6)],
    ['skip this one', () => coachEntryLineRef('national', FLOOR - 1)],
    ['a week short', () => coachEntryLineRef('national', FLOOR)],
    ['the better one is on this week, she has outgrown this', () => ladder(outgrownPose())],
    ['the better one is on this week, this pays another table', () => ladder(paysPose())],
    ['the better one is on this week, this will not move anything', () => ladder(shutPose())],
    ['even a title here would not move her ranking', () => ladder(bookPose())],
    ['save her for it, a few weeks on', () => ladder(aheadPose(3))],
    ['save her for it, next week', () => ladder(aheadPose(1))],
  ]

  it('the denominator: nine poses, nine distinct refs, ten distinct keys between them', () => {
    const refs = POSE_REFS.map(([, make]) => make())
    expect(new Set(refs.map((r) => JSON.stringify(r))).size).toBe(9)
    const keys = new Set<string>()
    const walk = (c: CopyRef): void => {
      keys.add(c.k)
      for (const h of c.p ?? []) if (typeof h === 'object' && h !== null) walk(h)
    }
    refs.forEach(walk)
    expect(keys.size, 'eight sentences and the two counted tails').toBe(10)
  })

  it.each(POSE_REFS)('%s', async (_name, make) => {
    await inRussian()
    const { snap, card } = aheadCard()
    const ref = make()
    const w = mountSeason(posed(snap, card.id, ref))
    const text = cardOf(w, TIERS[card.tier].label).find('.coach-note').text()
    w.unmount()
    expect(text).toBe(expectedRu(ref))
    expect(withoutNames(text, namesIn(ref))).not.toMatch(LATIN_WORD)
  })
})
