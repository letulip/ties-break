// ⭐ round 46 R2 (ledger 23, secondary) – `ageWindowStartWeek`'S MEMO IS KEYED BY EVERYTHING THE AGE CLOCK READS.
//
// ⚠ WHAT WAS WRONG. The memo's key was `birthMonth:week`, on the stated ground that `kidAgeAt` «reads nothing
// else off the world». It does: since the birthday-to-birthday clock (P2) `kidAgeAt` reads `birthDay` as well,
// so two careers born in the SAME MONTH on DIFFERENT DAYS shared one cache entry per week, and the second one
// was handed the first one's window. The two clocks disagree on the few weeks between the two birthdays, and
// on those weeks the answers are a whole year apart. One career per browser worker hides it; the fixture
// generator (hundreds of careers in ONE process) and every test file that walks several worlds do not – and
// there it made a career's trajectory depend on which careers had been walked before it.
//
// ⚠ THE ORACLE IS THE SAME BACKWARD SCAN WITHOUT THE MEMO, and the corpus is built so the claim cannot pass
// vacuously: the test first asserts that the two clocks really DO disagree on some weeks, then asks the first
// career (filling the memo) and the second (which must not read it). Run against the old key it is red.
import { describe, it, expect } from 'vitest'
import { ageWindowStartWeek, kidAgeAt } from '../src/engine/world/age'
import type { WorldState } from '../src/engine/world/state'

/** Only `profile.birthMonth` / `profile.birthDay` are read by the two functions under test. */
function bornOn(birthMonth: number, birthDay: number): WorldState {
  return { profile: { birthMonth, birthDay } } as unknown as WorldState
}

/** The scan `ageWindowStartWeek` memoises, spelled out without the memo. */
function windowStartScan(world: WorldState, week: number): number {
  const age = kidAgeAt(world, week)
  let from = Math.floor(week)
  while (from > 0 && kidAgeAt(world, from - 1) === age) from--
  return from
}

/** Weeks, from the second year on, where the two birthdays put the window start in different places. */
function disagreeing(a: WorldState, b: WorldState): number[] {
  const out: number[] = []
  for (let w = 60; w < 420; w++) if (windowStartScan(a, w) !== windowStartScan(b, w)) out.push(w)
  return out
}

describe('ageWindowStartWeek – two careers in one process never share a window', () => {
  it('born in the same month on different days: the second career gets its own answer, in either order', () => {
    // Months/days chosen for THIS test alone, so no other file's world has already filled these entries.
    const early = bornOn(9, 2)
    const late = bornOn(9, 28)
    const weeks = disagreeing(early, late)
    expect(weeks.length, 'the two birthdays must put the window start in different places on some weeks, or this proves nothing')
      .toBeGreaterThan(0)

    // The first career asks (and fills the memo) on every week that matters; the second must not be handed it.
    for (const w of weeks) expect(ageWindowStartWeek(early, w), `early, week ${w}`).toBe(windowStartScan(early, w))
    for (const w of weeks) {
      expect(ageWindowStartWeek(late, w), `late, week ${w}: it must not read the early career's cached window`)
        .toBe(windowStartScan(late, w))
    }
  })

  it('and the other way round – the later birthday filling the memo first does not poison the earlier one', () => {
    const early = bornOn(4, 3)
    const late = bornOn(4, 27)
    const weeks = disagreeing(early, late)
    expect(weeks.length, 'the corpus must contain disagreeing weeks').toBeGreaterThan(0)
    for (const w of weeks) expect(ageWindowStartWeek(late, w), `late, week ${w}`).toBe(windowStartScan(late, w))
    for (const w of weeks) {
      expect(ageWindowStartWeek(early, w), `early, week ${w}: it must not read the late career's cached window`)
        .toBe(windowStartScan(early, w))
    }
  })
})
