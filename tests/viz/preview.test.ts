import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildPreview, storeyOf, type PreviewInput, type Storey } from '../../src/viz/preview'
import { fastMatchProbability } from '../../src/engine/match/engine'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import type { TierId } from '../../src/engine/season/types'
import type { MatchPlayer, Surface } from '../../src/engine/match/types'

// THE PRE-MATCH PREVIEW (owner, 11.08). The thing being protected is not the wording - it is the
// LADDER: «чем ниже ступень - тем меньше информации ... но убирать совсем я бы всё-таки не стал».
// Thinner, never empty, and monotone. Everything below is a property of that rule.

const HER: MatchPlayer = {
  id: 'kid', name: 'Olivia Grant', serve: 54, ret: 52, composure: 48, stamina: 58, groundstrokes: 53, age: 15.4,
}
const OPP: MatchPlayer = {
  id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58, age: 17.8,
}

/** One preview, with everything but the thing under test held still. */
function preview(over: Partial<PreviewInput> = {}): string[] {
  const input: PreviewInput = {
    a: HER,
    b: OPP,
    heroSide: 0,
    surface: 'hard',
    tour: 'wta',
    heroRank: 120,
    oppRank: 61,
    event: { tier: 'j30', roundLabel: 'Quarterfinal' },
    temperatureC: 22,
    ...over,
  }
  return buildPreview(input).map((l) => l.text)
}

/** A rung from each storey, so "the ladder" is exercised end to end. */
const ONE_PER_STOREY: Record<Storey, TierId> = { 1: 'regional', 2: 'j300', 3: 'w50', 4: 'wta500' }

describe('preview – the ladder of voices', () => {
  it('⚠ IS MONOTONE: every storey says strictly more than the one below it', () => {
    // The owner's rule, and the one thing a player climbing the ladder is supposed to FEEL. Held at a
    // fixed round and fixed players so the only variable is the rung.
    const counts = ([1, 2, 3, 4] as Storey[]).map(
      (s) => preview({ event: { tier: ONE_PER_STOREY[s], roundLabel: 'Quarterfinal' } }).length,
    )
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i], `storey ${i + 1} (${counts[i]} lines) vs storey ${i} (${counts[i - 1]})`).toBeGreaterThan(
        counts[i - 1],
      )
    }
  })

  it('⚠ ...and it is monotone across EVERY rung on the ladder, not just one sample per storey', () => {
    // The sample above could be satisfied by a table that happened to be right at four points. This
    // walks all sixteen rungs in ladder order and requires the count never to fall.
    let last = 0
    for (const tier of TIER_LADDER) {
      const n = preview({ event: { tier, roundLabel: 'Quarterfinal' } }).length
      expect(n, `${tier} says less than the rung below it`).toBeGreaterThanOrEqual(last)
      last = n
    }
  })

  it('⚠ is NEVER EMPTY – not at the bottom rung, and not with no tournament at all', () => {
    // «убирать совсем я бы всё-таки не стал – это добавляет живости». The friendly and the sandbox
    // hit-out have no draw behind them, which is the case most likely to be quietly left blank.
    for (const tier of TIER_LADDER) {
      expect(preview({ event: { tier, roundLabel: 'Round of 32' } }).length, tier).toBeGreaterThanOrEqual(3)
    }
    expect(preview({ event: null }).length).toBeGreaterThanOrEqual(3)
    // ...and with nothing else known either: no ranks, no temperature, no ages.
    const bare = preview({
      event: null,
      heroRank: null,
      oppRank: null,
      temperatureC: null,
      a: { ...HER, age: undefined },
      b: { ...OPP, age: undefined },
    })
    expect(bare.length).toBeGreaterThanOrEqual(3)
    for (const line of bare) expect(line.length).toBeGreaterThan(10)
  })

  it('every rung lands on the storey its table says it does', () => {
    expect(TIER_LADDER.map(storeyOf)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4])
  })
})

describe('preview – what each storey may and may not say', () => {
  const NUMERIC_MATCH_DATA = /\d+%|pays \d+ points/

  it('⚠ the numbers start at storey 3 and never before it', () => {
    // §3's own words: storeys 1 and 2 are people, weather and the big moments - "still no stats".
    // A win probability and a points payout are exactly the stats that arrive with the W rungs.
    for (const tier of TIER_LADDER) {
      const lines = preview({ event: { tier, roundLabel: 'Semifinal' } }).join(' ')
      const hasNumbers = NUMERIC_MATCH_DATA.test(lines)
      expect(hasNumbers, `${tier} (storey ${storeyOf(tier)}): ${lines}`).toBe(storeyOf(tier) >= 3)
    }
  })

  it('the bottom storey gets the people, the weather and the ball-mark argument', () => {
    const onClay = preview({ event: { tier: 'local', roundLabel: 'Quarterfinal' }, surface: 'clay' }).join(' ')
    expect(onClay).toContain('Dana') // the girl across the net
    expect(onClay).toContain('22 degrees') // the weather
    expect(onClay).toContain('mark on the court') // the argument only unumpired tennis can have
    // ...and on a surface with no mark to inspect, the argument is the other one.
    const onHard = preview({ event: { tier: 'local', roundLabel: 'Quarterfinal' }, surface: 'hard' }).join(' ')
    expect(onHard).not.toContain('mark on the court')
    expect(onHard).toContain('call their own lines')
  })

  it('⚠ nobody is put in a chair who is not in one, and nobody is left out of one who is', () => {
    // The chair-umpire ladder is the sharpest real difference the junior research found, and it is
    // the one fact here that is FALSE if said at the wrong rung.
    const chairFor = (tier: TierId, roundLabel: string): string =>
      preview({ event: { tier, roundLabel } }).find((l) => /chair|Chair/.test(l)) ?? ''
    // Storey 1: nobody, ever.
    expect(chairFor('national', 'Final')).toContain('Nobody in the chair')
    // Storey 2: the lower Junior Tour rungs get one for the final; J300 from the semifinals.
    expect(chairFor('j30', 'Quarterfinal')).toContain('No chair umpire until the final')
    expect(chairFor('j30', 'Final')).toContain('in the seat for this one')
    expect(chairFor('j300', 'Quarterfinal')).toContain('No chair umpire until the semifinals')
    expect(chairFor('j300', 'Semifinal')).toContain('in the seat for this one')
    // Storey 3 and 4: always, and the top adds what is published.
    expect(chairFor('w50', 'Round of 32')).toContain('Chair umpire')
    expect(chairFor('wta1000', 'Round of 32')).toContain('Chair, review')
  })

  it('the weather survives all the way to the top – the ladder never subtracts', () => {
    for (const tier of TIER_LADDER) {
      expect(preview({ event: { tier, roundLabel: 'Final' } }).join(' '), tier).toContain('22 degrees')
    }
  })
})

describe('preview – honesty (it may assert nothing the game does not hold)', () => {
  it('⚠ her chance is the ENGINE\'s number, from HER side of the net', () => {
    const p = fastMatchProbability(HER, OPP, { surface: 'hard', tour: 'wta', seed: '' })
    const asA = preview({ heroSide: 0, event: { tier: 'w50', roundLabel: 'Final' } }).join(' ')
    expect(asA).toContain(`${Math.round(p * 100)}% chance`)
    // Swap which side she is and the number must flip with her, not stay put.
    const asB = preview({ heroSide: 1, a: OPP, b: HER, event: { tier: 'w50', roundLabel: 'Final' } }).join(' ')
    expect(asB).toContain(`${Math.round(p * 100)}% chance`)
    // ...and she is the underdog here, so it is not accidentally symmetric.
    expect(Math.round(p * 100)).toBeLessThan(50)
  })

  it('⚠ what the round pays is the tier\'s own table, read at the right finish', () => {
    // Winning the final is the title (finish 0); winning a semifinal guarantees a runner-up (1), and
    // so on. Off-by-one here would quote a player the wrong number for the trip she just took.
    for (const tier of ['w15', 'w100', 'wta250', 'slam'] as TierId[]) {
      const table = TIERS[tier].points
      const said = (round: string): string => preview({ event: { tier, roundLabel: round } }).join(' ')
      expect(said('Final'), `${tier} final`).toContain(`pays ${table[0]} points`)
      expect(said('Semifinal'), `${tier} semifinal`).toContain(`pays ${table[1]} points`)
      expect(said('Quarterfinal'), `${tier} quarterfinal`).toContain(`pays ${table[2]} points`)
    }
  })

  it('an unknown age or an unknown rank is a blank, never a guess', () => {
    const across = (opp: MatchPlayer): string =>
      preview({ b: opp, event: { tier: 'w50', roundLabel: 'Final' } }).find((l) => l.startsWith('Across the net')) ?? ''
    // Stated against the line that DOES know her age, so the assertion cannot pass by the age slot
    // having quietly moved somewhere else. (`\d\d` alone is not enough: "#61" is two digits.)
    expect(across(OPP), 'the age is said when it is known').toContain(', 17')
    const line = across({ ...OPP, age: undefined })
    expect(line).toContain('Dana')
    expect(line, 'an age was invented').not.toContain(', 17')
    expect(line, 'an age slot was left empty rather than dropped').not.toMatch(/,\s*,/)
    const noRank = preview({ oppRank: null, event: { tier: 'w50', roundLabel: 'Final' } }).join(' ')
    expect(noRank, 'a rank was invented').not.toContain('ranked #')
  })

  it('the standing line handles every combination of known and unknown ranks', () => {
    const at = (heroRank: number | null, oppRank: number | null): string =>
      preview({ heroRank, oppRank, event: { tier: 'wta500', roundLabel: 'Final' } }).join(' ')
    expect(at(88, 31)).toContain('#88 against #31')
    expect(at(31, 32)).toContain('one place between them')
    expect(at(50, 50)).toContain('level on the table')
    expect(at(null, 31)).toContain('unranked')
    expect(at(88, null)).toContain('no ranking at all')
    expect(at(null, null)).toContain('ranking to defend')
  })
})

describe('preview – copy rules and the fiction', () => {
  it('short dash only, no Cyrillic, and every line is a finished sentence', () => {
    for (const tier of TIER_LADDER) {
      for (const round of ['Round of 32', 'Quarterfinal', 'Semifinal', 'Final']) {
        for (const surface of ['hard', 'clay', 'grass'] as Surface[]) {
          for (const line of preview({ event: { tier, roundLabel: round }, surface })) {
            expect(line, 'player copy uses the short dash only').not.toContain('—')
            expect(line).not.toMatch(/[Ѐ-ӿ]/)
            expect(line.endsWith('.'), line).toBe(true)
            expect(line[0], line).toBe(line[0].toUpperCase())
            // A log row, not a paragraph - the same budget the commentary rows keep.
            expect(line.length, line).toBeLessThanOrEqual(120)
          }
        }
      }
    }
  })

  it('⚠ names no real tournament, tour body or venue', () => {
    // Tournament and organisation names are fictional (CLAUDE.md). Everything the preview can print
    // as an event name comes from TIERS' own labels, so this is really a check that no string in the
    // module smuggled one in.
    const src = readFileSync(new URL('../../src/viz/preview.ts', import.meta.url), 'utf8')
    for (const banned of ['Wimbledon', 'Roland', 'US Open', 'Australian Open', 'ITF', 'Flushing', 'Melbourne']) {
      expect(src, `${banned} is a real name`).not.toContain(banned)
    }
    // ...and the labels it does use are the ones the calendar owns.
    for (const tier of TIER_LADDER) {
      expect(preview({ event: { tier, roundLabel: 'Final' } })[0]).toContain(TIERS[tier].label)
    }
  })

  it('⚠ draws ZERO random numbers, like the commentary it sits beside', () => {
    // Behavioural, not a source grep: a preview must read the same every time it is opened, and it
    // is built at render time on a screen the player can leave and come back to.
    const real = Math.random
    Math.random = () => {
      throw new Error('the preview must not draw randomness')
    }
    try {
      expect(preview({ event: { tier: 'wta1000', roundLabel: 'Final' } }).length).toBeGreaterThan(0)
    } finally {
      Math.random = real
    }
  })

  it('the same inputs give the same preview, twice', () => {
    for (const tier of TIER_LADDER) {
      const one = preview({ event: { tier, roundLabel: 'Semifinal' } })
      expect(preview({ event: { tier, roundLabel: 'Semifinal' } })).toEqual(one)
    }
  })

  it('a label that is not a person keeps its whole name, as in the commentary', () => {
    // The sandbox exhibition opponent is literally called "Top seed".
    const lines = preview({ b: { ...OPP, name: 'Top seed' }, event: null }).join(' ')
    expect(lines).toContain('Top seed')
    expect(lines).not.toMatch(/\bTop\b(?! seed)/)
  })
})
