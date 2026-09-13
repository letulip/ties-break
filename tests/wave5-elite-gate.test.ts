// WAVE 5 · T13 – THE ELITE GATE GOES ON, AND THE PROOF THAT THE THREE SURFACES STILL TELL ONE STORY.
//
// The owner, 13.09: «elite gate включим здесь же». The mechanic itself was built, tested and left
// waiting behind `ECONOMY.coach.eliteGate.enabled`; this wave turns the flag. So the diff is one
// boolean and the WORK is here – the proof that a flag which is read in three places answers the
// same question in all three, for every state, and that nothing in the frozen corpus moved.
//
// ⚠ THE LOCKED-ROW COPY IS NOT T13's TO WRITE. Every sentence the flip makes reachable was written
// when the gate was built (invariant 4). This file VERIFIES those sentences and never drafts one.
//
// WHAT EACH SECTION CLAIMS, and each is a `describe` below in this order:
//
//   A  the gate BITES in both directions, at the boundary and on both sides of it;
//   B  the three surfaces agree EXHAUSTIVELY – every roster coach x every point level x both flag
//      states, with the row state, the refusal and `coachHireable` asked separately and compared.
//      The screen's own lock is the fourth reader and is swept in tests/component/wave5-elite-gate-
//      row.test.ts, which is the only place a mounted button can be asked;
//   C  the frozen corpus: zero keys on all five cells, `rngMain` byte-identical – AND THE ARM that
//      says what that zero is worth, because a zero from a corpus that never hires an elite coach
//      is worth nothing (rulings K, R and S at length);
//   D  the refusal names the shortfall, in the same currency the row prints.
//
// ⚠ MUTATION-VERIFIED – every arm applied ALONE, run, reverted, md5 back to pristine between each.
// `|g|` is this file, `|c|` tests/coachTiers.test.ts, `|w|` tests/component/wave5-elite-gate-row.test.ts,
// `|r|` tests/component/round21-coach.test.ts, `|e|` e2e/elite-gate.spec.ts. Control green before each.
//
//   ARM 1  `eliteGate.enabled` back to `false` (the flip undone)   -> |g| 3 · |c| 2 · |w| 2 · |e| 1/2
//   ARM 2  `coachHireable` returns `true` for elite at ANY points  -> |g| 5 · |c| 2 · |w| 2
//   ARM 3  `coachHireable`'s `>=` weakened to `>` – the BOUNDARY   -> |g| 2 · |c| 1 · |w| 1
//   ARM 4  `coachMarket`'s `lockedPoints` pinned to `null` – the   -> |g| 2 · |c| 1 · |w| 2 · |e| 1/2
//          ROW surface alone stops agreeing with the other two
//   ARM 5  `hireCoach`'s refusal deleted – the REFUSAL alone       -> |g| 4 · |c| 1 · |w| 0
//   ARM 6  the gate widened from `elite` to EVERY tier            -> |g| 2 · |c| 3 · |w| 1 · |r| 4
//   ARM 7  §C's walk shortened to ONE WEEK – the null-arm control  -> |g| 1
//
// ⚠⚠ TWO OF THESE ARMS CAME BACK WEAKER THAN THEY SHOULD HAVE, AND BOTH FINDINGS ARE IN THE FILE.
//   · ARM 1 was |g| 2 at first: §B and §C toggle the flag and restored it to a literal `true`, so §D
//     could not see the flip undone. `SHIPPED` below is the fix, and the arm then found §D too.
//   · ARM 6 was |g| 1 / |w| 0: both sweeps took `coachHireable` as their EXPECTATION, so widening the
//     gate moved both sides at once. The expectation is now the RULE restated, and the arm reds.
// Both are this wave's «unable to fail» family, and neither was visible by reading.
//
// ⚠ ARM 5 REDDENS NOTHING IN `|w|`, AND THAT IS CORRECT rather than a hole: deleting the command's
// refusal cannot be seen from a screen that never presses Hire on a row the ROW still locks. It is
// §B's «row vs refusal» comparison that catches it, which is why that assertion exists at all.
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  KID_ID,
  coachMarket,
  createWorld,
  hireCoach,
  kidPoints,
  type WorldState,
} from '../src/engine/world'
import {
  buildCoachRoster,
  coachHireable,
  coachTierById,
  eliteGateShortfall,
  type Coach,
} from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** The flag, typed for a test that has to toggle it. It is a shipped constant, so every toggle below
 *  is wrapped in `try/finally` – a file that leaves it flipped would make the next file's verdict a
 *  fiction. */
const GATE = ECONOMY.coach.eliteGate as { enabled: boolean; minPoints: number }

/** ⚠⚠ THE SHIPPED VALUE, CAPTURED AT LOAD – and every `finally` below restores THIS, never a literal
 *  `true`. Found by ARM 1 rather than by review: §B and §C toggle the flag and their first drafts
 *  restored it to `true`, so by the time §D ran the gate was ON no matter what `economy.ts` said, and
 *  §D could not fail on the flip being undone. A sibling's leaked global making a later case unable to
 *  fail is this wave's own family, sighting seven, and the fix is one const. */
const SHIPPED = GATE.enabled

/** Grant the kid a single counting DOMESTIC result so her domestic best-6 equals `points` – the same
 *  one-row idiom `tests/age-caps.test.ts` uses, and the ledger token folds every row so the memo in
 *  `kidPoints` cannot serve a stale number. */
function giveKidPoints(world: WorldState, points: number): void {
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

/** A self-coached career at exactly `points` domestic points. Self-coached because the gate is about
 *  HIRING and a career that already has a coach would spend the first assertion on `world.coachId`
 *  rather than on the gate. */
function careerAt(points: number, seed = `t13-${points}`): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  giveKidPoints(world, points)
  // ⚠ THE SETUP IS ASSERTED, NOT ASSUMED. Ruling R's own lesson one level down: a fixture that does
  // not reach the state makes every green below it meaningless.
  expect(kidPoints(world, 'domestic'), `the career really sits at ${points} domestic points`).toBe(points)
  return world
}

/** Does the command refuse this coach? Returns the refusal's own sentence, or null when it hired. */
function refusalFor(world: WorldState, coachId: string): string | null {
  const had = world.coachId
  try {
    hireCoach(world, coachId)
    world.coachId = had
    return null
  } catch (e) {
    return (e as Error).message
  }
}

const rosterAt14 = (seed: string): Coach[] => buildCoachRoster(seed, 14)

// =================================================================================================
describe('T13 §A – the gate bites, and it bites in both directions', () => {
  /** MEASURED RED under ARMS 1, 2, 3 (the boundary), 5 and 6. GREEN under ARM 4 – this case never
   *  reads the market row, which is exactly what makes §B's cross-comparison necessary. */
  it('refuses an Elite coach below the bar, takes her at it, and never touches a lower rung', () => {
    // ⚠ THE SHIPPED STATE IS NOW ON. This is the assertion the whole task is, and it is deliberately
    // the first line of the file: the owner turned a flag, and a pin that did not say so would let
    // the flag drift back with nothing objecting.
    expect(GATE.enabled, 'the owner turned it on – wave 5 T13, 13.09').toBe(true)
    expect(GATE.minPoints, 'national-tier eligibility, in domestic points').toBe(150)

    const elite = rosterAt14('t13-bites').find((c) => c.tier === 'elite')!

    // BELOW: refused, by every reader.
    expect(coachHireable(elite, GATE.minPoints - 1)).toBe(false)
    expect(eliteGateShortfall(elite, GATE.minPoints - 1)).toBe(1)
    // AT: taken. The bar is `>=` and this is the line that says so – ARM 3 moves nothing else.
    expect(coachHireable(elite, GATE.minPoints)).toBe(true)
    expect(eliteGateShortfall(elite, GATE.minPoints)).toBeNull()
    // ABOVE: still taken.
    expect(coachHireable(elite, GATE.minPoints + 1)).toBe(true)

    // ...and the command agrees with all three, on real careers.
    const poor = careerAt(GATE.minPoints - 1)
    expect(refusalFor(poor, elite.id)).toMatch(/ranking points/)
    const ready = careerAt(GATE.minPoints)
    expect(refusalFor(ready, elite.id)).toBeNull()

    // ⚠ AND ONLY ELITE. ARM 6 widens the gate to every tier and this is where it lands: a family at
    // zero points may still hire all three lower rungs, which is the whole shape of «earned rather
    // than bought» – the ladder is not a paywall, its top step is a result.
    const broke = careerAt(0)
    for (const c of rosterAt14(broke.seed).filter((x) => x.tier !== 'elite')) {
      expect(coachHireable(c, 0), c.tier).toBe(true)
      expect(refusalFor(broke, c.id), c.tier).toBeNull()
    }
  })

  /** MEASURED RED under ARMS 1 and 2 only, and that is the whole of its subject: it asks what the FLAG
   *  does, so only an arm that moves the flag or the predicate it feeds can touch it. With the gate off
   *  the engine is the engine the wave started with, which is what makes this a flip and not a rewrite. */
  it('and the flag is the whole of it – off, the top rung is for sale again', () => {
    const elite = rosterAt14('t13-flag').find((c) => c.tier === 'elite')!
    const broke = careerAt(0, 't13-flag-career')
    expect(coachHireable(elite, 0)).toBe(false)
    GATE.enabled = false
    try {
      expect(coachHireable(elite, 0)).toBe(true)
      expect(eliteGateShortfall(elite, 0)).toBeNull()
      expect(refusalFor(broke, elite.id)).toBeNull()
      expect(coachMarket(broke).every((r) => r.lockedPoints === null)).toBe(true)
    } finally {
      GATE.enabled = SHIPPED
    }
    expect(coachHireable(elite, 0), 'and it is back on afterwards').toBe(false)
  })
})

// =================================================================================================
describe('T13 §B – the three surfaces are ONE answer, over every state', () => {
  /** THE POINT VECTOR, and it is the states rather than a sample. Zero, either side of the bar, the
   *  bar itself, and a career well past it – plus `minPoints` as a literal so the sweep still
   *  brackets the bar if the constant ever moves. */
  const POINT_LEVELS = [0, 1, GATE.minPoints - 1, GATE.minPoints, GATE.minPoints + 1, 1000]

  /** MEASURED RED under ARMS 2, 3, 4 (the ROW alone diverges), 5 (the REFUSAL alone diverges) and 6.
   *  ⚠ GREEN under ARM 1, deliberately: this case asks whether the three surfaces AGREE, not what the
   *  flag is set to – it sweeps both flag states itself, so there is nothing in it for a flag arm to
   *  move. §A owns the shipped value and reds there instead.
   *  This is the R10-16 case: a disagreement here is the defect the
   *  one-story doctrine is named for, and the sweep is exhaustive precisely so it cannot be a
   *  coincidence of which coach the sample happened to pick. */
  it('the row state, the hire refusal and coachHireable answer alike for every coach at every level', () => {
    let cells = 0
    let locked = 0
    for (const enabled of [true, false]) {
      GATE.enabled = enabled
      try {
        for (const points of POINT_LEVELS) {
          const world = careerAt(points, `t13-sweep-${points}`)
          const rows = coachMarket(world)
          const roster = rosterAt14(world.seed)
          expect(rows.length, 'the market really has a roster to sweep').toBe(roster.length)
          for (const coach of roster) {
            const row = rows.find((r) => r.id === coach.id)!
            // ⚠⚠ THE EXPECTATION IS THE RULE, RESTATED – NEVER `coachHireable`. Found by ARM 6 rather
            // than by review: this sweep's first draft took `coachHireable(coach, points)` as its
            // expectation, so an arm that widened the gate to every tier moved BOTH sides and walked
            // straight through, 0 red. That is ruling L's amendment as ruling O sharpened it – «pair
            // it with a value check whose expectation does not call the function under test» – and
            // this file met it on the third sighting of the wave's own family.
            const expectLocked = enabled && coach.tier === 'elite' && points < GATE.minPoints
            // SURFACE 0 – the predicate the other two are supposed to be reading.
            const hireable = coachHireable(coach, points)
            expect(hireable, `the predicate itself – ${coach.tier} @ ${points}pts`).toBe(!expectLocked)
            // SURFACE 1 – the market row's state.
            const rowSaysLocked = row.lockedPoints !== null
            // SURFACE 2 – the command's refusal, asked of a real career.
            const refusal = refusalFor(world, coach.id)
            const commandSaysLocked = refusal !== null

            const where = `${coach.tier} ${coach.id} @ ${points}pts, gate ${enabled ? 'on' : 'off'}`
            expect(rowSaysLocked, `row vs the rule – ${where}`).toBe(expectLocked)
            expect(commandSaysLocked, `refusal vs the rule – ${where}`).toBe(expectLocked)
            // ...and the two surfaces against EACH OTHER, not only against the predicate. An arm
            // that broke both the same way would walk through a comparison made only with the
            // predicate – ruling L's amendment, applied deliberately.
            expect(rowSaysLocked, `row vs refusal – ${where}`).toBe(commandSaysLocked)
            // The NUMBER is one number too: the row prints the shortfall the refusal quotes.
            if (rowSaysLocked) {
              expect(refusal, where).toContain(String(row.lockedPoints))
              expect(row.lockedPoints, where).toBe(GATE.minPoints - points)
              locked++
            }
            cells++
          }
        }
      } finally {
        GATE.enabled = SHIPPED
      }
    }
    // ⚠ THE SWEEP IS ASSERTED TO HAVE SWEPT SOMETHING, in both directions. A sweep whose locked count
    // is 0 agrees perfectly and proves nothing – sighting seven of this wave's family, pre-empted.
    expect(cells, 'every coach at every level in both flag states').toBe(16 * POINT_LEVELS.length * 2)
    expect(locked, 'and the locked half is real').toBeGreaterThan(0)
    expect(locked, '...and so is the unlocked half').toBeLessThan(cells)
  })
})

// =================================================================================================
describe('T13 §C – the frozen corpus, and what its zero is worth', () => {
  /** The five cells the two live constants actually hold, MEASURED off the fixture file rather than
   *  carried from memory (ruling B's retired habit): `FROZEN` is three – middleGrinder 5/0,
   *  eliteGrinder 8/0, selfTravelling 0/1 – and `PRE_R28B` adds highPlayer 6/1 and middlePlayer 5/1. */
  const CELLS: Array<[number, number, string]> = [
    [5, 0, 'FROZEN.middleGrinder'],
    [8, 0, 'FROZEN.eliteGrinder'],
    [0, 1, 'FROZEN.selfTravelling'],
    [6, 1, 'PRE_R28B.highPlayer'],
    [5, 1, 'PRE_R28B.middlePlayer'],
  ]
  const FREEZE_WEEKS = 156

  /** `tools/frozen-key-diff.ts`'s own hash, one key at a time. */
  function keyHashes(preset: number, policy: number, weeks: number): Record<string, string> {
    const { world, rng } = openCareer(PRESETS[preset], 0, POLICIES[policy])
    for (let w = 0; w < weeks; w++) stepCareerWeek(world, rng, POLICIES[policy])
    const record = world as unknown as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const key of Object.keys(record)) {
      out[key] = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
    }
    return out
  }

  /** ⚠ THE UNION OF BOTH KEY SETS, never one arm's. Ruling S's sighting six was exactly this: a
   *  byte-identity pin that compared `Object.keys()` of the control alone and so could only ever see
   *  a DELETION. */
  function movedKeys(a: Record<string, string>, b: Record<string, string>): string[] {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().filter((k) => a[k] !== b[k])
  }

  /** ⚠ MEASURED GREEN UNDER EVERY ARM, AND THAT IS A PROPERTY RATHER THAN A GAP: the zero it reports
   *  is a zero under BOTH flag states, so no mutation of the gate can move it. It is the case below
   *  that carries the risk, and ARM 7 is the arm written for it.
   *  The control is the change NEUTRALISED IN PLACE – the flag toggled
   *  inside this process, not a different commit – which is the per-key protocol's own form of
   *  CLAUDE.md's "your commit with your change reverted". */
  it('moves not one key on any of the five cells, and rngMain is byte-identical on each', () => {
    for (const [preset, policy, label] of CELLS) {
      GATE.enabled = false
      const off = keyHashes(preset, policy, FREEZE_WEEKS)
      GATE.enabled = true
      const on = keyHashes(preset, policy, FREEZE_WEEKS)
      GATE.enabled = SHIPPED
      expect(movedKeys(off, on), `${label} (preset ${preset} policy ${policy})`).toEqual([])
      // ⚠⚠ THE STOP CONDITION, STATED SEPARATELY FROM THE ZERO ABOVE. A gate that refuses a hire must
      // not move a draw: the hire is a COMMAND, not a roll. This line would still be worth asserting
      // if every other key had moved.
      expect(on.rngMain, `${label} rngMain`).toBe(off.rngMain)
    }
  })

  /** MEASURED RED under ARMS 2, 5 and 7.
   *  ⚠ ARM 7 IS THE ONE THAT MATTERS: with the walk cut to a single week the case ABOVE stays GREEN –
   *  a zero reported off a walk that reaches nothing – and this case is the only thing in the suite
   *  that objects. That is the null-arm family caught by construction rather than by luck.
   *
   *  ⚠⚠ THIS IS THE ARM RULING H ASKS FOR BY NAME, and the answer is a NULL WITH A REASON rather than
   *  a null. The corpus does not trip the gate, and the reason is not that an elite hire is
   *  impossible in it – it is that the FREEZE HORIZON stops 154 weeks short of the one that happens.
   *  Measured, not read:
   *
   *    · three of the five cells never call `hireCoach` at all (preset 5/0 and 8/0 run the grinder
   *      policy, whose `coachSeasonReview` is false; preset 0/1 is self-coached and returns at
   *      `born === 'self'`);
   *    · the other two call it ONLY to RELEASE – `hireCoach(world, null)`, which takes the early-
   *      return arm and never reaches the gate at all – and both are born below the elite rung;
   *    · the one pairing that DOES reach an elite re-hire is preset 8 x policy 1, and it lands on
   *      **week 310 at 0 domestic points**. At the 156-week horizon the same cell moves 0 of 84 keys;
   *      at 400 weeks it moves 30 of 85. So the instrument can see this change – the frozen corpus
   *      simply ends before the career reaches it.
   *
   *  Ruling K binds what that is worth from the other side: this is a coupling detector, not a
   *  measurement. What it proves is that turning the flag leaked nothing into a career the gate never
   *  touches. */
  it('...and the corpus COULD have reached an elite hire – it is the horizon, not the mechanic', () => {
    // 1 – the corpus, as frozen: no cell ever calls the command with a coach on the other end.
    for (const [preset, policy, label] of CELLS) {
      const { world, rng } = openCareer(PRESETS[preset], 0, POLICIES[policy])
      let prev = world.coachId
      const takenOn: string[] = []
      for (let w = 0; w < FREEZE_WEEKS; w++) {
        stepCareerWeek(world, rng, POLICIES[policy])
        if (world.coachId !== prev) {
          if (world.coachId !== null) takenOn.push(`w${world.week} ${coachTierById(world.coachId)}`)
          prev = world.coachId
        }
      }
      expect(takenOn, `${label} takes nobody on inside the freeze`).toEqual([])
    }

    // 2 – THE ARM. The same walker, the same policy set, one preset/policy pair the frozen corpus
    // does not carry, run past the horizon: it hires an elite coach at 0 points, and the gate is
    // what stops it. If this ever goes green-by-vacancy the zero above becomes worthless, which is
    // why the reachability is asserted rather than described.
    const ARM_WEEKS = 400
    const armWalk = (enabled: boolean) => {
      GATE.enabled = enabled
      const { world, rng } = openCareer(PRESETS[8], 0, POLICIES[1])
      let hiredAt: { week: number; points: number } | null = null
      let prev = world.coachId
      for (let w = 0; w < ARM_WEEKS; w++) {
        stepCareerWeek(world, rng, POLICIES[1])
        if (world.coachId !== prev) {
          if (world.coachId !== null && hiredAt === null) {
            hiredAt = { week: world.week, points: kidPoints(world, 'domestic') }
          }
          prev = world.coachId
        }
      }
      return { world, hiredAt }
    }

    const armOff = armWalk(false)
    GATE.enabled = SHIPPED
    expect(armOff.hiredAt, 'the corpus CAN reach an elite hire – this is the arm, not a hypothetical').not.toBeNull()
    expect(armOff.world.coachId, 'and with the gate off she ends the walk with him').not.toBeNull()
    expect(coachTierById(armOff.world.coachId!), 'an ELITE coach – the rung the gate is about').toBe('elite')
    expect(armOff.hiredAt!.points, 'taken on below the bar, which is the case the gate exists for').toBeLessThan(GATE.minPoints)
    expect(armOff.hiredAt!.week, 'and it happens well past the 156-week freeze horizon').toBeGreaterThan(FREEZE_WEEKS)

    const armOn = armWalk(true)
    GATE.enabled = SHIPPED
    expect(armOn.hiredAt, 'with the gate on that hire never happens').toBeNull()
    expect(armOn.world.coachId, '...and the career finishes the walk self-coached').toBeNull()
  })
})

// =================================================================================================
describe('T13 §D – the refusal says why, in the currency the row prints', () => {
  /** MEASURED RED under ARMS 1, 2, 4 and 5. R10-16's doctrine is that a refused control states its reason; the
   *  one-story half is that it states the SAME reason the row beside it does.
   *
   *  ⚠ NOT ONE OF THESE SENTENCES IS T13's. Both were written when the gate was built and this case
   *  reads them back (invariant 4) – it is a verification, and the day one of them needs to change
   *  is a day for the owner, not for a builder. */
  it('names the coach, the shortfall and the currency – and never invents a second number', () => {
    // ⚠ THE ROSTER OFF THE CAREER'S OWN SEED. A coach's ID is seed-free (spec §2: `id` is the fixed
    // portrait slot) but his NAME is drawn, so a roster built off a different seed resolves the same
    // man under a different name – which is how this case failed first and why it is worth a line.
    const world = careerAt(40, 't13-words-career')
    const elite = rosterAt14(world.seed).find((c) => c.tier === 'elite')!
    const refusal = refusalFor(world, elite.id)!
    expect(refusal).toBe(`${elite.name} only takes players with results – ${GATE.minPoints - 40} more ranking points`)
    // The row's own number, which the screen prints as "N pts short", is that same shortfall.
    const row = coachMarket(world).find((r) => r.id === elite.id)!
    expect(row.lockedPoints).toBe(GATE.minPoints - 40)
    expect(refusal).toContain(String(row.lockedPoints))
    // ⚠ SHORT DASH. The house rule, and this sentence is one of the strings the flip makes reachable
    // for the first time, so the вычитка pass will meet it.
    expect(refusal).toContain('–')
    expect(refusal).not.toContain('—')
  })
})
