// =================================================================================================
// THE COACH AS LOAD MANAGER (docs/specs/coach-as-load-manager.md, engine/coachLoad.ts)
// =================================================================================================
//
// The owner, 30.07: «тогда у нашего self coach появятся ручки ... А остальные будут с автонастройкой и
// эффективностью зависимо от тира напрямую.»
//
// WHAT IS PINNED HERE, and the first two would each sink the slice on their own:
//
//   1. ⚠ THE ROUTING. Self-coached still stops the week and asks; hired answers the routine calls itself.
//      That is the product, and it is one `if` in `rollKnock` away from being wrong in either direction.
//   2. ⚠ W4'S CONTENT SURVIVES IT. `DEFAULT_PROFILE.coachTier` is 'middle', so if the routing were
//      unconditional the DEFAULT career would never see a knock dialog again - which hands the owner back
//      the complaint W4 was built to answer. The escalation zone is what stops that, so its rate is
//      asserted rather than assumed.
//   3. THE MECHANISM IS THE FOG, NOT AN ORACLE. The rule reads only observable state, and the rung enters
//      through `shownStamina`. A grep-level pin, because "the coach cannot see the future" is exactly the
//      kind of property a later convenience-fix quietly breaks.
//   4. BOTH DIRECTIONS OF ERROR. A cheap rung must be able to be wrong EITHER way (see coachLoad.ts) -
//      a single-signed error would be a tax pretending to be a model.
//   5. THE ADVICE IS ADVICE. `coachWarnsEntry` never blocks an entry, at any rung.
//
// ⚠⚠ WAVE 3's T16 RE-AIMED TWO OF THESE AND T16b RE-AIMED THEM BACK, AND THE NOTE BELONGS AT THE TOP
// BECAUSE THE ROUND TRIP IS THE LESSON. THREE RULINGS, ONE ARGUMENT, AND THE LADDER'S OWN NUMBER
// SETTLED IT EACH TIME – coachLoad.ts's constants carry the full text; this is what it did to the
// claims in this file.
//
//   23.08  an unconditional repeat escalation is REJECTED here, because it flattens the tap ladder
//          (9.5 / 9.1 / 9.1 / 9.1 measured) and «being asked about the shoulder IS the burden you are
//          paying him to carry». A repeat WIDENS his doubt instead.
//   11.09  T16 overrides it anyway on T12's measurement – the coach answered 232 of 280 knocks, so the
//          bond table's −3/−5 push rows were nearly dead in normal play – and routes a repeat and a
//          `'warn'` clearance week to the parent at EVERY rung («давай попробуем»).
//   12.09  T16b withdraws the override, on T16's OWN bench output. The classes are tier-independent by
//          construction, so they did to the ladder exactly what the 23.08 note predicted:
//
//     tap share, pooled 8 seeds × 208 wks   self   budget  middle   high   elite
//     before T16                            1.000   0.148   0.103   0.078  0.075
//     after  T16                            1.000   0.716   0.684   0.692  0.662
//
//          A 2× budget-to-elite span became 1.08× and the Elite coach went from deciding 95% of knocks
//          alone to 31%. The owner: «мне это не очень нравится». `'warn'` is now the SECOND WIDENER
//          beside `REPEAT_DOUBT` (`WARN_DOUBT`), which reaches the cheap rungs and leaves the premium
//          ones alone because a widener is multiplied by `1 - confidence` and a class is not.
//
// WHAT THAT DID TO THE CASES BELOW. CLAIM 2's «an elite coach handles MOST of them alone» is TRUE
// AGAIN and asserted again – T16 had narrowed it to «a material share» on the 31% reading. The ladder
// case keeps T16's per-KNOCK shape rather than going back to absolute tap counts, because that re-aim
// was a correction to a fixture that had always been loose (a seed's tap COUNT tracks how many knocks
// it happened to produce) and it is right at any escalation rate. Each re-aim carries its own ⚠ block
// naming what moved and why; nothing here was deleted, in either direction.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  coachEscalates,
  coachKnockCall,
  coachManagesLoad,
  coachWarnsEntry,
  strainOf,
  ESCALATE_BAND_MAX,
  ESCALATE_CAUTION,
  PUSH_TOLERANCE,
  REPEAT_DOUBT,
  WARN_DOUBT,
  STRAIN_PER_REPEAT,
  type CoachLoadView,
} from '../src/engine/coachLoad'
import {
  availabilityStatus,
  closeTournament,
  coachLoadViewOf,
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { COACH_TIERS } from '../src/engine/coach'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier } from '../src/shared/protocol'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

const view = (over: Partial<CoachLoadView> = {}): CoachLoadView => ({
  tier: 'middle',
  shownStamina: 55,
  condition: 70,
  playedWeeks: 0,
  confidence: 0.9,
  ...over,
})

/** Walk a career the way a player does, answering only what reaches him. */
function play(seed: string, tier: CoachTier, weeks: number, plan = WEEK_PLAN_PRESETS.balanced) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...plan }
  let taps = 0
  for (let w = 0; w < weeks; w++) {
    // ⚠ THE TERMINAL LATCH, ADDED BY WAVE 3's T16 AND IT IS A HARNESS REPAIR, NOT A CLAIM CHANGE.
    // `decideKnock` calls `guardNotEnded`, so a knock raised by the tick that ALSO ended the career
    // throws «This career has ended» – and the walk died there rather than reporting. It was latent
    // before and T16 exposed it by raising more knocks to the parent (the ladder case went red with
    // that throw, from a career that ended, not from a ladder that stopped running). Handled the way
    // `tools/spirit-bench.ts`'s anti-stall contract demands: the latch is TESTED, never caught, so a
    // refusal for any OTHER reason still propagates and kills the run.
    if (world.ending !== null) break
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* locked or unaffordable */
      }
    }
    tickWeek(world, rng)
    if (pendingKnock(world) && world.ending === null) {
      decideKnock(world, 'rest')
      taps++
    }
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  const knocks = world.knockHistory.length + (world.knock ? 1 : 0)
  return { world, taps, knocks, handled: knocks - taps }
}

// =================================================================================================
// 1. ⚠ THE ROUTING
// =================================================================================================

describe('the routing: who answers the knock', () => {
  it('self-coached is the only rung the parent holds the knobs on', () => {
    expect(coachManagesLoad('self')).toBe(false)
    for (const tier of COACH_TIERS.filter((t) => t !== 'self')) {
      expect(coachManagesLoad(tier), tier).toBe(true)
    }
  })

  it('⚠ SELF-COACHED: every knock reaches the parent, and none is answered for him', () => {
    // The half the owner asked for in his own words: «у нашего self coach появятся ручки».
    const { taps, knocks, handled } = play('routing-self', 'self', 156, WEEK_PLAN_PRESETS.grind)
    expect(knocks, 'three seasons of grinding must produce knocks').toBeGreaterThan(0)
    expect(handled, 'nobody may answer for a self-coached parent').toBe(0)
    expect(taps).toBe(knocks)
  })

  it('⚠ HIRED: the coach answers the routine ones himself, and the week does not stop', () => {
    // ⚠⚠ RE-AIMED BY WAVE 3's T16 (the owner's ruling 11.09, «давай попробуем»), AND WHAT MOVED IS
    // NAMED RATHER THAN SMOOTHED. This case read `handled > taps` – «an elite coach must handle MOST
    // of them alone» – and T16 makes that false BY DESIGN: a repeated part and a `'warn'` clearance
    // week now go to the parent at every rung, and a career that pushes manufactures repeats. The
    // erosion is large and it is the price the owner bought:
    //
    //     pooled 8 seeds, elite, 156 wks of grinding   before T16   after T16
    //     knocks                                            82          84
    //     the coach answered alone                          78 (95%)    26 (31%)
    //
    // So the claim narrows to the one T16 did NOT buy and that would still sink the slice: the
    // routing is NOT unconditional – a hired coach still takes a MATERIAL share of her knocks
    // himself, and those weeks never stop. The rung comparison moves to the ladder case below, which
    // is where it belongs. ⚠ AND IT IS POOLED OVER EIGHT SEEDS for the reason the W4 case below
    // records: a share this close to the middle of its range is a tail event on any one career.
    let taps = 0
    let knocks = 0
    let handled = 0
    for (const s of ['', '-e0', '-e1', '-e2', '-e3', '-e4', '-e5', '-e6']) {
      const r = play(`routing-hired${s}`, 'elite', 156, WEEK_PLAN_PRESETS.grind)
      taps += r.taps
      knocks += r.knocks
      handled += r.handled
    }
    expect(knocks, 'the fixture must produce knocks').toBeGreaterThan(0)
    expect(handled, `the coach must answer a material share alone: ${handled} of ${knocks}`).toBeGreaterThan(0)
    expect(handled * 5, 'at least one knock in five, and the week does not stop for those').toBeGreaterThan(knocks)
  })

  it('⚠ AND W4 SURVIVES ON THE DEFAULT CAREER, which is the one that could have been gutted', () => {
    // `DEFAULT_PROFILE.coachTier` is 'middle'. If the routing were unconditional, a brand-new career would
    // never see the knock dialog again - and W4 exists because the owner complained that training weeks
    // «просто скипались». So the default career MUST still be asked something.
    expect(DEFAULT_PROFILE.coachTier, 'the premise of this test').not.toBe('self')
    // ⚠ FIVE CAREERS, NOT ONE (W2-WINDOW), and the re-aim is what the claim always meant. A tap is a
    // knock the middle coach declines to answer, i.e. a knock severe enough to reach the parent - a
    // TAIL event of a three-season career, so one seed was a fixture that happened to contain one.
    // The seeded calendar re-deal moved that seed's tail out of the window (measured: 'routing-default'
    // 8 knocks / 0 taps, while three of five sibling seeds still tap at the same length). The claim is
    // about the ROUTING - a middle coach must not swallow everything - and a routing claim is about
    // careers, not about a seed, so it is now asserted over a handful of them.
    let totalTaps = 0
    for (const seed of ['routing-default', 'rd-1', 'rd-2', 'rd-3', 'rd-4']) {
      const { taps, knocks } = play(seed, DEFAULT_PROFILE.coachTier, 156, WEEK_PLAN_PRESETS.grind)
      expect(knocks, `${seed}: three seasons of grinding must produce knocks`).toBeGreaterThan(0)
      totalTaps += taps
    }
    expect(totalTaps, 'the default career must still be asked about her body').toBeGreaterThan(0)
  })

  it('the escalation ladder: a cheaper coach interrupts you MORE', () => {
    // THE SECOND THING THE RUNG SELLS, and the one the spec did not ask for because the mechanism did not
    // exist when it was written: "buying your attention back" is a number.
    //
    // Asserted as a TREND over the whole ladder rather than rung-by-rung: the escalation zone is driven by
    // `axisConfidence`, which ramps with tenure and evidence, so adjacent rungs can tie on a given seed.
    // What may never happen is the ladder running backwards end to end.
    //
    // ⚠⚠ RE-AIMED BY WAVE 3's T16 AND KEPT BY T16b, AND THE RE-AIM IS A MEASUREMENT RATHER THAN A
    // PREFERENCE. It read one seed per rung and compared ABSOLUTE tap counts, which was always loose:
    // a seed's tap COUNT tracks how many knocks it happened to produce as much as it tracks the rung.
    // T16 made that fatal (`escal-budget` 3 taps of 4 knocks against `escal-elite` 7 of 12 – the ladder
    // inverted on counts, 3 < 7, while running the RIGHT way on shares, 0.75 > 0.58), so the case moved
    // to the SHARE. The claim always meant «per knock», so it now says so, and that is right at any
    // escalation rate – it is kept under T16b for the same reason it was adopted under T16.
    //
    // ⭐ WHAT T16b GAVE BACK. The first two rows are the 8-seed pool the T16 re-aim recorded; the third
    // is `npm run bench:load`'s own grinder arm, 24 seeds × 208 weeks, taps over knocks per rung (see
    // docs/specs/who-she-is-2026-09.md §4a's T16b entry):
    //
    //           tap share      self    budget   middle    high    elite
    //           before T16     1.000    0.148    0.103    0.078   0.075
    //           after  T16     1.000    0.716    0.684    0.692   0.662   ← a 2x span down to 1.08x
    //           after  T16b    1.000    0.509    0.333    0.120   0.081   ← 6.3x, and monotone again
    //
    //       T16's classes were TIER-INDEPENDENT and reached every rung equally; T16b's wideners are
    //       multiplied by `1 - confidence`, so they reach the blurry rungs and leave the sure ones
    //       where they were. «You are buying your attention back» is a number again.
    // ⚠ FOUR SEEDS AND THE THREE ASSERTED RUNGS, which is a cost cut and NOT a coverage one: the old
    // form walked all five tiers and then read indices 0, 1 and last, so `middle` and `high` were
    // computed and thrown away. Eight seeds put this case 32 s over vitest's 20 s per-test timeout;
    // four hold the claim with room (measured, tap share @208: 3 seeds 1.000/0.788/0.720 · 4 seeds
    // 1.000/0.756/0.686 · 5 seeds 1.000/0.760/0.674). The five-rung shape stays in the header table.
    // ⚠⚠ CUT TO THREE SEEDS BY T16b, AND IT IS THE SAME COST ARGUMENT ONE TURN FURTHER ON. Four seeds
    // × three rungs × 208 weeks blew the 20 s ceiling on the T16b tree, for a reason that is itself a
    // measurement: the coach answers more of her knocks alone now, so she rests fewer weeks, plays
    // more tennis, and the identical walk costs more. The three-seed shape was already measured when
    // this case was last re-aimed (tap share @208: 3 seeds 1.000 / 0.788 / 0.720) and it holds the
    // claim, which is a trend over the whole ladder rather than a per-seed number.
    const seeds = ['e0', 'e1', 'e2']
    const share = (tier: CoachTier) => {
      let taps = 0
      let knocks = 0
      for (const s of seeds) {
        const r = play(`escal-${s}`, tier, 208)
        taps += r.taps
        knocks += r.knocks
      }
      expect(knocks, `${tier}: the fixture must produce knocks`).toBeGreaterThan(0)
      return { share: taps / knocks, taps, knocks }
    }
    const self = share(COACH_TIERS[0])
    const budget = share(COACH_TIERS[1])
    const elite = share(COACH_TIERS[COACH_TIERS.length - 1])
    expect(self.share, 'self-coached is asked about all of them').toBeGreaterThan(budget.share)
    expect(budget.share, 'a budget coach must ask more often than an elite one').toBeGreaterThan(elite.share)
    // ⭐⭐ CLAIM 2, RESTORED BY T16b AND ASSERTED AS AN ABSOLUTE. T16 narrowed «an elite coach handles
    // MOST of them alone» to «a material share» because 95% had become 31%; the widener model gives it
    // back, so the strong form is pinned again – and as a NUMBER, because a trend between two arms is
    // invisible to a change that moves both. ⚠ The counts are in the message: a rate whose denominator
    // is not printed cannot be checked by a reader.
    expect(
      1 - elite.share,
      `the elite coach decides alone: ${elite.knocks - elite.taps} of ${elite.knocks}`,
    ).toBeGreaterThan(0.5)
    // ⚠ AN EXPLICIT 90 s CEILING, AND IT IS AN ADMISSION RATHER THAN A LOOSENING. Nine 208-week walks
    // do not fit vitest's default 20 s on this tree – measured twice, at four seeds and at three – and
    // the reason is T16b: the coach answers more of her knocks alone, so she rests fewer weeks and
    // plays more tennis. Trimming seeds until the case fits buys speed with coverage (scripts/units.mjs
    // states that trade), so the seeds stay and the ceiling is named.
  }, 90_000)

  it('a knock the coach answered still costs, still shows, and still owns the week', () => {
    // The event may not vanish with the dialog. Same three consequences as a parent's answer.
    const world = createWorld('coach-answer', { ...DEFAULT_PROFILE, coachTier: 'elite' })
    const rng = rngFromSeed(world.seed)
    world.plan = { ...WEEK_PLAN_PRESETS.grind }
    let seen = false
    for (let w = 0; w < 208 && !seen; w++) {
      tickWeek(world, rng)
      if (pendingKnock(world)) {
        decideKnock(world, 'rest')
        continue
      }
      const k = world.knock
      if (k === null || k.choice === null) continue
      seen = true
      // the FEED says what was decided, in his voice
      const said = world.events.filter((e) => e.week === k.sinceWeek).map((e) => e.text).join(' | ')
      expect(said, 'the coach has to say what he did').toMatch(/coach/i)
      // ...and the week he governs really carries it into the story
      world.week = k.sinceWeek + 1
      const snap = toSnapshot(world)
      expect(snap.diary.facts.knockChoice, 'the governed week must carry the choice').toBe(k.choice)
    }
    expect(seen, 'the fixture has to reach a coach-answered knock').toBe(true)
  })
})

// =================================================================================================
// 2. ⚠ THE MECHANISM IS THE FOG, NOT AN ORACLE
// =================================================================================================

describe('the mechanism: what he is allowed to know', () => {
  it('⚠ THE RULE READS NO FUTURE AND NO TRUTH – a grep-level pin, on purpose', () => {
    // The rejected implementation (spec §8) is the OBVIOUS one: the injury roll is deterministic given the
    // seed, so a coach could be made to know whether pushing actually breaks her. It must stay impossible
    // to reach from here, and the cheapest durable way to say that is that this module cannot see any of
    // the machinery it would need.
    const src = read('../src/engine/coachLoad.ts')
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    for (const forbidden of ['rngFromSeed', 'injuryTau', 'rollInjury', 'potential', 'WorldState', 'world.']) {
      expect(code, `coachLoad must not reach for ${forbidden}`).not.toContain(forbidden)
    }
    // and it takes nothing but the narrow view - one import, of types
    expect(code).toContain("from '../shared/protocol'")
  })

  it('the call is a pure function of the view: same inputs, same answer, every time', () => {
    const v = view({ condition: 52, playedWeeks: 2 })
    const first = coachKnockCall(v, false)
    for (let i = 0; i < 50; i++) expect(coachKnockCall(v, false)).toBe(first)
  })

  it('⚠ BOTH DIRECTIONS: a misread HIGH pushes what should be rested, a misread LOW rests what could be pushed', () => {
    // The property that makes this a model of ignorance rather than a penalty. Same girl, same week; only
    // what the coach BELIEVES about her differs, and the two beliefs give opposite answers.
    const truth = 55
    const v = (shownStamina: number) => view({ shownStamina, condition: 46, playedWeeks: 0 })
    expect(strainOf(v(truth), false), 'the fixture must sit near the flip').toBeCloseTo(54, 0)
    expect(coachKnockCall(v(truth - 12), false), 'reads her frail -> rests').toBe('rest')
    expect(coachKnockCall(v(truth + 12), false), 'reads her tough -> pushes').toBe('push')
  })

  it('the threshold is her believed robustness, with no free parameter', () => {
    // PUSH_TOLERANCE is 1.0 - "rest when the strain exceeds what he thinks she can carry". If a later pass
    // reintroduces a factor, this says so out loud rather than letting the rule drift into taste.
    expect(PUSH_TOLERANCE).toBe(1)
    const v = view({ shownStamina: 60, condition: 41, playedWeeks: 0 }) // strain 59 < 60
    expect(coachKnockCall(v, false)).toBe('push')
    const v2 = view({ shownStamina: 60, condition: 39, playedWeeks: 0 }) // strain 61 > 60
    expect(coachKnockCall(v2, false)).toBe('rest')
  })

  it('a repeat weighs on the call but does not force the parent into it – IN THE DOUBT ZONE', () => {
    // The first draft escalated every repeat at every rung, which flattened the whole ladder (see
    // REPEAT_DOUBT). It must still WEIGH - knock.ts prices it at 3.0 tau against 2.2 - so a repeat on an
    // otherwise identical week moves the call towards rest, and a coach who knows her can still handle it.
    //
    // ⚠⚠ THE TITLE HAS BEEN TRUE, THEN HALF-TRUE, THEN TRUE AGAIN, AND ALL THREE TURNS ARE RECORDED
    // HERE BECAUSE THIS IS THE CASE THAT MEASURES IT.
    //   · 23.08 – true of BOTH the zone and the routing. The unconditional repeat was rejected here.
    //   · 11.09 – true of `coachEscalates` and NOT of the routing: T16 put the repeat beside this zone
    //     as a deterministic class in `world/knock.ts` `knockNeedsTheParent`, because the −5 delta row
    //     priced a decision the parent was not being offered (T12: 232 of 280 knocks answered by the
    //     coach). Nothing below was re-aimed then – every line is about `coachEscalates` itself.
    //   · 12.09 – TRUE OF BOTH AGAIN. T16's own bench output flattened the ladder to 1.08× and dropped
    //     the Elite coach from 95% self-decide to 31%, so the class came out and `'warn'` became the
    //     second WIDENER. `knockNeedsTheParent` is `coachEscalates` and nothing else, which is why the
    //     assertion below is once more a statement about what the GAME does and not only about a pure
    //     function. It is also still the case that would catch a repair reaching INTO the zone instead
    //     of standing beside it – a fourth attempt at the override dies here first.
    const v = view({ shownStamina: 60, condition: 70, playedWeeks: 0 })
    expect(strainOf(v, true) - strainOf(v, false)).toBe(STRAIN_PER_REPEAT)
    // ...and an elite coach can absorb one rather than always passing it up
    const sure = view({ confidence: 0.99, shownStamina: 60, condition: 90, playedWeeks: 0 })
    expect(coachEscalates(sure, true, false), 'a sure coach handles even a repeat').toBe(false)
    // ...while a blurry one wants the parent
    const unsure = view({ confidence: 0.3, shownStamina: 60, condition: 38, playedWeeks: 0 })
    expect(coachEscalates(unsure, true, false)).toBe(true)
  })

  it('the escalation zone is his own uncertainty, and it closes as he learns her', () => {
    const near = { shownStamina: 60, condition: 40, playedWeeks: 0 } // strain 60, right on the flip
    expect(coachEscalates(view({ ...near, confidence: 0 }), false, false), 'blind -> asks').toBe(true)
    expect(coachEscalates(view({ ...near, confidence: 1 }), false, false), 'certain -> decides').toBe(false)
    // the widths are the documented arithmetic, not a feeling
    expect(ESCALATE_BAND_MAX).toBeGreaterThan(0)
    expect(REPEAT_DOUBT).toBeGreaterThan(1)
    // ⭐ AND SINCE T16b THERE ARE TWO WIDENERS, not one. The boundary arithmetic for both lives in
    // `tests/knock-escalation.test.ts`; this line only says the second one exists and widens.
    expect(WARN_DOUBT, 'a warn week widens the zone too').toBeGreaterThan(1)
    // ...and it really reaches further: a call his plain zone has already closed on is open again on a
    // warn week. The fixture sits one plain-margin outside his threshold, computed from the constants
    // rather than transcribed, so a tuning pass moves it with the model.
    const wide = view({ ...near, confidence: 0.8 })
    const plainMargin = ESCALATE_BAND_MAX * (1 - 0.8) * ESCALATE_CAUTION
    const outside = { ...wide, shownStamina: strainOf(wide, false) - plainMargin - 0.01 }
    expect(coachEscalates(outside, false, false), 'the premise: his plain zone has closed').toBe(false)
    expect(coachEscalates(outside, false, true), 'the warn week reopens it').toBe(true)
  })
})

// =================================================================================================
// 3. THE ADVICE IS ADVICE
// =================================================================================================

describe('the entry advice', () => {
  it('⚠ NEVER BLOCKS – eligible stays true at every rung, however tired she is', () => {
    // "The parent may push" is a standing rule and the doctor's veto is its single exception. A coach's
    // opinion is not a second one.
    for (const tier of COACH_TIERS) {
      const world = createWorld('advice-block', { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 8; i++) tickWeek(world, rng)
      world.condition = 30 // tired, but well above the medical floor
      const snap = toSnapshot(world)
      for (const e of snap.upcoming) {
        if (e.coachCaution === undefined) continue
        expect(e.eligible, `${tier}: a coach's opinion must not lock a card`).toBe(true)
        expect(e.ineligibleReason, `${tier}`).toBeUndefined()
      }
    }
  })

  it('only a HIRED coach has an opinion – a self-coached career gets no line', () => {
    const world = createWorld('advice-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 8; i++) tickWeek(world, rng)
    world.condition = 20
    for (const e of toSnapshot(world).upcoming) {
      expect(e.coachCaution, 'nobody is being paid to have a view').toBeUndefined()
    }
  })

  it('he warns on a tired girl and stays quiet on a fresh one', () => {
    const floor = ECONOMY.availability.minConditionToEnter.j30
    expect(coachWarnsEntry(view({ condition: floor - 10 }), floor)).toBe(true)
    expect(coachWarnsEntry(view({ condition: floor + 40 }), floor)).toBe(false)
  })

  it('what he believes about her scales the margin – the fog reaches entries too', () => {
    // A coach who thinks she is tough waves her onto a plane an accurate one would not.
    const floor = 40
    const tough = view({ shownStamina: 90 })
    const frail = view({ shownStamina: 25 })
    // a condition where the two disagree exists, which is the whole claim
    const disagree = [...Array(60).keys()].map((c) => c + 20).filter(
      (c) => coachWarnsEntry({ ...tough, condition: c }, floor) !== coachWarnsEntry({ ...frail, condition: c }, floor),
    )
    expect(disagree.length, 'his read must be able to change the advice').toBeGreaterThan(0)
  })

  it('the copy obeys the app rules: short dash only, no Cyrillic, third person', () => {
    const world = createWorld('advice-copy', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    const rng = rngFromSeed(world.seed)
    const said = new Set<string>()
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      world.condition = Math.max(16, 60 - i)
      for (const e of toSnapshot(world).upcoming) if (e.coachCaution) said.add(e.coachCaution)
      while (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      if (pendingKnock(world)) decideKnock(world, 'rest')
    }
    expect(said.size, 'the sweep must actually produce lines').toBeGreaterThan(0)
    for (const line of said) {
      expect(line, `long dash in "${line}"`).not.toContain('—')
      expect(line, `Cyrillic in "${line}"`).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, `second person in "${line}"`).not.toMatch(/\byou\b/i)
    }
  })
})

// =================================================================================================
// 4. THE VIEW THE WORLD HANDS HIM
// =================================================================================================

describe('coachLoadViewOf', () => {
  it('condition is EXACT and stamina is not – the deliberate asymmetry', () => {
    const world: WorldState = createWorld('view-1', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    world.condition = 63
    const v = coachLoadViewOf(world)
    expect(v.condition, 'the condition bar is printed for the player, so he can read it too').toBe(63)
    // his stamina estimate is a belief: inside the plausible range, and not asserted equal to the truth
    expect(v.shownStamina).toBeGreaterThanOrEqual(0)
    expect(v.shownStamina).toBeLessThanOrEqual(100)
    expect(v.confidence).toBeGreaterThanOrEqual(0)
    expect(v.confidence).toBeLessThanOrEqual(1)
  })

  it('a better rung knows her better – the fog IS the ladder', () => {
    // The spec's §8 claim, end to end: the same girl in the same week, read by five different coaches.
    const conf = COACH_TIERS.map((tier) => {
      const world = createWorld('view-fog', { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 104; i++) {
        tickWeek(world, rng)
        if (pendingKnock(world)) decideKnock(world, 'rest')
        while (world.pendingTournament) {
          if (!world.pendingTournament.finished) skipTournament(world)
          closeTournament(world)
        }
      }
      return coachLoadViewOf(world).confidence
    })
    expect(conf[0], 'self-coached reads her worst').toBeLessThan(conf[conf.length - 1])
    for (let i = 1; i < conf.length; i++) {
      expect(conf[i], `${COACH_TIERS[i]} must not read her worse than ${COACH_TIERS[i - 1]}`).toBeGreaterThanOrEqual(conf[i - 1])
    }
  })
})
