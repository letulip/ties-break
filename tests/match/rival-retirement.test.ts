// ROUND 23 ITEM 3 – «А может ли соперница травмироваться во время матча?»
//
// THE ANSWER IS TWO ANSWERS, AND THIS FILE IS BOTH OF THEM.
//
//   SHE CAN STOP.    `simulateMatch` walks `retireHazard` forward for BOTH sides and fires on
//                    whichever uniform is passed first, so the rival across the net really does walk
//                    off mid-match. It is live today, it reaches the bracket and the news feed, and
//                    the first block below prints a real one.
//
//   SHE IS NEVER     Stopping is a SCORELINE event for a rival, not a BODY event. The layoff is
//   HURT.            opened by `retirementInjury(world)` and `world` is the kid's world – both of
//                    its call sites are guarded on `retiredId === KID_ID` (world.ts, world/
//                    planner.ts). There is no rival body to open a layoff in: `AiPlayer` declares no
//                    injury, condition or availability field, and `season/rival.ts`'s own header
//                    says so in as many words – "Rivals get NO injuries, NO physio, NO vacations and
//                    NO plan slider: that asymmetry is the player's edge, and it is deliberate."
//                    So the girl who could not finish on Tuesday is in Monday's draw at full
//                    strength, and the second block below shows exactly that happening.
//
// ⚠ AND IT CANNOT HAPPEN AT ALL IN A MATCH THE KID IS NOT IN. AI-AI rows resolve through
// `fastMatchProbability`, one Bernoulli against a closed form – no points are played, so there is no
// in-match fatigue to read and no hazard to integrate. Already pinned by
// `tests/match-retirement.test.ts` ("AI-AI rows can never carry a retirement"); restated here
// because it is half of the honest answer to the question as he asked it.
//
// Nothing here adds a draw to any stream: every match is a seeded build of the existing engine.

import { describe, expect, it } from 'vitest'
import { simulateMatch } from '../../src/engine/match/engine'
import { rngFromSeed } from '../../src/engine/rng'
import { runTournament } from '../../src/engine/season/tournament'
import { TIERS } from '../../src/engine/season/calendar'
import { generateCohort } from '../../src/engine/season/cohort'
import { engineModuleFunction, engineModuleSource } from '../worldSource'
import type { MatchPlayer, MatchOptions } from '../../src/engine/match/types'
import type { SeasonEvent } from '../../src/engine/season/types'

const KID = 'kid'

/** Evenly matched and short on stamina, so matches run long and the hazard is actually exercised. */
function player(id: string, stamina: number): MatchPlayer {
  return { id, name: id, serve: 55, ret: 55, composure: 55, stamina, groundstrokes: 55 }
}
const OPTS = (seed: string): MatchOptions => ({ surface: 'hard', tour: 'wta', seed })

const EVENT: SeasonEvent = { id: '2031-w10-local', week: 10, tier: 'local', surface: 'hard', deadlineWeek: 8 } as SeasonEvent

// =================================================================================================
// 1. SHE CAN STOP – the firing path, with a real one printed
// =================================================================================================

describe('round 23 #3 – a rival CAN stop mid-match, and here is one doing it', () => {
  it('prints a real rival retirement against the kid, end to end through runTournament', () => {
    const drawSize = TIERS.local.drawSize
    const rounds = Math.log2(drawSize)
    const found: string[] = []
    let sweeps = 0
    for (let s = 0; s < 400 && found.length < 3; s++) {
      sweeps++
      const kid = player(KID, 30)
      const field = Array.from({ length: drawSize }, (_, i) => player(`ai-${i}`, 30))
      const res = runTournament({ ...EVENT, id: `${EVENT.id}-r${s}` }, field, kid, `rival-${s}`, rngFromSeed(`rival-rng-${s}`))
      // The rival stopped: a retirement on one of HER matches, where the id that stopped is not hers.
      const ret = res.matches.find((m) => m.retiredId !== undefined && m.retiredId !== KID && (m.aId === KID || m.bId === KID))
      if (!ret) continue
      // She won it, at full value – the rules discount a walkover, never a retirement.
      expect(ret.winnerId).toBe(KID)
      found.push(
        `  seed "${`rival-${s}`}" round ${ret.round}/${rounds}  ${ret.aId} v ${ret.bId}  ` +
          `score ${ret.score}  retired: ${ret.retiredId}  winner: ${ret.winnerId}\n` +
          `    the line the owner reads: "${stageOf(ret.round, rounds)}: B. Tran beat a retiring ${ret.retiredId} ${ret.score}"`,
      )
    }
    // eslint-disable-next-line no-console
    console.log(
      `\nA RIVAL STOPPING MID-MATCH – live today, ${found.length} found in ${sweeps} seeded ${TIERS.local.label} draws\n\n` +
        found.join('\n') +
        '\n',
    )
    expect(found.length, 'a rival retirement must be reachable').toBeGreaterThan(0)
  })

  it('the hazard is symmetric: side 1 is not a spectator', () => {
    // The kid is side 0 in her own matches. If only side 0 could stop, the answer to his question
    // would be "no" – so this counts both sides directly off `simulateMatch`.
    const a = player('a', 40)
    const b = player('b', 40)
    let side0 = 0
    let side1 = 0
    for (let i = 0; i < 900; i++) {
      const r = simulateMatch(a, b, OPTS(`sym-${i}`))
      if (r.retired?.side === 0) side0++
      if (r.retired?.side === 1) side1++
    }
    // eslint-disable-next-line no-console
    console.log(
      `\nRETIREMENTS BY SIDE over 900 matches: side 0 (the kid's seat) ${side0}, side 1 (the rival's) ${side1}` +
        ` – ${(((side0 + side1) / 900) * 100).toFixed(2)}% of matches\n`,
    )
    expect(side1, 'the rival must be able to stop').toBeGreaterThan(0)
    expect(side0, 'and so must the kid').toBeGreaterThan(0)
  })
})

// =================================================================================================
// 2. ...AND SHE IS NEVER HURT. The proof of absence.
// =================================================================================================

describe('round 23 #3 – a rival carries NOTHING out of a retirement', () => {
  it('a rival has no body: `AiPlayer` declares no field a layoff could live in', () => {
    // Behavioural rather than a type assertion – `generateCohort` is what actually builds every
    // rival in the game, so its rows are the real answer to "what does a rival consist of".
    const keys = Object.keys(generateCohort('body-probe', 4)[0]).sort()
    // eslint-disable-next-line no-console
    console.log(`\nEVERYTHING A RIVAL IS MADE OF: ${keys.join(', ')}\n`)
    for (const forbidden of ['injury', 'injuryHistory', 'condition', 'weeksOut', 'layoff', 'available', 'fatigue']) {
      expect(keys, `a rival must not carry ${forbidden} – if she does, this file is out of date`).not.toContain(forbidden)
    }
  })

  it('⚠ THE MISSING FUNCTION: `retirementInjury` takes the KID\'s world, and both callers guard on KID_ID', () => {
    // This is the negative claim, and a negative claim about "nothing opens a layoff for a rival"
    // has no state to observe – so it is asserted where the decision is made. `retirementInjury`
    // has one parameter, `world`, and there is no `rivalRetirementInjury(cohortId)` beside it.
    const fn = engineModuleFunction('world', 'retirementInjury')
    expect(fn, 'retirementInjury must be findable').not.toBe('')
    expect(fn).toMatch(/retirementInjury\(world: WorldState\): void/)
    // It reads and writes only the kid's own body...
    expect(fn).toMatch(/onsetInjury\(\s*world,/)
    // ...and takes no player id, so it could not aim at a rival even if a caller wanted it to.
    expect(fn).not.toMatch(/\bplayerId\b|\bcohort\b|\bAiPlayer\b/)

    // AND EVERY CALL SITE IS GUARDED ON HER. Two of them today – `finalizeTournament` (world.ts,
    // through the `retiredMatch` it looked up two lines earlier) and the friendly (world/planner.ts,
    // inline). If a third ever appears without a KID_ID in its condition, this goes red, which is
    // the point of counting them rather than eyeballing them.
    const src = engineModuleSource('world')
    const calls = src.split('\n').filter((l) => /(?<!function )\bretirementInjury\(world\)/.test(l))
    expect(calls.length, 'retirementInjury call sites').toBe(2)
    for (const line of calls) {
      expect(line, 'every call site must be guarded').toMatch(/\bif\s*\(/)
      expect(line, 'and the guard must name the kid, directly or through retiredMatch').toMatch(/KID_ID|retiredMatch/)
    }
    // ...and `retiredMatch`, the one indirect guard, is itself nothing but a KID_ID test.
    expect(src).toMatch(/const retiredMatch = .*retiredId === KID_ID/)
  })

  it('she is in the next draw at full strength – the retirement leaves no mark on her', () => {
    // The decisive one, and it is the thing the owner would actually see. Find a rival who stopped
    // against the kid in week 10; then run week 11 off the SAME field and show she is entered,
    // playing, and identical in every attribute.
    const drawSize = TIERS.local.drawSize
    let checked = 0
    for (let s = 0; s < 400 && checked < 3; s++) {
      const kid = player(KID, 30)
      const field = Array.from({ length: drawSize }, (_, i) => player(`ai-${i}`, 30))
      const before = field.map((p) => ({ ...p }))
      const w10 = runTournament({ ...EVENT, id: `${EVENT.id}-n${s}` }, field, kid, `next-${s}`, rngFromSeed(`next-rng-${s}`))
      const ret = w10.matches.find((m) => m.retiredId !== undefined && m.retiredId !== KID && (m.aId === KID || m.bId === KID))
      if (!ret) continue
      checked++
      const hurtId = ret.retiredId!
      // (a) Nothing was written on her. The engine never mutates an entrant row, so she is the same
      //     object she was before she walked off – there is nowhere for "hurt" to be recorded.
      const after = field.find((p) => p.id === hurtId)!
      expect(after).toEqual(before.find((p) => p.id === hurtId)!)
      // (b) And next week she is in the draw, playing, exactly like everybody else.
      const w11 = runTournament(
        { ...EVENT, id: `${EVENT.id}-n${s}-next`, week: 11, deadlineWeek: 9 } as SeasonEvent,
        field,
        kid,
        `next-${s}`,
        rngFromSeed(`next-rng-${s}-b`),
      )
      const hers = w11.matches.filter((m) => m.aId === hurtId || m.bId === hurtId)
      expect(hers.length, `${hurtId} retired last week and must still be in this draw`).toBeGreaterThan(0)
      expect(w11.finishes[hurtId], 'she must have a finish, i.e. she played').toBeDefined()
    }
    expect(checked, 'the sweep must reach a rival retirement').toBeGreaterThan(0)
  })
})

/** The bracket's own round naming, small enough to inline rather than import the world's labeller. */
function stageOf(round: number, rounds: number): string {
  const remaining = Math.pow(2, rounds - round)
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}
