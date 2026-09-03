// ⭐⭐ ROUND 34 #1 – «СОВЕРШЕННО НЕПОНЯТНО КАК ВЫЙТИ В J УРОВЕНЬ», ANSWERED ON SCREEN.
//
// His full report is three sentences and they are not one complaint (docs/rounds/round-34.md #1).
// The first two are a question, and the measurement answers them: her national points really do
// zero at the season boundary (`WINDOW_BY_TRACK.domestic === 'seasonToDate'`, his own round-23
// ruling), and the Regional/National gates really do re-close with them, because the floor is read
// live off that season-to-date total. Neither is a defect this round may fix on its own – the race
// is approved and the gate is balance.
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

describe('round 34 #1 – the route to the Junior Tour is stated on screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useGameStore().snapshot = toSnapshot(walk('r34-j-route', 20))
  })

  it('⭐⭐ the tour guide says the J30 floor is 250 national points IN ONE SEASON', () => {
    const cells = guideRow(TIERS.j30.label)
    // Column 1 is `Opens at` – the whole gate, in one sentence, off `tierOpensWhen`.
    const opensAt = cells[1]
    expect(opensAt, 'the number was always there').toContain('250 national pts')
    expect(opensAt, 'the window it is counted over was not').toContain('in one season')
    // ...and the age clause it has always carried is untouched, so this ADDS a condition rather
    // than replacing one.
    expect(opensAt).toContain(`age ${TIERS.j30.minAgeYears}`)
  })

  it('the domestic rungs beneath it say the same thing, because they are the same table', () => {
    // Regional and National are where the 250 is actually earned – so a parent reading the route
    // upward finds the same rule on every rung of it. Local has no floor and says nothing.
    expect(guideRow(TIERS.regional.label)[1]).toContain('in one season')
    expect(guideRow(TIERS.national.label)[1]).toContain('in one season')
    expect(guideRow(TIERS.local.label)[1]).toBe('open from the start')
  })

  it('⚠ and the professional on-ramp does NOT – its 120 points roll 52 weeks and genuinely carry over', () => {
    // The clause is a fact about a TABLE, so it must not spread to the rung whose band is counted in
    // the other one. This is the arm that fails if somebody appends the words in the template.
    expect(WINDOW_BY_TRACK.itf).toBe('rolling52')
    const opensAt = guideRow(TIERS.w15.label)[1]
    expect(opensAt).toContain('120 international pts')
    expect(opensAt).not.toContain('in one season')
  })

  it('⚠ the acceptance rungs are untouched – their gate is a position and has no window at all', () => {
    for (const label of [TIERS.j60.label, TIERS.j300.label, TIERS.w35.label, TIERS.slam.label]) {
      const opensAt = guideRow(label)[1]
      expect(opensAt, label).toMatch(/internationally/)
      expect(opensAt, label).not.toContain('in one season')
    }
  })
})
