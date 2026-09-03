// ⭐⭐⭐ ROUND 34 #5 – THE PRE-DRAW FIGURE, AND THE ONE PROPERTY THAT MAKES IT WORTH SHIPPING.
//
// HIS ASK: «за 2 недели до турнира можно сняться бесплатно, но ты не знаешь шансов, а за неделю ты
// знаешь шансы, но сняться бесплатно нельзя. В итоге у тебя нет планирования… может общую цифру
// шанса на проход первого тура делать, но чтобы она всё-таки реальность отражала и не скакала от
// недели к неделе?»
//
// The complaint has two halves and only one is about accuracy. A forecast he cannot ACT on is
// trivia at any accuracy, because withdrawal stops being free at the same moment the number appears.
// So the figure has to exist while the decision is still open, and it has to HOLD STILL, or it is
// the same trivia one week earlier.
//
// ⚠⚠ THE CONTROL IS THE POINT OF THIS FILE. «It does not move» is only a claim about a measuring
// instrument until something measured with the same instrument DOES move – CLAUDE.md's own rule
// about null results. The control is the number this one replaces: the OPPONENT-based figure, which
// round 31 #4 was reported for («каждую неделю это другой турнир с другой соперницей») and whose
// swing the owner quoted as 80% becoming 54% two weeks later. Both arms come out of ONE
// `upcomingEvents` pass per week over the same career, so nothing here compares two worlds.
//
// ⚠ HOW THE CONTROL IS BUILT, and why it is EXACT rather than approximate. `previewEvent` names an
// opponent only inside `DRAW_LEAD_WEEKS`, so the pre-round-31 reading is recovered by moving the
// tracked event's WEEK forward in a COPY of `world.season`. That flips `drawMade` and nothing else:
// `drawnField` keys its sub-stream on the event's ID and reads only its TIER, `selectEntrants` never
// reads a week, `buildDraw` reads only `TIERS[tier].drawSize`, and `rivalConditions` is folded at
// `world.week`, which is untouched. ⚠ Non-W rungs only – `wtaExclusionFor` groups a week's W events,
// so moving a W event's week really would change its field.
//
// ⚠ MUTATION-VERIFIED – each applied alone, and the verdicts differ from one another, which is what
// says the arms are independent claims rather than one claim written three times:
//   * `fieldChance` folded over `drawnField`'s entrants instead of `tierExpectedField`'s – the
//     figure asked about THIS WEEK'S REDRAW – reddens the stability arm AND the one-reading arm (2);
//   * `fieldStrength` folded over `drawnField`'s entrants while the figure keeps the rung's –
//     the band and the number reading two different populations – reddens the one-reading arm (1).
//     ⚠ IT DID NOT REDDEN THE FIRST DRAFT OF THAT ARM, which read the ROUNDED percent with a ±0.005
//     tolerance: the two populations landed in the same bucket on every card. Reading
//     `preview.fieldChance` itself, with the shipped cuts and no slack, is what made it bite;
//   * `tierExpectedField`'s window replaced by the whole of-age universe reddens the degeneracy
//     arm (1) and nothing else.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateSave } from '../src/engine/migrations'
import { tickWeek, type WorldState } from '../src/engine/world'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { rngFromSeed } from '../src/engine/rng'
import { DRAW_LEAD_WEEKS, fieldChance } from '../src/engine/season/preview'
import { TIERS, TIER_SHORT } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

/** The same real career the mounted suites use, migrated and ticked – never hand-made. */
function savedWorld(): WorldState {
  return migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
}

/** What the card PRINTS – the integer percent. A raw drift of 0.004 is not a thing a player can see,
 *  and the claim is about what he reads. */
const pct = (x: number | null): number | null => (x === null ? null : Math.round(x * 100))

interface Reading {
  week: number
  field: number | null
  opponent: number | null
  opponentName: string
  band: string
}

/** One week's reading of one event, BOTH arms, through the shipped snapshot path. */
function readBoth(world: WorldState, id: string): Reading | null {
  const shipped = upcomingEvents(world).find((e) => e.id === id)
  if (!shipped) return null
  const probe = {
    ...world,
    season: world.season.map((e) => (e.id === id ? { ...e, week: world.week + DRAW_LEAD_WEEKS } : e)),
  } as WorldState
  const drawn = upcomingEvents(probe).find((e) => e.id === id)
  return {
    week: world.week,
    field: pct(shipped.preview.fieldChance),
    opponent: pct(drawn?.preview.firstMatchChance ?? null),
    opponentName: drawn?.preview.opponentName ?? '',
    band: shipped.preview.fieldStrength,
  }
}

interface Tracked {
  id: string
  tier: TierId
  rows: Reading[]
}

/** Follow every non-W event that is far enough out to stay pre-draw for the whole window. */
function followPreDraw(weeks = 4): Tracked[] {
  const world = savedWorld()
  const rng = rngFromSeed(world.seed)
  const tracked: Tracked[] = upcomingEvents(world)
    .filter((e) => e.week - world.week > weeks + DRAW_LEAD_WEEKS && TIERS[e.tier].track !== 'wta')
    .map((e) => ({ id: e.id, tier: e.tier, rows: [] }))
  for (let step = 0; step <= weeks; step++) {
    for (const t of tracked) {
      const r = readBoth(world, t.id)
      if (r) t.rows.push(r)
    }
    if (step === weeks) break
    tickWeek(world, rng)
  }
  return tracked.filter((t) => t.rows.filter((r) => r.field !== null).length >= 2)
}

const span = (xs: number[]): number => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0)

/** ⚠ THE BOUND IS MEASURED, NOT CHOSEN. tools/r34-field-chance.ts, 575 tournaments over nine careers,
 *  each read five times while pre-draw: the printed figure moved at all on 267 of them, by a MEAN of
 *  0.48 points and a WORST of 3. The opponent figure moved on 574 of 575, by a mean of 18.4 and a
 *  worst of 65, and named 2041 different girls for those 575 tournaments.
 *
 *  ⚠⚠ AND IT IS NOT ZERO, WHICH IS THE HONEST NUMBER RATHER THAN THE FLATTERING ONE. Two things can
 *  still move it and both are real news: the world's own slow drift (the conveyor retiring and
 *  replacing professionals) and HER OWN GROWTH – at thirteen she genuinely outgrows a rung by about
 *  5 rating points over the weeks a card sits on screen (round 31 #3's own measurement). That is a
 *  figure walking in the direction she is walking, once, not a figure «скачет от недели к неделе». */
const MAX_PRE_DRAW_DRIFT = 3

describe('round 34 #5 – the pre-draw figure does not move while the field s class does not', () => {
  it('the same tournament, read week after week before its draw, prints the same number', () => {
    const tracked = followPreDraw()
    expect(tracked.length, 'the fixture must carry pre-draw cards at all').toBeGreaterThan(2)
    for (const t of tracked) {
      const fields = t.rows.map((r) => r.field).filter((n): n is number => n !== null)
      expect(fields.length, `${t.id} was read at least twice`).toBeGreaterThan(1)
      expect(
        span(fields),
        `${TIER_SHORT[t.tier]} ${t.id} printed ${fields.map((n) => `${n}%`).join(' ')} over ${fields.length} weeks`,
      ).toBeLessThanOrEqual(MAX_PRE_DRAW_DRIFT)
    }
  })

  it('...while the OPPONENT figure it replaces swings, on the same cards in the same weeks', () => {
    // ⭐ THE CONTROL. His own reading was 80% becoming 54% two weeks later, and that was HONEST –
    // 19 of 27 tournaments re-draw their field every week (round 31 #4), so a figure computed from
    // the draw legitimately moves. This arm is that same instrument on this fixture: if it did not
    // swing, the arm above would be measuring nothing.
    const tracked = followPreDraw()
    const swings = tracked.map((t) => {
      const opp = t.rows.map((r) => r.opponent).filter((n): n is number => n !== null)
      const field = t.rows.map((r) => r.field).filter((n): n is number => n !== null)
      const names = new Set(t.rows.map((r) => r.opponentName).filter(Boolean)).size
      return { id: t.id, tier: t.tier, opp: span(opp), field: span(field), names }
    })
    expect(swings.length).toBeGreaterThan(2)
    // Every card names several different girls over the same weeks – the round-31 report itself.
    expect(
      swings.filter((s) => s.names > 1).length,
      'no card changed its opponent – the control is not reproducing the defect',
    ).toBeGreaterThan(swings.length / 2)
    // ...and at least one of them swings by his own order of magnitude while its field figure holds.
    const worst = swings.reduce((a, b) => (b.opp > a.opp ? b : a))
    expect(
      worst.opp,
      `the widest opponent swing was ${worst.opp} points on ${worst.id}; his own report was 80% -> 54%`,
    ).toBeGreaterThanOrEqual(20)
    expect(worst.field, 'and the field figure on that very card did not follow it').toBeLessThanOrEqual(
      MAX_PRE_DRAW_DRIFT,
    )
    // The pair as one sentence: the replacement is at least five times steadier, card for card.
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(swings.map((s) => s.opp))).toBeGreaterThan(5 * Math.max(1, mean(swings.map((s) => s.field))))
  })

  it('but it DOES move when the field s class changes – it is a reading, not a constant', () => {
    // ⚠ THE OTHER HALF OF THE PAIR, and without it "does not move" is satisfied by returning 50.
    // Two readings of the same function with a stronger field: her chance must fall.
    const easy = [1400, 1420, 1440]
    const hard = [1700, 1720, 1740]
    const mine = 1550
    const a = fieldChance(easy, mine)!
    const b = fieldChance(hard, mine)!
    expect(a).toBeGreaterThan(0.5)
    expect(b).toBeLessThan(0.5)
    expect(a - b, 'a 300-point stronger field must move the figure a long way').toBeGreaterThan(0.3)
    // ...and it is monotone in her own level too, which is the same claim from her side.
    expect(fieldChance(hard, mine + 200)!).toBeGreaterThan(b)
    // An empty rung is an ABSENCE of a reading, never a 50% invented for it (`firstMatchChance`'s
    // own rule, one field along).
    expect(fieldChance([], mine)).toBeNull()
  })

  it('the figure and the WORD beside it are one reading, so they can never disagree', () => {
    // `fieldStrength` is this number banded – the file's own «one source, two readings» rule. A card
    // reading `strong` beside a figure above the favourite cut would be the drift that rule forbids.
    //
    // ⚠ EXACT, NOT ROUNDED, AND THAT IS WHAT MAKES IT BITE. Read off the rounded percent with a
    // tolerance, a band computed from a DIFFERENT population survives whenever the two populations
    // land in the same bucket – measured: mutating `strengthOf` to fold `drawnField`'s entrants left
    // this arm green. Against `preview.fieldChance` itself, with the shipped cuts and no slack, any
    // card whose two populations straddle a cut reddens it, and the sweep is wide enough to hold one.
    const world = savedWorld()
    const rng = rngFromSeed(world.seed)
    let seen = 0
    const bands = new Set<string>()
    for (let i = 0; i < 16; i++) {
      for (const e of upcomingEvents(world)) {
        const x = e.preview.fieldChance
        if (x === null) continue
        seen++
        bands.add(e.preview.fieldStrength)
        const expected = x <= 0.375 ? 'strong' : x >= 0.625 ? 'favourite' : 'even'
        expect(
          e.preview.fieldStrength,
          `${TIER_SHORT[e.tier]} ${e.id} says ${e.preview.fieldStrength} at ${(x * 100).toFixed(1)}%`,
        ).toBe(expected)
      }
      tickWeek(world, rng)
    }
    expect(seen, 'the sweep must have read something').toBeGreaterThan(50)
    expect(bands.size, 'and it must span more than one band, or the pairing is untested').toBeGreaterThan(1)
  })

})

describe('round 34 #5 – round 31 #3 s degeneracy, re-checked before building on the band', () => {
  it('the figure is NOT the same on every junior and domestic card', () => {
    // ⚠⚠ THE CHECK THAT COULD HAVE STOPPED THE BUILD. Round 31 #3 measured the field-strength band as
    // DEGENERATE on junior and domestic cards – every one of them read `strong` against fields she
    // outrated by 120 points, because the band was reading a STANDINGS table whose Spearman against
    // actual rating is 0.11. That round fixed it by reading ratings instead, and «it was fixed» is a
    // claim: shipping a number that is identical on every junior card would be shipping the old
    // defect with a decimal point on it. So it is asserted, not assumed.
    //
    // MEASURED (tools/r34-field-chance.ts, 9 careers, every observation): the figure orders itself
    // down the ladder – Local 70.2%, Regional 68.1%, National 61.4%, J30 59.6%, J60 55.2%,
    // J300 47.6% – and takes 11 to 24 distinct integer values on each of them. It is not degenerate.
    const world = savedWorld()
    const rng = rngFromSeed(world.seed)
    const byTier = new Map<TierId, number[]>()
    for (let i = 0; i < 8; i++) {
      for (const e of upcomingEvents(world)) {
        if (TIERS[e.tier].track === 'wta') continue
        const p = pct(e.preview.fieldChance)
        if (p === null) continue
        byTier.set(e.tier, [...(byTier.get(e.tier) ?? []), p])
      }
      tickWeek(world, rng)
    }
    const rungs = [...byTier.entries()].filter(([, xs]) => xs.length > 2)
    expect(rungs.length, 'the fixture must show several junior/domestic rungs').toBeGreaterThan(1)

    // 1. The rungs are told apart from one another – the failure round 31 #3 named.
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const means = rungs.map(([t, xs]) => ({ tier: t, mean: mean(xs) }))
    const report = means.map((m) => `${TIER_SHORT[m.tier]} ${m.mean.toFixed(1)}%`).join(', ')
    expect(span(means.map((m) => m.mean)), `every rung reads the same: ${report}`).toBeGreaterThan(5)

    // 2. ...and it orders itself DOWN the ladder: the taller rung is the harder field.
    const ordered = [...means].sort((a, b) => TIERS[a.tier].points[0] - TIERS[b.tier].points[0])
    expect(ordered[0].mean, `bottom rung ${report}`).toBeGreaterThan(ordered[ordered.length - 1].mean)

    // 3. ...and no single rung is a constant, which a per-rung lookup table would be.
    expect(
      rungs.some(([, xs]) => new Set(xs).size > 1),
      `every card of every rung printed one frozen number: ${report}`,
    ).toBe(true)
  })
})
