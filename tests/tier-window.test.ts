import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { hiddenTier, preferredWeekEvent, type OnRampLatches } from '../src/composables/tierState'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { createWorld, toSnapshot } from '../src/engine/world'
import type { TierId } from '../src/engine/season/types'

// =================================================================================================
// R15-9 — THE SLIDING TIER WINDOW, and the stacked-week pick that rode in with it.
//
// Owner, 01.08: «если j30 уже точно outgrown, то его не надо показывать. Скользящее окно... Я
// сомневаюсь, что реальные теннисистки с доступом к w15 думают как бы им успеть на j30» — and, on
// the feed: he had never seen a J300 card, and «Вот local я в ленте не вижу».
//
// TWO DISTINCT DEFECTS, both fixed through one module (composables/tierState.ts):
//   1. VISIBILITY. The outgrown filter is points-based and the on-ramp rungs have MAX ceilings, so
//      J30 stayed on a professional's calendar for ever. The window hides rungs by the LATCH.
//   2. THE STACKED WEEK. SeasonScreen's row map was last-write-wins over a list that orders each
//      week strongest-first, so the row always showed the WEAKEST tier of a stacked week and the
//      rare rungs never surfaced. The pick is now a rule: entered first, then the highest rung.
// =================================================================================================

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('the visibility rule, against every latch state', () => {
  const LATCH_STATES: (OnRampLatches | undefined)[] = [
    undefined,
    { itf: false, wta: false },
    { itf: true, wta: false },
    { itf: false, wta: true },
    { itf: true, wta: true },
  ]

  it('hides exactly the rungs below a crossed door, and nothing before it is crossed', () => {
    // Nothing latched (or no snapshot at all): the whole ladder shows.
    for (const latches of [undefined, { itf: false, wta: false }] as const) {
      for (const tier of TIER_LADDER) expect(hiddenTier(tier, latches), `${tier} unlatched`).toBe(false)
    }
    // The international door crossed: the two club rungs leave; the junior tour itself stays.
    const itf = { itf: true, wta: false }
    expect(hiddenTier('local', itf)).toBe(true)
    expect(hiddenTier('regional', itf)).toBe(true)
    for (const tier of ['j30', 'j60', 'j300', 'w15', 'w35', 'w100'] as TierId[]) {
      expect(hiddenTier(tier, itf), tier).toBe(false)
    }
    // The professional door crossed too: j30 leaves with them; the rungs above never hide.
    const wta = { itf: true, wta: true }
    expect(hiddenTier('j30', wta)).toBe(true)
    for (const tier of ['j60', 'j300', 'w15', 'w35', 'w100'] as TierId[]) {
      expect(hiddenTier(tier, wta), tier).toBe(false)
    }
  })

  it('⚠ NATIONAL IS NEVER HIDDEN, in any latch state there is', () => {
    // The exemption has a paying customer: the national-rung brand deal's keep-condition reads her
    // domestic top 30, so the one domestic rung that maintains that rank stays on the calendar
    // however far she has climbed. Swept over every state rather than the plausible ones.
    for (const latches of LATCH_STATES) {
      expect(hiddenTier('national', latches), JSON.stringify(latches)).toBe(false)
    }
    // ...and the source says so in words, so the next hand meets the reason before the edit.
    expect(read('../src/composables/tierState.ts')).toContain('NATIONAL IS NEVER HIDDEN')
  })

  it('visibility is not access: the engine never reads the window', () => {
    // The rule is a UI filter. `entryStatus` / `tierOpenFor` / the entry gates know nothing of it -
    // an event a latch hides is still, as far as the engine cares, hers to enter.
    expect(codeOf(read('../src/engine/world.ts'))).not.toContain('hiddenTier')
    expect(codeOf(read('../src/engine/season/calendar.ts'))).not.toContain('hiddenTier')
  })
})

describe('the stacked-week pick', () => {
  type E = { tier: TierId; entered: boolean; id: string }
  const ev = (tier: TierId, entered = false): E => ({ tier, entered, id: `${tier}${entered ? '+' : ''}` })

  it('prefers the highest tier, whatever order the list arrives in', () => {
    // The regression this pins: strongest-first input used to come out WEAKEST (last write won).
    expect(preferredWeekEvent([ev('j300'), ev('j30'), ev('local')])!.tier).toBe('j300')
    expect(preferredWeekEvent([ev('local'), ev('j30'), ev('j300')])!.tier).toBe('j300')
    expect(preferredWeekEvent([ev('w15'), ev('j300')])!.tier).toBe('w15')
  })

  it('an ENTERED event beats any tier – a committed week is the card she must act on', () => {
    expect(preferredWeekEvent([ev('j300'), ev('local', true)])!.id).toBe('local+')
    expect(preferredWeekEvent([ev('local', true), ev('j300')])!.id).toBe('local+')
  })

  it('is total: an empty week picks nothing', () => {
    expect(preferredWeekEvent([])).toBeNull()
  })
})

describe('the latches reach the UI on the snapshot, as a copy', () => {
  it('toSnapshot surfaces onRampCleared read-only', () => {
    const world = createWorld('tier-window-snap')
    const snap = toSnapshot(world)
    expect(snap.onRampCleared).toEqual({ itf: false, wta: false })
    // A copy, never a live view: the snapshot crosses the worker boundary.
    expect(snap.onRampCleared).not.toBe(world.onRampCleared)
    // ...and it follows the world's own latches, both set and unset.
    world.onRampCleared = { itf: true, wta: true }
    expect(toSnapshot(world).onRampCleared).toEqual({ itf: true, wta: true })
  })

  it('both consumers pick through the ONE rule', () => {
    // The Season rows and the Calendar look-ahead read the same two functions, which is what makes
    // "the two lists cannot disagree" a property rather than a hope. The last-write-wins map is
    // gone from the season screen for good.
    const season = codeOf(read('../src/components/screens/SeasonScreen.vue'))
    expect(season).toContain('hiddenTier(e.tier, game.snapshot?.onRampCleared)')
    expect(season).toContain('preferredWeekEvent(')
    expect(season).not.toContain('for (const e of visibleUpcoming.value) byWeek.set(e.week, e)')
    const days = codeOf(read('../src/composables/weekDays.ts'))
    expect(days).toContain('preferredWeekEvent(')
    expect(days).toContain('hiddenTier(e.tier, snap.onRampCleared)')
  })
})
