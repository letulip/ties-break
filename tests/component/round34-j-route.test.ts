// ⭐⭐ ROUND 34 #1 – «СОВЕРШЕННО НЕПОНЯТНО КАК ВЫЙТИ В J УРОВЕНЬ», ANSWERED ON SCREEN.
// ⚠⚠ RE-AIMED AT ROUND 42 ITEM 7 (15.09.2026) – THE FIRST TWO SENTENCES ARE NOW FIXED, NOT ANSWERED.
//
// His full report is three sentences and they are not one complaint (docs/rounds/round-34.md #1).
// The first two are a question, and the measurement answered them: her national points really did
// zero at the season boundary (`WINDOW_BY_TRACK.domestic === 'seasonToDate'`, his own round-23
// ruling), and the Regional/National gates really did re-close with them, because the floor is read
// live off that total. Round 34 could fix neither on its own – the race was approved and the gate was
// balance – so it fixed the third sentence and filed the other two for him.
//
// ⭐ HE RULED THEM IN ROUND 42 #7, asked twice («второй раз пишу»), by naming the mechanism: «тот же
// механизм — окно в 52 недели и выбираем лучшие 6 результатов, окно "ползет"». The domestic table is
// rolling-52 now, so the zeroing is gone and the gates hold by arithmetic. What survives here is the
// THIRD sentence's fix and the mechanism that made it cheap to re-rule: the guide's `Opens at` cell
// is DERIVED from `WINDOW_BY_TRACK`, so a window ruling edits the screen without a template touched.
// The arms below assert that derivation in both directions.
//
// THE THIRD SENTENCE IS THE ONE THAT IS THIS ROUND'S TO FIX, and it is presentational: the route to
// the Junior Tour is J30's floor of 250 national points, and until now no surface said that those
// 250 have to be earned INSIDE ONE SEASON. Measured on a real career (tools/r34-domestic-reset.ts):
// she reached 106 by week 51, read 0 on week 52, and did not cross 250 until week 77 of the next
// season. A parent adding this season's points to last season's is planning against a total that
// does not exist – which is exactly «непонятно как выйти».
//
// ⚠ THE SURFACE IS THE TOUR GUIDE, and it is not a new one. Its own header says it exists so the
// player can read «what do I need to earn to get there» off one screen, and its `Opens at` column is
// `tierOpensWhen` – the ONE derivation of a rung's gate, shared with the locked plaque. So the
// sentence lands where a player already goes to ask the question, and it lands in every surface that
// asks the same function, rather than being written into a template.
//
// ⚠ MOUNTED, NOT PINNED. A source pin on `tierOpensWhen` would prove the string exists and nothing
// about it reaching a screen; this renders the real component against a real world and reads the
// cell. Mutation-verified: dropping the `WINDOW_BY_TRACK` clause from `tierOpensWhen` reddens the
// first arm, and hardcoding it (instead of deriving) reddens the third.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TierGuide from '../../src/components/TierGuide.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  skipTournament,
  closeTournament,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { WINDOW_BY_TRACK } from '../../src/engine/season/ranking'

function walk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** The guide, over a real career, with the row for one rung read back as its cells. */
function guideRow(label: string): string[] {
  const wrapper = mount(TierGuide, { global: { stubs: { teleport: true } } })
  const row = wrapper
    .findAll('tbody tr')
    .find((r) => r.findAll('td')[0]?.text().startsWith(label))
  expect(row, `the guide's «${label}» row`).toBeTruthy()
  const cells = row!.findAll('td').map((c) => c.text())
  wrapper.unmount()
  return cells
}

describe('round 42 #7 – the route to the Junior Tour is stated on screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useGameStore().snapshot = toSnapshot(walk('r34-j-route', 20))
  })

  it('⭐⭐ the tour guide says the J30 floor is 250 national points, with no season clause', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «250 national points IN ONE SEASON»). Round 34 #1 added the
    // clause because the domestic table was a season race; his 15.09 ruling puts that table on the
    // rolling 52-week window («тот же механизм ... окно "ползет"»), so the 250 carries across a
    // boundary and the clause is now the false half of the sentence.
    const cells = guideRow(TIERS.j30.label)
    // Column 1 is `Opens at` – the whole gate, in one sentence, off `tierOpensWhen`.
    const opensAt = cells[1]
    expect(opensAt, 'the number was always there').toContain('250 national pts')
    expect(opensAt, 'the window no longer restarts, so the clause must be gone').not.toContain('in one season')
    // ...and the age clause it has always carried is untouched, so the ruling took exactly one
    // condition off this sentence and left the rest of it alone.
    expect(opensAt).toContain(`age ${TIERS.j30.minAgeYears}`)
  })

  it('the domestic rungs beneath it say the same thing, because they are the same table', () => {
    // Regional and National are where the 250 is actually earned – so a parent reading the route
    // upward finds the same rule on every rung of it. Local has no floor and says nothing.
    // ⚠ RE-AIMED with the rung above: the shared fact is now the ABSENCE of the clause, and it has to
    // be shared for exactly the reason it had to be shared when it was present.
    expect(guideRow(TIERS.regional.label)[1]).not.toContain('in one season')
    expect(guideRow(TIERS.regional.label)[1]).toContain(`${TIERS.regional.enterPointBand[0]} national pts`)
    expect(guideRow(TIERS.national.label)[1]).not.toContain('in one season')
    expect(guideRow(TIERS.national.label)[1]).toContain(`${TIERS.national.enterPointBand[0]} national pts`)
    expect(guideRow(TIERS.local.label)[1]).toBe('open from the start')
  })

  it('⚠ and the professional on-ramp reads the same rule – its 120 points roll 52 weeks too', () => {
    // The clause was a fact about a TABLE, and the two tables now agree about their window. This is
    // still the arm that fails if somebody writes a window clause into the template rather than
    // deriving it: a hand-written sentence would not have moved when the constant did.
    expect(WINDOW_BY_TRACK.itf).toBe('rolling52')
    const opensAt = guideRow(TIERS.w15.label)[1]
    expect(opensAt).toContain('120 international pts')
    expect(opensAt).not.toContain('in one season')
  })

  it('⚠ and it is DERIVED, proved by mutation on the real screen rather than on the helper', () => {
    // ⭐ ROUND 42 #7's OWN ARM. `tests/round34-ladder-plaques.test.ts` proves `tierOpensWhen` reads
    // the constant; this proves THE GUIDE does, through a real mount and the real cascade. Patch the
    // window back to the round-23 rule and the clause returns to the cell with no template touched –
    // which is the property that made this ruling a one-constant change instead of a copy edit, and
    // the property the file's own header claims ("hardcoding it reddens the third").
    const kept = WINDOW_BY_TRACK.domestic
    try {
      WINDOW_BY_TRACK.domestic = 'seasonToDate'
      expect(guideRow(TIERS.j30.label)[1]).toContain('in one season')
      expect(guideRow(TIERS.w15.label)[1], 'the ITF-denominated rung must not follow').not.toContain('in one season')
    } finally {
      WINDOW_BY_TRACK.domestic = kept
    }
    expect(guideRow(TIERS.j30.label)[1]).not.toContain('in one season')
  })

  it('⚠ the acceptance rungs are untouched – their gate is a position and has no window at all', () => {
    for (const label of [TIERS.j60.label, TIERS.j300.label, TIERS.w35.label, TIERS.slam.label]) {
      const opensAt = guideRow(label)[1]
      expect(opensAt, label).toMatch(/internationally/)
      expect(opensAt, label).not.toContain('in one season')
    }
  })
})
