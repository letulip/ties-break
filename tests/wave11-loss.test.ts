// =================================================================================================
// WAVE 11, T4 – THE LOSS: THE J-CURVE, THE BOUNDARY LAW, AND THE SILENCE THAT IS THE TELLING
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §3, the design `docs/design/the-months-before-she-says-2026-09.md`
// §2 and §4, the research `docs/research/pregnancy-in-sport-2026-09.md` §1. Behind the switch, on
// the researched J-curve BY AGE, and with nothing the parent does anywhere near it.
//
// ⚠⚠ THE ONE THING THIS FILE EXISTS TO HOLD IS §B, AND IT IS A DESIGN LAW RATHER THAN A SCRUPLE.
// «A game where a hard training block CAUSES a miscarriage is asserting something untrue, and is
// telling every player the sentence women already hear too often: *you did this by not resting.*»
// The research made it a FINDING – nothing in the evidence supports training as a cause, and age
// dominates the variance – so the read-set is written into `pregnancyLossChanceAt`'s signature (it
// takes no world) and §B sweeps the five things that were available and are not read.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED. Control GREEN first; each arm applied by a
// scripted string edit and UNDONE by the inverse edit, never `git checkout`.
//
//   ARM 1  `pregnancyLossChanceAt` handed the world and scaled by      1 RED  §B's ten-arm sweep,
//          the training plan – the defect the design refuses by name           ALONE. ⚠ THAT IS THE
//                                                                              MEASUREMENT AND NOT A
//                                                                              THIN NET: §B is the
//                                                                              only case in the repo
//                                                                              that can see it,
//                                                                              which is exactly why
//                                                                              the design asked for
//                                                                              a pin rather than a
//                                                                              comment
//   ARM 2  the switch clause dropped from `pregnancyLossEligible`       1 RED  §C's switch-off case
//   ARM 3  the window clause dropped (`since >= 0` – the hazard runs   1 RED  §A's window case. ⚠ The
//          the whole 39-week term, which is what «integrating over             integral case stays
//          the term» would have shipped)                                       GREEN, because it is
//                                                                              arithmetic over the
//                                                                              CONSTANTS and the arm
//                                                                              moves the GATE – two
//                                                                              halves of one claim,
//                                                                              and it takes both
//   ARM 4  the `pregnancyLossWeeks.push` removed                        3 RED  §D's record case, §D's
//                                                                              cooldown case and §E's
//                                                                              open-tells case, which
//                                                                              finds its row BY the
//                                                                              kept week – the third
//                                                                              red is the list's own
//                                                                              argument arriving from
//                                                                              a direction nobody
//                                                                              arranged
//   ARM 5  `LOSS_HER_LINE.quiet` given a line (the silence broken)      1 RED  §E's silence case
//
// =================================================================================================

import { describe, it, expect } from 'vitest'
import {
  createWorld,
  kidAgeExact,
  pregnancyEligible,
  pregnancyLossChanceAt,
  pregnancyLossEligible,
  rollPregnancy,
  rollPregnancyLoss,
  setWeightEnabled,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { temperamentFor } from '../src/engine/spirit'
import type { LoveEpisode, WeekPlan } from '../src/shared/protocol'

const W = ECONOMY.weight

// ⚠⚠ THE RESEARCH'S OWN TOTALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.weight` (wave 3's ARM 2
// law): the whole of §A is «the shipped per-week rates integrate to the study's figures», and an
// expectation read out of the constant would be the constant agreeing with itself.
// Magnus MC et al., BMJ 2019, 421,201 Norwegian pregnancies.
const STUDY = [
  { fromAge: 24, total: 0.098 },
  { fromAge: 30, total: 0.108 },
  { fromAge: 35, total: 0.167 },
] as const
/** The research's own recognised-pregnancy window on the conception clock – 6..20 GESTATIONAL weeks,
 *  which is two ahead of conception. Transcribed for the same reason the totals are. */
const WINDOW = { from: 4, until: 18 } as const

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(latchedWeek: number, sinceWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career with the weight ON, parked on a week the pregnancy hazard really lands on.
 *
 *  ⚠⚠ ONE WORLD PER SEED, NOT ONE PER WEEK – the bench's own repair (`b3da0f89`: «the fixture
 *  built fifty-two worlds per seed … it now walks ONE world») applied to the fixture that taught
 *  it, after CI measured the cost: the per-week rebuild was up to 572 `createWorld` calls per seed,
 *  and the `w11-rearm` hunt blew the runner's 60 s default (green locally, red on 2 cores – the
 *  four `onTaskUpdate` birpc errors in that log were the same wedge's shadow). The safety argument
 *  is the bench's, verbatim: `rollPregnancy` mutates only on a hit and the draw is keyed on
 *  (seed, week) alone – so a miss leaves the world byte-clean for the next week, and the FIRST
 *  hit week per seed is identical to what the per-week shape found.
 *
 *  ⚠ ON A HIT THE WRONG `wants` REJECTS THE WHOLE SEED, not the week. That is not a shortcut: the
 *  only filter any caller passes is the VOICE, which is a function of the seed alone – every later
 *  week of the same seed would answer the same – and the hit has already mutated the world, so the
 *  honest continuation is a fresh seed either way. */
function expecting(base: string, wants: (world: WorldState) => boolean = () => true): WorldState {
  for (let i = 0; i < 300; i++) {
    const seed = i === 0 ? base : `${base}-${i}`
    const probe = createWorld(seed)
    const from = weekAtAge(probe, 24)
    const to = weekAtAge(probe, 35)
    const world = createWorld(seed, undefined, `c-${seed}`, undefined, undefined, true)
    world.season = []
    for (let w = from; w < to; w++) {
      world.week = w
      world.loveEpisodes = [married(w - 104, w - 52)]
      if (!pregnancyEligible(world)) continue
      rollPregnancy(world)
      if (world.pregnancy !== null) {
        if (wants(world)) return world
        break
      }
    }
  }
  throw new Error(`no seed from ${base} produced the pregnancy this case needs`)
}

/** Walk the whole loss window on a world that already carries a pregnancy, and answer the week the
 *  loss landed on – or `null` for a pregnancy that survived it. ⚠ It calls the ENGINE's own roll on
 *  every week rather than re-deriving the hazard, which is what makes §B a measurement of the
 *  shipped code rather than of this file's arithmetic. */
function lossWeekOf(world: WorldState): number | null {
  const conceived = world.pregnancy!.conceivedWeek
  for (let w = conceived; w < conceived + WINDOW.until + 2; w++) {
    world.week = w
    rollPregnancyLoss(world)
    if (world.pregnancy === null) return w
  }
  return null
}

// =================================================================================================
// A. THE CURVE – the study's totals, the study's window
// =================================================================================================

describe('wave 11 T4 A – the J-curve', () => {
  it('⭐ the rungs are ASCENDING and the read depends on it', () => {
    const ages = W.lossPerWeekByAge.map((r) => r.fromAge)
    expect([...ages].sort((a, b) => a - b), 'sorted, because the loop takes the LAST rung reached').toEqual(ages)
  })

  it('⭐⭐⭐ every per-week rate INTEGRATES to the study\'s own figure over the study\'s own window', () => {
    // ⚠⚠ THE CLAIM IS ARITHMETIC AND IS ASSERTED AGAINST THE TRANSCRIBED TOTALS: `(1 - p)^14` is the
    // chance of surviving all fourteen weeks, so `1 - (1 - p)^14` is the per-pregnancy risk the
    // study measured. A rate spread over the 39-week TERM would read ~3.6% here and go red.
    const weeks = WINDOW.until - WINDOW.from
    expect(weeks, 'fourteen weeks – the study\'s 6..20 gestational, on the conception clock').toBe(14)
    for (const rung of STUDY) {
      const perWeek = pregnancyLossChanceAt(rung.fromAge)
      const realised = 1 - Math.pow(1 - perWeek, weeks)
      expect(realised, `${rung.fromAge}+ integrates to the study's figure`).toBeCloseTo(rung.total, 6)
    }
  })

  it('⭐⭐ the J is a J – 35+ is half again on the floor, and 30–34 is barely above it', () => {
    // ⚠ THE SHAPE AND NOT THE SIZE, which is what makes this survive a retune: whatever the numbers
    // become, the climb at 35 is the finding a flat rate would have destroyed.
    const floor = pregnancyLossChanceAt(24)
    const middle = pregnancyLossChanceAt(30)
    const climb = pregnancyLossChanceAt(35)
    expect(middle, 'the middle band is above the floor').toBeGreaterThan(floor)
    expect(middle / floor, '...but only just – the J\'s flat bottom').toBeLessThan(1.2)
    expect(climb / floor, 'and the climb is half again on it').toBeGreaterThan(1.4)
  })

  it('⚠ an age under the first rung takes 0, and 0 means no draw at all', () => {
    expect(pregnancyLossChanceAt(23.9), 'under the window the curve is 0').toBe(0)
    expect(pregnancyLossChanceAt(0)).toBe(0)
  })

  it('⭐⭐ the hazard runs inside the study\'s window and nowhere else', () => {
    const world = expecting('w11-loss-window')
    const conceived = world.pregnancy!.conceivedWeek
    for (const [offset, wanted] of [
      [0, false], [WINDOW.from - 1, false], [WINDOW.from, true],
      [WINDOW.until - 1, true], [WINDOW.until, false], [30, false],
    ] as const) {
      world.week = conceived + offset
      expect(pregnancyLossEligible(world), `conception week ${offset}`).toBe(wanted)
    }
  })
})

// =================================================================================================
// B. ⭐⭐⭐ THE BOUNDARY LAW – age and the dice, and NOTHING the parent does
// =================================================================================================

describe('wave 11 T4 B – nothing the parent does reaches the hazard', () => {
  /** The five things that were available and are not read. ⚠ EACH ARM IS A REAL WORLD DIFFERENCE and
   *  not a flag: the plan really is a brutal one, the travel really is on, the spirit and bond
   *  really are at the ends of their scales, and the support grade really is the cold one. */
  const ARMS: { label: string; apply: (w: WorldState) => void }[] = [
    { label: 'the control', apply: () => {} },
    { label: 'a brutal training block', apply: (w) => { w.plan = { train: 100, rest: 0 } as WeekPlan } },
    { label: 'all the rest in the world', apply: (w) => { w.plan = { train: 0, rest: 100 } as WeekPlan } },
    { label: 'her spirit on the floor', apply: (w) => { w.spirit = 5 } },
    { label: 'her spirit at the ceiling', apply: (w) => { w.spirit = 100 } },
    { label: 'a cold house', apply: (w) => { w.bond = 5 } },
    { label: 'a close one', apply: (w) => { w.bond = 100 } },
    { label: 'he answered cold', apply: (w) => { if (w.pregnancy) w.pregnancy.support = 'cold' } },
    { label: 'he answered warm', apply: (w) => { if (w.pregnancy) w.pregnancy.support = 'warm' } },
    { label: 'the coach travels everywhere', apply: (w) => { w.coachOnEventWeeks = true; w.coachOnJuniorEvents = true } },
  ]

  it('⭐⭐⭐ the realised hazard is IDENTICAL across ten arms, on twelve shared seeds', () => {
    // ⚠⚠ THIS IS THE DESIGN LAW AS A PROPERTY AND NOT AS A COMMENT. `pregnancyLossChanceAt` takes no
    // world, so the claim is true by construction today – and this case is what keeps it true after
    // somebody re-plumbs the call, because it measures the WEEK THE LOSS LANDED through the shipped
    // roll rather than the number the function returns.
    let losses = 0
    for (let i = 0; i < 12; i++) {
      const base = expecting(`w11-boundary-${i}`)
      const weeks = ARMS.map((arm) => {
        const world = structuredClone(base)
        arm.apply(world)
        return lossWeekOf(world)
      })
      if (weeks[0] !== null) losses++
      for (let a = 1; a < ARMS.length; a++) {
        expect(weeks[a], `seed ${i}: ${ARMS[a].label} moved the dice`).toBe(weeks[0])
      }
    }
    // ⚠⚠ AND THE SWEEP IS NOT VACUOUS, which is the half a boundary pin most easily loses: twelve
    // pregnancies that all survived would make «identical» true and meaningless. At ~10% per
    // pregnancy a corpus of twelve is expected to contain one or two.
    expect(losses, 'the corpus really did lose at least one – otherwise this pin proves nothing')
      .toBeGreaterThan(0)
  })
})

// =================================================================================================
// C. ZERO DRAWS – the switch, the window, and the absent pregnancy
// =================================================================================================

describe('wave 11 T4 C – a refusal is zero draws and never a discarded one', () => {
  it('⭐⭐⭐ the switch OFF takes no draw and the same seed with it ON does', () => {
    const on = expecting('w11-switch-loss')
    const off = structuredClone(on)
    setWeightEnabled(off, false)
    const conceived = on.pregnancy!.conceivedWeek
    on.week = conceived + WINDOW.from
    off.week = conceived + WINDOW.from
    expect(pregnancyLossEligible(on), 'the weight is on and the week is inside the window').toBe(true)
    expect(pregnancyLossEligible(off), 'and the switch alone is what refuses').toBe(false)
  })

  it('⚠ no pregnancy, no hazard – on every week of a career that never had one', () => {
    const world = createWorld('w11-no-preg', undefined, 'c', undefined, undefined, true)
    for (const w of [0, 100, 500, 1200]) {
      world.week = w
      expect(pregnancyLossEligible(world), `week ${w}`).toBe(false)
    }
  })

  it('⚠ the weight OFF leaves a pregnancy to run to term, week after week', () => {
    const world = expecting('w11-off-runs')
    setWeightEnabled(world, false)
    const due = world.pregnancy!.dueWeek
    expect(lossWeekOf(world), 'nothing ends it').toBe(null)
    expect(world.pregnancy, 'and the record is exactly where it was').not.toBe(null)
    expect(world.pregnancy!.dueWeek, 'due on its own week still').toBe(due)
  })
})

// =================================================================================================
// D. WHAT A LOSS DOES – and what it deliberately does not
// =================================================================================================

describe('wave 11 T4 D – the week it ends', () => {
  /** A career that really loses one, found on the engine's own dice. */
  function lost(base: string): { world: WorldState; week: number } {
    for (let i = 0; i < 300; i++) {
      const world = expecting(`${base}-${i}`)
      const week = lossWeekOf(world)
      if (week !== null) return { world, week }
    }
    throw new Error(`no seed from ${base} lost a pregnancy`)
  }

  it('⭐⭐⭐ clears the record, keeps the week, and lands the mark', () => {
    const { world, week } = lost('w11-lost')
    expect(world.pregnancy, 'no birth and no comeback machinery – the record is gone').toBe(null)
    expect(world.pregnancyLossWeeks, 'and the week is kept, because the record cannot keep it').toEqual([week])
    expect(world.spiritShock, 'the mark is on her').toEqual({ week, kind: 'loss' })
    expect(world.children, 'and no child was born').toEqual([])
    expect(world.comeback, 'and there is no comeback to come back from').toBe(null)
  })

  it('⭐⭐ the hazard is re-armed behind the drafted cooldown, read off the LIST', () => {
    // ⚠ THE COOLDOWN IS THE `pregnancyEligible` CLAUSE AND NOT A SECOND GATE – the spec's §3:
    // «reading the same eligibility machinery wave 9 built».
    const { world, week } = lost('w11-rearm')
    world.week = week + W.lossCooldownWeeks - 1
    expect(pregnancyEligible(world), 'one week short of the cooldown, still refused').toBe(false)
    world.week = week + W.lossCooldownWeeks
    expect(pregnancyEligible(world), 'and open on the week the cooldown names').toBe(true)
  })

  it('⚠ the cooldown is GENTLER than the birth\'s, which is the drafted shape', () => {
    expect(W.lossCooldownWeeks, 'drafted 26 against the birth\'s 52')
      .toBeLessThan(ECONOMY.motherhood.repeatCooldownWeeks)
  })
})

// =================================================================================================
// E. THE WORDS – open tells, private is silence, and the silence is the telling
// =================================================================================================

describe('wave 11 T4 E – both branches', () => {
  function lostWithVoice(base: string, open: boolean): WorldState {
    for (let i = 0; i < 400; i++) {
      const world = expecting(`${base}-${i}`, (w) => {
        const voice = temperamentFor(w.seed, w.dynasty?.motherTemperament)
        return open === (voice === 'sunny' || voice === 'fiery')
      })
      if (lossWeekOf(world) !== null) return world
    }
    throw new Error(`no ${open ? 'open' : 'private'} seed from ${base} lost a pregnancy`)
  }

  it('⭐⭐ an OPEN girl tells him – one kept row, in her own voice', () => {
    const world = lostWithVoice('w11-open', true)
    const rows = world.events.filter((e) => e.type === 'life' && e.week === world.pregnancyLossWeeks[0])
    expect(rows, 'she said it, once').toHaveLength(1)
    expect(rows[0].keep, 'and the row is kept – this arc outlives the sixty-week prune').toBe(true)
    expect(rows[0].text.length, 'a real sentence').toBeGreaterThan(40)
  })

  it('⭐⭐⭐ a PRIVATE girl says NOTHING, and the absence is the telling', () => {
    // ⚠⚠ RULED 22.09 (question 2): «both branches build – open tells, private is silence». The
    // design's own sentence: «the parent learns from a silence, which is a thing this game can do
    // and almost no other kind of game can». A row here would delete the strongest scene the whole
    // sketch has – so this case asserts an ABSENCE, which is the only way to hold one.
    const world = lostWithVoice('w11-private', false)
    const rows = world.events.filter((e) => e.type === 'life' && e.week === world.pregnancyLossWeeks[0])
    expect(rows, 'nothing is said').toHaveLength(0)
    // ...and the loss really did happen, which is what stops this case passing vacuously.
    expect(world.pregnancy, 'the pregnancy is gone all the same').toBe(null)
    expect(world.spiritShock?.kind, 'and the mark is on her whether or not she said so').toBe('loss')
  })

  it('⚠ no line links the loss to anything he said – RULED 22.09, question 5', () => {
    // The boundary law's content half: if the loss follows a cold «too early», the game does not
    // link them. A sweep over the words rather than over one career, because the claim is about the
    // POOL: no cell may name the answer, the card, the tennis or a cause.
    const world = lostWithVoice('w11-nolink', true)
    const text = world.events.filter((e) => e.type === 'life').map((e) => e.text).join(' ')
    for (const banned of ['too early', 'tennis', 'because', 'ranking', 'fault', 'told you so']) {
      expect(text.toLowerCase(), `the loss row may not say «${banned}»`).not.toContain(banned)
    }
  })

  it('⚠ the draw is the same whichever way the parent answered the card', () => {
    // §B's sweep, pointed at the ONE input a reader is most likely to think is in the read-set,
    // because it is on the pregnancy record itself.
    const base = expecting('w11-support-arm')
    const weeks = (['warm', 'measured', 'cold'] as const).map((grade) => {
      const world = structuredClone(base)
      world.pregnancy!.support = grade
      return lossWeekOf(world)
    })
    expect(weeks[1], 'measured').toBe(weeks[0])
    expect(weeks[2], 'cold').toBe(weeks[0])
  })
})
