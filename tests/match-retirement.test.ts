// =================================================================================================
// THE RETIREMENT — she can be hurt DURING a tournament, and inside a match
// =================================================================================================
//
// The owner, 10.08: «если травма до матча – ничего не защитываем, если во время – защитываем
// поражение в текущей ступени, обе со снятием и последующим лечением и восстановлением как есть у
// нас… травма может быть не только между турнирами и по приезду на них, а еще и в процессе или
// вообще внутри матча… В юниорской то же самое, ничем не отличается».
//
// SEVEN THINGS ARE PINNED HERE, and the first two are the ones that block a merge:
//
//   1. ⚠ THE MATCH STREAM DOES NOT MOVE. The obvious implementation – one uniform per point against
//      the hazard – would have re-based every scoreline in every save. The two uniforms come off
//      `seed:ret`, a sub-stream private to the match seed, so a match in which nobody retires is
//      BYTE-IDENTICAL to the same match before the slice. Proved by reproduction against a frozen
//      pre-slice capture, not asserted.
//   2. ⚠ IT REACHES `finalizeTournament` AND PAYS THE ROUND REACHED. This is the owner's ruling and
//      it is also what all four rulebooks say (docs/research/retirement-and-withdrawal.md §§2-3).
//      Points, prize money, appearance fee and sponsor bonus are all unchanged by a retirement; the
//      opponent's win is a full win. Three load-bearing comments used to assert the opposite and are
//      restated rather than broken – pinned as source, so a future edit cannot quietly re-lie.
//   3. THE BEFORE/DURING SPLIT. Hurt before her first match: nothing counts (the shipped walkover
//      branch, untouched). Hurt during: the round she reached is hers, in full.
//   4. THE HAZARD READS THE MATCH AND NOTHING ELSE. No tier term, no age term, no rank term – so a
//      W100 and a J30 of the same length carry the same risk, and tier-dependence is a consequence
//      of match length rather than a knob.
//      ⚠ AMENDED 27.08: it reads the match AND HOW FRESH THE TWO PLAYERS ARRIVED, which is section 8
//      below. That is not a widening of the rule, it is the rule finally being obeyed – "a long
//      match on tired legs breaks girls" was always the fiction, and until that day the model could
//      not tell tired legs from fresh ones anywhere above condition 70.
//   5. THE INJURY LANDS WHERE SHE WORKED, AND COSTS NO NEW DRAW. The same single uniform against a
//      different table – proved by tapping the generator, which is the claim's own terms.
//   6. THE LAYOFF IS THE ORDINARY ONE, opened through the ONE onset writer.
//   7. THE VOICE. Short dash only, no Cyrillic, and a retirement week does not read like a defeat.
import { describe, expect, it } from 'vitest'
import { simulateMatch } from '../src/engine/match/engine'
import {
  RETIRE_K,
  RETIRE_DURABILITY_PIVOT,
  RETIRE_DURABILITY_SPAN,
  retireDurability,
  retireHazard,
  spentness,
} from '../src/engine/match/point'
import { conditionMatchFactor } from '../src/engine/condition'
import { BODY_REGIONS, drawBodyRegionFrom, tiltedBodyRegions } from '../src/engine/body'
import { loadedPartShares } from '../src/engine/knock'
import { rngFromSeed } from '../src/engine/rng'
import { runTournament } from '../src/engine/season/tournament'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  prizeCentsFor,
  skipTournament,
  tickWeek,
} from '../src/engine/world'
import { worldSource, engineModuleSource } from './worldSource'
import type { MatchPlayer, MatchOptions, Side } from '../src/engine/match/types'
import type { SeasonEvent } from '../src/engine/season/types'
import { lineAt, region } from './helpers/source'

// A pair built to play LONG matches: evenly matched, low stamina, so the fatigue curve past
// FATIGUE_START is steep and the sampler is actually exercised. Nothing about the retirement reads
// anything else on these rows.
function player(id: string, stamina: number): MatchPlayer {
  return { id, name: id, serve: 55, ret: 55, composure: 55, stamina, groundstrokes: 55 }
}
const OPTS = (seed: string): MatchOptions => ({ surface: 'hard', tour: 'wta', seed })

/** Every match of a big population, so the rate and the shape can be read off real matches. */
function population(n: number, stamina = 40): ReturnType<typeof simulateMatch>[] {
  const a = player('a', stamina)
  const b = player('b', stamina)
  return Array.from({ length: n }, (_, i) => simulateMatch(a, b, OPTS(`pop-${i}`)))
}

// =================================================================================================
// 1. THE MATCH STREAM DOES NOT MOVE (blocks merge)
// =================================================================================================

describe('the retirement adds no draw to the match stream', () => {
  it('⚠ a match nobody retires from is byte-identical, point for point', () => {
    // THE PROOF IS A REPRODUCTION, not an assertion. `simulateMatch` draws its points from
    // `rngFromSeed(opts.seed)`; the retirement uniforms come from `rngFromSeed(seed + ':ret')`. So
    // re-deriving the point stream by hand here and replaying the match's own log against it must
    // reproduce every point exactly – which is only true if nothing else consumed that generator.
    let checked = 0
    for (let i = 0; i < 60; i++) {
      const seed = `identical-${i}`
      const res = simulateMatch(player('a', 45), player('b', 45), OPTS(seed))
      if (res.retired) continue // a truncated match stops consuming; the untruncated ones are the pin
      const raw = rngFromSeed(seed)
      for (const entry of res.log) {
        const u = raw()
        const serverWon = entry.winner === entry.server
        expect(u < entry.pServe, `point ${entry.pointNumber} of ${seed}`).toBe(serverWon)
        checked++
      }
    }
    expect(checked, 'the sweep has to actually replay points').toBeGreaterThan(2000)
  })

  it('⚠ the two uniforms are drawn UNCONDITIONALLY and before anything is compared', () => {
    // A conditional pull is the failure mode this shape exists to make impossible. Source-pinned
    // because it is a property of the code's ORDER, which no output can show: both `retRng()` calls
    // sit above the point loop.
    const src = engineModuleSource('match/engine')
    const decl = src.indexOf('const retU')
    const loop = src.indexOf('while (score.winner === null)')
    expect(decl, 'the retirement uniforms must exist').toBeGreaterThan(0)
    expect(loop, 'the point loop must exist').toBeGreaterThan(0)
    expect(decl, 'the uniforms must be drawn BEFORE the first point').toBeLessThan(loop)
    // ...and off a stream of its own. `${opts.seed}:ret` and nothing else.
    const keys = [...src.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys).toEqual(['${opts.seed}:ret'])
    expect(src).not.toContain('Math.random')
  })

  it('the truncation is a PREFIX of the match that was played, not a rewrite', () => {
    // Cutting a trajectory at point n gives precisely the match played up to n, because the hazard
    // reads only state up to n. Checked directly: replay the retired match's log against the raw
    // point stream, exactly as above. Every point up to the stop must still be that stream's point.
    const retired = population(400).filter((r) => r.retired)
    expect(retired.length, 'the population must actually contain retirements').toBeGreaterThan(3)
    for (const res of retired) {
      const raw = rngFromSeed(res.seed)
      for (const entry of res.log) {
        const u = raw()
        expect(u < entry.pServe).toBe(entry.winner === entry.server)
      }
      expect(res.totalPoints, 'totalPoints is the point she stopped at').toBe(res.log.length)
      expect(res.retired!.pointNumber).toBe(res.totalPoints)
      // The winner is the OTHER side, at full value – the rules discount a walkover, never a
      // retirement (ITF WTT Regs, Women's §XII.C.1.b).
      expect(res.winner).toBe(res.retired!.side === 0 ? 1 : 0)
    }
  })

  it('DETERMINISTIC: the same seed retires in the same place, for ever', () => {
    // The visualiser re-runs the stored match from `(a, b, {surface, tour, seed})` alone, so this is
    // what makes MatchReplay / TournamentFlow / PracticeFlow reproduce the truncation for free.
    const one = population(200).find((r) => r.retired)!
    for (let i = 0; i < 20; i++) {
      const again = simulateMatch(player('a', 40), player('b', 40), OPTS(one.seed))
      expect(again.retired).toEqual(one.retired)
      expect(again.totalPoints).toBe(one.totalPoints)
      expect(again.sets).toEqual(one.sets)
    }
  })
})

// =================================================================================================
// 2. THE HAZARD READS THE MATCH AND NOTHING ELSE
// =================================================================================================

describe('the rate comes from the match, not from the sign on the door', () => {
  it('zero until FATIGUE_START, and zero for a player who never tires', () => {
    for (let n = 1; n <= 120; n++) expect(spentness(n, 40), `point ${n}`).toBe(0)
    expect(spentness(121, 40)).toBeGreaterThan(0)
    // stamina 100 = no fatigue term at all, at any point number, for ever.
    for (const n of [121, 200, 400, 1000]) expect(retireHazard(n, 100), `point ${n}`).toBe(0)
  })

  it('it is MONOTONE in points played and in how spent she is', () => {
    for (let n = 121; n < 300; n++) {
      expect(retireHazard(n + 1, 40)).toBeGreaterThanOrEqual(retireHazard(n, 40))
    }
    // A worn player is at more risk than a fit one on the same point.
    expect(retireHazard(200, 20)).toBeGreaterThan(retireHazard(200, 80))
  })

  it('⚠ NO TIER, AGE, RANK OR SURFACE TERM anywhere in the hazard', () => {
    // The design instruction, as a source pin: the rate must be taken from the match itself. A
    // future edit that reaches for a tier table has to delete this test to do it.
    //
    // ⚠ RE-AIMED 27.08, WIDENED RATHER THAN RELAXED. The hazard gained a second term that day –
    // `retireDurability`, the freshness curve – and a pin anchored at `retireHazard` would have
    // stopped covering the half of the model where a tier table is now easiest to smuggle in. The
    // region therefore starts at `retireDurability` and runs to the same end marker, so BOTH
    // functions are inside it. The forbidden list is unchanged and freshness is not on it: how worn
    // a player is IS a statement about a body, which is the sentence this pin protects.
    const src = engineModuleSource('match/point')
    const from = src.indexOf('export function retireDurability')
    const to = src.indexOf('export const RETIRE_K')
    expect(from).toBeGreaterThan(0)
    expect(to).toBeGreaterThan(from)
    const body = src.slice(from, to)
    for (const forbidden of ['tier', 'TIER', 'age', 'rank', 'surface']) {
      expect(body, `retireHazard must not read ${forbidden}`).not.toContain(forbidden)
    }
    expect(body).toContain('spentness')
  })

  it('the population rate is in the calibrated band (target 2.73%, research §7)', () => {
    // ⚠ THIS IS A BAND, NOT THE CALIBRATION. The number that matters is measured over the matches
    // the GAME plays, by `npm run bench:retire` (docs/specs/match-retirement.md §4) – this fixture
    // is a fixed pair at a fixed stamina and cannot stand in for a career's distribution. What it
    // pins is that RETIRE_K has not been moved by an order of magnitude without a bench run.
    const pop = population(600, 45)
    const rate = pop.filter((r) => r.retired).length / pop.length
    expect(rate, `RETIRE_K = ${RETIRE_K}`).toBeGreaterThan(0.005)
    expect(rate, `RETIRE_K = ${RETIRE_K}`).toBeLessThan(0.12)
  })

  it('both sides can stop, and neither side is special', () => {
    // `simulateMatch` has never known which side the kid is and must not learn. Over a symmetric
    // population the two sides must retire at indistinguishable rates.
    const pop = population(900, 40).filter((r) => r.retired)
    expect(pop.length, 'the population must contain retirements').toBeGreaterThan(8)
    const zero = pop.filter((r) => r.retired!.side === 0).length
    expect(zero, 'one-sided retirements').toBeGreaterThan(0)
    expect(pop.length - zero, 'one-sided retirements').toBeGreaterThan(0)
  })

  it('LONGER MATCHES CARRY MORE RISK, which is where tier-dependence comes from', () => {
    // Nothing reads the tier; a harder draw plays longer, so it integrates more hazard. Measured on
    // the population directly: retired matches are drawn from the long tail.
    const pop = population(900, 40)
    const retiredPts = pop.filter((r) => r.retired).map((r) => r.totalPoints)
    expect(retiredPts.length).toBeGreaterThan(8)
    const meanAll = pop.reduce((s, r) => s + r.totalPoints, 0) / pop.length
    const meanRet = retiredPts.reduce((s, n) => s + n, 0) / retiredPts.length
    expect(meanRet, 'a retirement must come out of a long match').toBeGreaterThan(meanAll)
    // ...and never before the fatigue curve has started.
    for (const n of retiredPts) expect(n).toBeGreaterThan(120)
  })

  it('a retirement scoreline is the partial one, and never a bare trailing 0-0', () => {
    for (const res of population(600, 40).filter((r) => r.retired)) {
      const last = res.sets[res.sets.length - 1]
      expect(res.sets.length, 'a scoreline needs at least one set').toBeGreaterThan(0)
      if (res.sets.length > 1) expect(last.a + last.b, 'a trailing 0-0 set must be trimmed').toBeGreaterThan(0)
      // She cannot have won two COMPLETED sets and retired – the match would have been over, and
      // the guard in `simulateMatch` refuses to steal a decided result. Note "completed": the last
      // element is the set she stopped IN, so a 5-3 lead is not a set won.
      const done = (g: { a: number; b: number }) =>
        (g.a >= 6 || g.b >= 6) && (Math.abs(g.a - g.b) >= 2 || g.a === 7 || g.b === 7)
      const won = [0, 1].map((s) => res.sets.filter((g) => done(g) && (s === 0 ? g.a > g.b : g.b > g.a)).length)
      expect(Math.max(won[0], won[1]), 'a decided match cannot be retired from').toBeLessThan(2)
    }
  })
})

// =================================================================================================
// 3. THE BRACKET: the round she reached is hers, and the opponent goes through
// =================================================================================================

describe('a retirement is a defeat in the round she reached', () => {
  const EVENT: SeasonEvent = {
    id: '2031-w10-local',
    week: 10,
    tier: 'local',
    surface: 'hard',
    deadlineWeek: 8,
  } as SeasonEvent

  it('the bracket needs no branch: her opponent advances on a full win', () => {
    // Driven through `runTournament` itself rather than through a hand-built record, so the claim
    // being tested is the one the engine makes.
    const drawSize = TIERS.local.drawSize
    let seenRetirement = 0
    for (let s = 0; s < 220 && seenRetirement < 6; s++) {
      const kid = player('kid', 30)
      const field = Array.from({ length: drawSize }, (_, i) => player(`ai-${i}`, 30))
      const res = runTournament(
        { ...EVENT, id: `${EVENT.id}-${s}` },
        field,
        kid,
        `bracket-${s}`,
        rngFromSeed(`bracket-rng-${s}`),
      )
      const ret = res.matches.find((m) => m.retiredId === 'kid')
      if (!ret) continue
      seenRetirement++
      // She lost it...
      expect(ret.winnerId).not.toBe('kid')
      // ...in the round she had reached, and `finishes` says exactly that with no special case.
      const rounds = Math.log2(drawSize)
      expect(res.finishes['kid']).toBe(rounds - ret.round)
      // ...and the opponent kept going: whoever beat her appears in a later round, unless she was
      // beaten in the final (there is no later round to appear in).
      if (ret.round < rounds - 1) {
        expect(
          res.matches.some((m) => m.round === ret.round + 1 && (m.aId === ret.winnerId || m.bId === ret.winnerId)),
          'the opponent must advance on a full win',
        ).toBe(true)
      }
      // No match of hers exists after the one she stopped in.
      const hers = res.matches.filter((m) => m.aId === 'kid' || m.bId === 'kid')
      expect(Math.max(...hers.map((m) => m.round))).toBe(ret.round)
    }
    expect(seenRetirement, 'the sweep must reach a retirement').toBeGreaterThan(0)
  })

  it('AI-AI rows can never carry a retirement – the closed form plays no points', () => {
    for (let s = 0; s < 40; s++) {
      const field = Array.from({ length: TIERS.local.drawSize }, (_, i) => player(`ai-${i}`, 20))
      const res = runTournament({ ...EVENT, id: `${EVENT.id}-ai-${s}` }, field, null, `ai-${s}`, rngFromSeed(`ai-rng-${s}`))
      for (const m of res.matches) expect(m.retiredId, 'a closed-form match cannot retire').toBeUndefined()
    }
  })
})

// =================================================================================================
// 3b. THE RULING, END TO END ON A LIVE CAREER (blocks merge)
// =================================================================================================
//
// The owner, 10.08: «если травма до матча – ничего не защитываем, если во время – защитываем
// поражение в текущей ступени». Everything above is about the mechanism; this is about the money and
// the points, driven through `createWorld` / `tickWeek` / `skipTournament` rather than asserted off a
// fixture, because a rule about what a result is WORTH can only be checked where results are paid.

describe('⚠ the round she reached is hers, in full', () => {
  it('a retirement reaches finalizeTournament and is paid exactly like a defeat in that round', () => {
    let seen = 0
    for (let s = 0; s < 14 && seen < 4; s++) {
      const world = createWorld(`ruling-${s}`)
      const rng = rngFromSeed(world.seed)
      const strongestFirst = [...TIER_LADDER].reverse()
      for (let i = 0; i < 52 * 4 && seen < 4; i++) {
        world.fundsCents = Math.max(world.fundsCents, 1_000_000_00)
        if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
          for (const tier of strongestFirst) {
            const e = world.season.find(
              (x) =>
                x.tier === tier &&
                x.deadlineWeek >= world.week &&
                x.deadlineWeek - world.week <= 2 &&
                !world.entries.includes(x.id) &&
                !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
            )
            if (!e) continue
            try { enterEvent(world, e.id); break } catch { /* the policy tries the next rung down */ }
          }
        }
        tickWeek(world, rng)
        const p = world.pendingTournament
        if (!p) continue
        const hit = p.result.matches.find((m) => m.retiredId === KID_ID)
        const event = world.season.find((e) => e.id === p.eventId)!
        const tier = TIERS[event.tier]
        const finish = p.result.finishes[KID_ID]!
        const fundsBefore = world.fundsCents
        const lossesBefore = world.seasonLosses
        skipTournament(world)
        closeTournament(world)
        if (!hit) continue
        seen++

        // 1. THE POINTS. Exactly the table's value for the round she reached – no partial credit,
        //    no haircut. `finalizeTournament` writes a ledger row only when points > 0.
        const owed = tier.points[finish] ?? 0
        const row = world.results.find((r) => r.playerId === KID_ID && r.week === world.week && r.tier === event.tier)
        if (owed > 0) expect(row?.points, `${tier.label} finish ${finish}`).toBe(owed)
        else expect(row, 'a zero-point round writes no row, retirement or not').toBeUndefined()

        // 2. THE CHEQUE. Same finish index, same table, and it really reached the balance.
        const prize = prizeCentsFor(event.tier, finish)
        const paid = world.events
          .filter((e) => e.week === world.week && e.category === 'prize')
          .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
        expect(paid, `${tier.label} prize for finish ${finish}`).toBe(prize)
        if (prize > 0) expect(world.fundsCents).toBeGreaterThan(fundsBefore - prize)

        // 3. THE RUN IS ON HER RECORD, and the stopped match is counted as the loss it is.
        expect(world.seasonLosses).toBeGreaterThan(lossesBefore)
        expect(world.events.some((e) => e.week === world.week && e.type === 'tournament')).toBe(true)

        // 4. THE BODY. The layoff opened, this week, through the ordinary model.
        expect(world.injury, 'she stopped because she is hurt').not.toBeNull()
        expect(world.injury!.sinceWeek).toBe(world.week)
        expect(world.injury!.weeksRemaining).toBe(world.injury!.totalWeeks)
        expect(world.events.some((e) => e.week === world.week && e.type === 'injury')).toBe(true)

        // 5. THE OPPONENT went through on a full win – she is not in the draw after that round.
        expect(hit!.winnerId).not.toBe(KID_ID)
      }
    }
    expect(seen, 'the sweep must reach a retirement on a live career').toBeGreaterThan(0)
  })

  it('hurt BEFORE her first match still counts for nothing – the walkover branch is untouched', () => {
    // The other half of the ruling, and the half that must NOT have moved: an entry that comes round
    // inside a layoff resolves as a walkover, 0 points, and never reaches finalize.
    const world = createWorld('ruling-walkover')
    const rng = rngFromSeed(world.seed)
    let target: { id: string; week: number } | undefined
    for (let i = 0; i < 52 && !target; i++) {
      world.fundsCents = 1_000_000_00
      target = world.season
        .filter((e) => e.deadlineWeek >= world.week && e.week > world.week)
        .find((e) => {
          try { enterEvent(world, e.id); return true } catch { return false }
        })
      if (!target) tickWeek(world, rng)
    }
    expect(target, 'the fixture needs an enterable event').toBeDefined()
    // Tick up to the week before it plays, keeping her healthy the whole way.
    while (world.week < target!.week - 1) {
      world.injury = null
      tickWeek(world, rng)
      if (world.pendingTournament) { skipTournament(world); closeTournament(world) }
    }
    // Hurt AFTER the list closed, so the fee is committed and the entry cannot be withdrawn.
    world.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 4, totalWeeks: 4, sinceWeek: world.week }
    tickWeek(world, rng)
    expect(world.week).toBe(target!.week)
    expect(world.pendingTournament, 'she never took the court').toBeNull()
    expect(world.results.some((r) => r.playerId === KID_ID && r.week === world.week)).toBe(false)
    expect(world.events.some((e) => e.week === world.week && e.category === 'prize')).toBe(false)
    expect(world.walkoverWeek).toBe(world.week)
  })
})

// =================================================================================================
// 4. THE INJURY LANDS WHERE SHE WORKED, AND COSTS NO NEW DRAW
// =================================================================================================

describe('the part is re-weighted, not re-drawn', () => {
  it('⚠ SAME UNIFORM, DIFFERENT TABLE – proved by tapping the generator', () => {
    // The claim is "weighting the part by the week costs no new draw". Verified by reproduction: tap
    // a generator, walk the shipped table and the tilted one from the SAME position, and check both
    // consumed exactly one pull and left the stream in the same place.
    const tapped = (table: readonly { part: string; weight: number }[]) => {
      const raw = rngFromSeed('tilt-probe')
      let pulls = 0
      const rng = () => { pulls++; return raw() }
      const part = drawBodyRegionFrom(rng, table)
      return { part, pulls, next: raw() }
    }
    const serveWeek = loadedPartShares([['serve'], ['serve'], ['serve'], ['serve'], [], [], []])
    const flat = tapped(BODY_REGIONS)
    const tilted = tapped(tiltedBodyRegions(serveWeek, []))
    expect(flat.pulls, 'exactly one pull').toBe(1)
    expect(tilted.pulls, 'exactly one pull, tilted too').toBe(1)
    expect(tilted.next, 'the stream must be left in the same place').toBe(flat.next)
  })

  it('an untilted week returns the SHIPPED array itself, byte-identical', () => {
    // The identity return is load-bearing, not an optimisation: renormalising an all-ones tilt could
    // divide by 0.9999999999999999 and flip a boundary uniform into the neighbouring part.
    expect(tiltedBodyRegions(new Map(), [])).toBe(BODY_REGIONS)
    // A week of `general` sessions loads nothing by design, so it is untilted too.
    expect(tiltedBodyRegions(loadedPartShares([['general'], ['general'], [], [], [], [], []]), [])).toBe(BODY_REGIONS)
  })

  it('a serving week tilts toward the serving joints, and a fitness week toward the legs', () => {
    const share = (table: readonly { part: string; weight: number }[], part: string) =>
      table.find((r) => r.part === part)!.weight
    const serve = tiltedBodyRegions(loadedPartShares([['serve'], ['serve'], ['serve'], ['serve'], ['serve'], [], []]), [])
    const fitness = tiltedBodyRegions(loadedPartShares([['fitness'], ['fitness'], ['fitness'], ['fitness'], ['fitness'], [], []]), [])
    expect(share(serve, 'shoulder')).toBeGreaterThan(share(BODY_REGIONS, 'shoulder'))
    expect(share(serve, 'elbow')).toBeGreaterThan(share(BODY_REGIONS, 'elbow'))
    expect(share(fitness, 'knee')).toBeGreaterThan(share(BODY_REGIONS, 'knee'))
    expect(share(fitness, 'ankle')).toBeGreaterThan(share(BODY_REGIONS, 'ankle'))
    // ...and the tilt REDISTRIBUTES: it is a share of a whole, so something has to pay for it.
    expect(share(serve, 'knee')).toBeLessThan(share(BODY_REGIONS, 'knee'))
    for (const t of [serve, fitness]) {
      expect(t.reduce((s, r) => s + r.weight, 0)).toBeCloseTo(1, 12)
      expect(t.map((r) => r.part), 'the same twelve parts, in the same order').toEqual(BODY_REGIONS.map((r) => r.part))
    }
  })

  it('a part already on the record is likelier than one that is not', () => {
    const share = (table: readonly { part: string; weight: number }[], part: string) =>
      table.find((r) => r.part === part)!.weight
    const pushed = tiltedBodyRegions(new Map(), ['knee'])
    expect(share(pushed, 'knee')).toBeGreaterThan(share(BODY_REGIONS, 'knee'))
    expect(share(pushed, 'wrist')).toBeLessThan(share(BODY_REGIONS, 'wrist'))
    // ...and measurably so, over a real sweep of uniforms rather than by inspecting a weight.
    const draws = (table: readonly { part: string; weight: number }[]) => {
      let knees = 0
      for (let i = 0; i < 4000; i++) {
        if (drawBodyRegionFrom(rngFromSeed(`sweep-${i}`), table) === 'knee') knees++
      }
      return knees
    }
    expect(draws(pushed)).toBeGreaterThan(draws(BODY_REGIONS) * 1.5)
  })
})

// =================================================================================================
// 5. THE THREE RESTATED COMMENTS (source pins — a future edit may not quietly re-lie)
// =================================================================================================

describe('⚠ the invariant that changed is RESTATED, not left lying', () => {
  it('world.ts says out loud that a retirement reaches finalize and is paid', () => {
    const src = worldSource()
    // The three sites the research flagged: the prize money, the appearance fee, the run's strain.
    // Each still carries its original claim about the trio that never reaches finalize AND now names
    // the case that does.
    expect(src).toContain('RESTATED BY THE RETIREMENT SLICE')
    const restatements = [...src.matchAll(/RESTATED BY THE RETIREMENT SLICE/g)].length
    expect(restatements, 'all three sites must be restated').toBeGreaterThanOrEqual(3)
    // ...and the behaviour the comments describe is the behaviour: nothing in finalizeTournament
    // reduces an award because of a retirement.
    const finalize = region(src, 'function finalizeTournament', 'export function revealTournamentRound')
    expect(finalize, 'the retirement must be read, once, to write copy and open the layoff').toContain('retiredMatch')
    // The award lines must not branch on it.
    for (const award of ['const prize = prizeCentsFor(', 'const appearance = appearanceFeeFor(', 'const bonus = resultBonusFor(']) {
      // ⚠ if this throws, the award line moved – re-aim the marker, do not delete the pin.
      const line = lineAt(finalize, award)
      expect(line, `${award} must not know about retirements`).not.toContain('retired')
    }
  })

  it('protocol.ts restates the W-L comment, and names the walkover as a misnomer', () => {
    const src = engineModuleSource('../shared/protocol')
    expect(src).toContain('RESTATED BY THE RETIREMENT SLICE')
    // The research's cheap half of the naming fix (§10.1 Q4): the identifier stays, the confusion is
    // documented at the union member so the next reader does not repeat it.
    expect(src).toContain('THE NAME IS OURS AND IT IS THE WRONG WORD')
  })
})

// =================================================================================================
// 6. THE VOICE
// =================================================================================================

describe('the copy', () => {
  it('short dash only, no Cyrillic, in every new player-facing string', () => {
    // Player copy uses the short dash. The engine's own comments quote the owner in Russian, so the
    // sweep is over the STRING LITERALS the player can see, not over the file.
    for (const mod of ['world/injury', 'world/matchNews', 'diary/travelNotes']) {
      const src = engineModuleSource(mod)
      // Comment lines are stripped first – the owner's rulings are quoted verbatim in them.
      const code = src
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join('\n')
      const strings = [...code.matchAll(/'([^'\\]*)'/g)].map((m) => m[1])
      for (const s of strings) {
        expect(s, `long dash in ${mod}: "${s}"`).not.toContain('\u2014')
        expect(/[\u0400-\u04FF]/.test(s), `Cyrillic in ${mod}: "${s}"`).toBe(false)
      }
    }
  })

  it('a retirement week does not read like a defeat', () => {
    const injury = engineModuleSource('world/injury')
    // The onset copy branches on the CAUSE – the owner's «с учетом момента, когда она была».
    expect(injury).toContain("cause === 'retirement'")
    expect(injury).toContain('She had to stop')
    // ...and the news line says who stopped, in the VERB – the score has to stay the trailing token
    // because SeasonScreen's plaque splits on it (see the note in matchNews.ts and the pin in
    // tests/round12-view.test.ts).
    const news = engineModuleSource('world/matchNews')
    expect(news).toContain("'retired against'")
    expect(news).toContain("'beat a retiring'")
    expect(news).toContain("${formatShortName(oppName)} ${kidScore ?? ''}`.trim()")
    // ...and the summary says it without touching the points beside it.
    expect(worldSource()).toContain('she retired hurt')
  })
})

// =================================================================================================
// 8. ⭐ ARRIVING FRESH BUYS SAFETY – the 27.08 shape fix, and the three properties it stands on
// =================================================================================================
//
// The owner, 27.08: «наказывать тех, кто УЖЕ в низкой кондиции приезжает и делает это ПОСТОЯННО
// (гриндер), а если я приезжаю с 80-90 на турнир, то как будто вполне есть высокий шанс доиграть».
// Measured before anything was built (docs/specs/retirement-shape-2026-08.md §6): arriving at 95 and
// arriving at 70 carried IDENTICAL risk, x1.00 to the last decimal, because the hazard was borrowing
// `conditionMatchFactor` – a curve that returns exactly 1 above its knee of 70.
//
// The three properties, in the order they matter:
//   (a) IT IS A REDISTRIBUTION. The population-weighted mean of the multiplier is 1.0, so the
//       expected number of retirements does not move and the 2.73% anchor survives by construction.
//       That is what makes this a SHAPE change rather than a LEVEL change, and §11.1 of the spec
//       forbids the second one.
//   (b) OMITTED IS TODAY'S BEHAVIOUR, EXACTLY. `MatchOptions.condition` absent is a multiplier of 1
//       on both sides – not "both fresh" – so every fixture and every pure caller is untouched.
//   (c) THE SHAPE DELIVERS HIS SENTENCE. Arriving at 85 must be materially safer than arriving at
//       50, at a length neither of them chose.
describe('⭐ the hazard can finally tell a fresh girl from a worn one', () => {
  it('MONOTONE over the WHOLE 0-100 span – the knee is the defect, and there is not a second one', () => {
    for (let c = 0; c < 100; c++) {
      expect(retireDurability(c + 1), `condition ${c} -> ${c + 1}`).toBeLessThan(retireDurability(c))
    }
    // ...and this is exactly what the borrowed curve could not do: it is FLAT across the owner's
    // own range, which is the finding this fix answers.
    expect(conditionMatchFactor(95)).toBe(conditionMatchFactor(70))
    expect(retireDurability(95)).toBeLessThan(retireDurability(70))
  })

  it('⚠ STRICTLY POSITIVE at both ends, and clamped outside the legal span', () => {
    // A non-positive multiplier would let `retH` stop being non-decreasing, and the sampler would
    // stop being a threshold on accumulated exhaustion. The ceiling is arithmetic:
    // SPAN < 100 / (100 - PIVOT).
    expect(retireDurability(100)).toBeGreaterThan(0)
    expect(RETIRE_DURABILITY_SPAN).toBeLessThan(100 / (100 - RETIRE_DURABILITY_PIVOT))
    expect(retireDurability(-40)).toBe(retireDurability(0))
    expect(retireDurability(140)).toBe(retireDurability(100))
  })

  it('⭐ (a) A REDISTRIBUTION: a population centred on the pivot has a mean multiplier of exactly 1', () => {
    // The load-bearing arithmetic, stated as a property rather than as one measured corpus: for the
    // straight line this curve is, ANY population whose hazard-weighted mean condition equals the
    // pivot has a hazard-weighted mean multiplier of exactly 1. That is why `RETIRE_K` did not move.
    // The corpus that supplies the pivot is `npm run bench:retire`, which prints both numbers.
    const pivot = RETIRE_DURABILITY_PIVOT
    // ⚠ EVERY CONDITION HERE IS INSIDE 0-100, and that is a real precondition rather than tidiness:
    // the curve CLAMPS outside the legal span, so a synthetic population straddling 100 would break
    // the identity while the game's own population – which `ECONOMY.condition` clamps to 0-100 –
    // never can. A case at 108 was written first and failed exactly this way, which is the check
    // earning its keep on its first run.
    const cases: { condition: number; hazard: number }[][] = [
      [
        { condition: pivot - 20, hazard: 1 },
        { condition: pivot + 20, hazard: 1 },
      ],
      [
        { condition: pivot - 40, hazard: 3 },
        { condition: pivot + 20, hazard: 6 },
      ],
      [
        { condition: 0, hazard: 100 - pivot },
        { condition: 100, hazard: pivot },
      ],
    ]
    for (const pop of cases) {
      const h = pop.reduce((s, r) => s + r.hazard, 0)
      const meanCondition = pop.reduce((s, r) => s + r.hazard * r.condition, 0) / h
      const meanMultiplier = pop.reduce((s, r) => s + r.hazard * retireDurability(r.condition), 0) / h
      expect(meanCondition).toBeCloseTo(pivot, 9)
      expect(meanMultiplier, 'the LEVEL must not move').toBeCloseTo(1, 9)
    }
  })

  it('⭐ (b) OMITTED IS BYTE-IDENTICAL, and the option really is read – proved by mutating it', () => {
    const a = player('a', 40)
    const b = player('b', 40)
    let moved = 0
    for (let i = 0; i < 400; i++) {
      const opts = OPTS(`dur-${i}`)
      const bare = simulateMatch(a, b, opts)
      // No condition ⇒ the shipped hazard. `retireHazard`'s third argument defaults to 1, so the
      // running sum is the same sum it always was.
      const neutral = simulateMatch(a, b, { ...opts, condition: [invert(1), invert(1)] })
      expect(neutral.totalPoints, `seed ${i}`).toBe(bare.totalPoints)
      expect(neutral.retired?.pointNumber ?? null, `seed ${i}`).toBe(bare.retired?.pointNumber ?? null)
      // ...and a worn pair really is more breakable. If this line could not fail, the option would
      // not be wired to anything – the null-arm hazard CLAUDE.md warns about.
      const worn = simulateMatch(a, b, { ...opts, condition: [0, 0] })
      if ((worn.retired ? 1 : 0) !== (bare.retired ? 1 : 0)) moved += 1
    }
    expect(moved, 'the condition option must change outcomes, or it is not wired up').toBeGreaterThan(0)
  })

  it('⭐ (c) HIS SENTENCE, AS A NUMBER: arriving at 85 is materially safer than arriving at 50', () => {
    // Held at a fixed pair and a fixed seed set, so length cannot do the work – the axis the
    // measurement found doing ALL of it before this shipped.
    const a = player('a', 45)
    const b = player('b', 45)
    const rateAt = (condition: number) => {
      let stopped = 0
      for (let i = 0; i < 900; i++) {
        const res = simulateMatch(a, b, { ...OPTS(`fresh-${i}`), condition: [condition, condition] })
        if (res.retired) stopped += 1
      }
      return stopped / 900
    }
    const fresh = rateAt(85)
    const worn = rateAt(50)
    expect(worn, 'the worn pair must break more often').toBeGreaterThan(fresh)
    // The curve's own arithmetic over that span, which the measured rates must be in the region of.
    expect(retireDurability(50) / retireDurability(85)).toBeGreaterThan(1.8)
    // ...and the pre-27.08 model said EXACTLY ZERO here, which is the whole complaint.
    expect(conditionMatchFactor(85)).toBe(conditionMatchFactor(100))
  })
})

/** Identity, written so `condition: [1, 1]` in the test above cannot be mistaken for a CONDITION of
 *  1 – the neutral arm passes conditions whose multiplier is exactly the shipped one, which is the
 *  pivot, not the number 1. */
function invert(multiplier: number): number {
  return RETIRE_DURABILITY_PIVOT - ((multiplier - 1) * 100) / RETIRE_DURABILITY_SPAN
}

// A `Side` import that is used only to keep the type surface honest in this file.
export type _Side = Side
