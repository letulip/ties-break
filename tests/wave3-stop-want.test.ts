// =================================================================================================
// WAVE 3, T17 – THE STOP-WANT ARC: A PRICED TAIL, A READABLE ROOT, AND THE COACH'S CALL
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T17 is the build order; the ruling behind it is the
// owner's own playtest of 11.09 – his world #5, healthy, close home, met «I want to stop» at
// eighteen. Under the old weights that was no tail at all: `stop` was `lean(worn)`, every lean floors
// at 1.0, so P(stop) bottomed out at ~22–25% at EVERY state and a quarter of all players met the
// shock at the biggest moment of the career with no root they could read.
//
// The three claims, because every section below is one of them:
//
//   1. THE ARITHMETIC (§A). `stop = floor + gainWorn×worn + gainStrained×strained`, so the want has
//      roots: ~3–4% unsupported, a real lean for a worn girl in a strained home, dominant for a
//      drained girl in a cold one. `college` and `tour` are untouched, the three-inputs fence is
//      untouched, and the floor is **ε > 0 and never zero** – the Barty tail stays a feature.
//   2. THE DRIVER (§B, §C). Derived once from the same two roots, spent on WORDING ONLY: it never
//      re-weights the draw it explains, and it keys her `stop` line and the coach's read.
//   3. THE COUNSEL ARC (§D). Only on a `stop`, answering her raises `'fork-counsel'` – blocking – so
//      `answerFork` refuses until the coach has been heard. `college` and `tour` keep today's flow.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts ARITHMETIC, SHAPE and BEHAVIOUR – never wording. Every
// string T17 wrote is a DRAFT for the owner (CLAUDE.md invariant 4), so §E pins that the pools are
// total, distinct and legal under the bibles' shape rules, and pins no sentence.
//
// ⚠ AND IT DOES NOT RE-TEST WAVE 2. `HER_LINE`'s 24 lines, the flat pool, the listen detour and the
// two fork deltas are `tests/wave2-life-beat.test.ts`'s, and T17 moved none of them.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back.
// =================================================================================================
//
//   ARM 17a ⚠⚠ THE BRIEF'S FIRST SPECIFIED ARM – `ECONOMY.life.forkStop.floor` 0.12 -> 1.0, which is
//           the old quarter restored by one number (`lean(0)` is 1).
//           **3 RED** (3 failed, 49 passed over this file + wave2-life-beat). The two that carry it:
//           §A «⭐⭐⭐ the pure grid ...: unsupported @ standing 0, bond 100: expected 23.80952380952381
//           to be less than 5», and §A «⭐⭐⭐ ...and the DRAWN distribution really moved – the old
//           formula would fail this: 2000 draws, unsupported at top standing: expected 0.2085 to be
//           less than 0.06». ⚠ THE SECOND IS THE ONE THAT MATTERS: the first is arithmetic and the
//           second is the DRAW, and a grid that moved while nothing called the formula would be a
//           null result wearing a green tick. §B's two-states case is the third.
//
//   ARM 17b ⚠⚠ THE SECOND SPECIFIED ARM – the counsel raise deleted from `answerLifeBeat` (the
//           `if (counselDriver !== null) raiseLifeBeat(…)` line commented out), so answering her
//           lets `answerFork` straight through.
//           **6 RED** (6 failed, 46 passed) · all five of §D, and `tests/wave2-life-beat.test.ts`
//           §D's queue case, whose third row disappears. The headline: §D «⭐⭐ ...and `answerFork`
//           REFUSES while it stands: the engine is the gate, not the screen: expected [Function] to
//           throw an error».
//
//   ARM 17c ⚠⚠ THE THIRD SPECIFIED ARM – the driver thresholds inverted (`worn > from` -> `worn <
//           from` and the same on `strained`), so a girl at baseline reads `'worn'` and a worn girl
//           reads `'own'`.
//           **5 RED** (5 failed, 48 passed) · §C «⭐⭐⭐ the driver reads the root that actually leaned:
//           at the baseline, nothing leans – the Barty case: expected 'worn' to be 'own'», §C's
//           strictly-greater boundary case, §C «⭐⭐⭐ the WORDING the engine hands over is the one her
//           state calls for: a worn girl is handed the tiredness register» (the shoes-away strained
//           line where the high-shelf worn line belongs), §B's two-states case, and §D's row-detail
//           case.
//           ⚠⚠ AND THIS ARM CAUGHT **TWO DEAD NETS ON ITS FIRST RUN**, both recorded because they are
//           the finding rather than an embarrassment. (1) §D asserted `row.detail` against
//           `forkStopDriverOf(…)` – an equality between two arms that MOVE TOGETHER, invisible to
//           exactly this mutation; it now asserts the state and then the WORD, written out.
//           (2) §C's «the line she says is the driver's, and the three are three» calls
//           `lifeBeatSaid` with each driver in hand, so it can only ever prove the POOL has three
//           columns – the engine-side case above was added because the threshold has to be walked
//           through a WORLD to be walked at all. Before both repairs this arm was 3 RED.
//
//   ARM 17d THE FLOOR ZEROED – `forkStop.floor` 0.12 -> 0, which is «price the tail» misread as
//           «remove it». Recorded separately from 17a because it is the OTHER direction, and the
//           honest statement of the ruling is a BAND: ε > 0, and never 1.
//           **5 RED** (5 failed, 47 passed) · §A «⚠⚠ the floor is ε > 0 and NEVER zero ...: stop @
//           standing 0 is still reachable: expected 0 to be greater than 0», §A's grid and
//           distribution cases (the lower bound), §B's two-states case, and – the one worth naming –
//           `tests/wave2-life-beat.test.ts` §F's re-aimed sweep, which is the pin that used to say
//           `>= 1` and now says `> 0`: the re-aim did not weaken it.
//
//   ARM 17e THE DRIVER LEAKED INTO THE WEIGHTS – `stop` multiplied by `driver === 'own' ? 1 : 1.2`
//           inside `forkWantWeights`, which is «readable roots» becoming a fourth input by the back
//           door.
//           **2 RED** (2 failed, 50 passed) · §B «⭐⭐⭐ two states, the SAME three weights, two
//           different drivers: arm A against the constants: expected 0.624 to be close to 0.52» and
//           §A's corner case. ⚠ THE FAILING LINE IS THE ABSOLUTE ONE, not the arm-to-arm equality –
//           this mutation moves BOTH arms and the `toEqual` between them stays green, which is
//           precisely why that case asserts against the constants first.
import { describe, expect, it } from 'vitest'
import {
  createWorld,
  tickWeek,
  answerLifeBeat,
  answerFork,
  pendingLifeBeat,
  buildLifeBeatPrompt,
  lifeBeatSaid,
  lifeBeatHeading,
  lifeBeatListenFollowUp,
  lifeBeatOptionsFor,
  lifeLogOf,
  forkWantWeights,
  forkWantOf,
  forkStopDriverOf,
  drawForkWant,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  chooseGift,
  birthdayOfferFor,
  skipTournament,
  closeTournament,
  TEMPERAMENTS,
  FORK_WANTS,
  FORK_STOP_DRIVERS,
  LIFE_BEAT_BLOCKING,
  LIFE_BEAT_OPTIONS,
  type ForkStopDriver,
  type ForkWant,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type LifeBeatKind } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'

const S = ECONOMY.spirit
const B = ECONOMY.bond
const F = ECONOMY.life.forkStop
const FROM = ECONOMY.life.forkStopDriverFrom

/** The spirit a given `worn` reading is produced by, and the bond a given `strained` is – the
 *  formula's own arithmetic run backwards, so a case names the STATE it is about instead of a number
 *  somebody picked and a reader has to decode. */
const spiritAt = (worn: number): number => S.baseline - worn * (S.baseline - S.min)
const bondAt = (strained: number): number => B.start - strained * (B.start - B.min)

/** P(stop) as the draw sees it: the weight over the total of the three. ⚠ Derived from
 *  `forkWantWeights` rather than re-typed, so a pin here cannot describe a formula the engine does
 *  not have – and `drawForkWant`'s own normalisation is the same sum. */
function pStop(standing: number, worn: number, strained: number): number {
  const w = forkWantWeights(standing, spiritAt(worn), bondAt(strained))
  return (100 * w.stop) / (w.college + w.tour + w.stop)
}

// =================================================================================================
// §A – THE ARITHMETIC: A PRICED TAIL, NOT A REMOVED ONE
// =================================================================================================

describe('wave 3 T17 A – the stop weight is rooted, and the roots are the arithmetic', () => {
  it('⭐⭐⭐ the pure grid: an unsupported stop is a 3–4% tail at every standing', () => {
    // ⚠⚠ THE NUMBERS ARE THE ARCHITECT'S OWN, COMPUTED FROM THE CONSTANTS AND NOT COPIED FROM A RUN.
    // At top standing in a close home the other two max at 1.0 + 1.6×1.6 = 2.56, so the total is
    // 0.12 + 2.56 + 1.0 = 3.68 and the share is 0.12/3.68; at zero standing 1.6 + 1.6 + 0.12 = 3.32.
    // Under the OLD weight (`lean(worn)` = 1 at worn 0) the same two cells read 1/4.56 = 21.9% and
    // 1/4.2 = 23.8%, so this case cannot pass against the formula it replaced.
    const close = forkWantWeights(1, spiritAt(0), B.max)
    expect(close.stop, 'the floor itself').toBeCloseTo(F.floor, 10)
    expect((100 * close.stop) / (close.college + close.tour + close.stop), 'unsupported @ standing 1').toBeCloseTo(
      (100 * F.floor) / (1 + 1.6 * 1.6 + F.floor),
      6,
    )
    const low = forkWantWeights(0, spiritAt(0), B.max)
    expect((100 * low.stop) / (low.college + low.tour + low.stop), 'unsupported @ standing 0').toBeCloseTo(
      (100 * F.floor) / (1.6 + 1.6 + F.floor),
      6,
    )
    // ...and the claim in the owner's own terms: 3–4%, at every standing, close home or neutral.
    for (const standing of [0, 0.25, 0.5, 0.75, 1]) {
      for (const bondNow of [B.max, B.start]) {
        const w = forkWantWeights(standing, spiritAt(0), bondNow)
        const share = (100 * w.stop) / (w.college + w.tour + w.stop)
        expect(share, `unsupported @ standing ${standing}, bond ${bondNow}`).toBeLessThan(5)
        expect(share, `unsupported @ standing ${standing}, bond ${bondNow}: still possible`).toBeGreaterThan(0)
      }
    }
  })

  it('⭐⭐⭐ ...and the DRAWN distribution really moved – the old formula would fail this', () => {
    // ⚠⚠ THE CASE ABOVE IS ARITHMETIC AND THIS ONE IS THE DRAW, and the pair is deliberate: a grid
    // that moved while nothing called the formula would be a null result wearing a green tick. This
    // walks `drawForkWant` itself, on its own sub-stream, at the state the owner met.
    // ⚠ AND IT IS A REAL MONTE CARLO WITH ITS n PRINTED IN THE MESSAGE, not a spot check: the claim
    // is about a SHARE, and a share of one draw is not a share.
    const n = 2000
    let stops = 0
    for (let i = 0; i < n; i++) {
      if (drawForkWant(`t17-draw-${i}`, 1, 1, spiritAt(0), B.max) === 'stop') stops++
    }
    const share = stops / n
    // The old formula reads 21.9% here; the new one reads 3.26%. The window is wide enough that
    // sampling noise cannot reach either edge (2×SEM at 3.3% over 2000 draws is ±0.8 points).
    expect(share, `${n} draws, unsupported at top standing`).toBeLessThan(0.06)
    // ⚠⚠ AND THE LOWER BOUND IS THE BARTY TAIL, ASSERTED. «Nothing may zero `stop`» is the ruling;
    // a floor of 0 would make this line red, which is ARM 17d.
    expect(share, 'the tail is priced, never removed').toBeGreaterThan(0.005)
  })

  it('⚠⚠ the floor is ε > 0 and NEVER zero – any girl may still want any of the three', () => {
    // The honest replacement for the old «EVERY WEIGHT IS >= 1» comment, as a property: at the most
    // stop-hostile state the engine can produce, all three weights are still strictly positive.
    for (const standing of [0, 0.5, 1]) {
      const w = forkWantWeights(standing, S.max, B.max)
      for (const want of FORK_WANTS) {
        expect(w[want], `${want} @ standing ${standing} is still reachable`).toBeGreaterThan(0)
      }
    }
  })

  it('⭐⭐ the two roots lean it, and the far corner is steeper than the near one', () => {
    // The shape of the ruling: worn weighs more than strained, both add, and the corners are the
    // architect's own readings (~42% at .4/.4, ~52% at .6/.6, dominant at 1/1).
    expect(pStop(0.5, 0.4, 0.4), 'worn .4 in a strained home').toBeCloseTo(
      (100 * (F.floor + 0.4 * F.gainWorn + 0.4 * F.gainStrained)) /
        (1.3 + 1.3 + F.floor + 0.4 * F.gainWorn + 0.4 * F.gainStrained),
      6,
    )
    expect(pStop(0.5, 0.4, 0.4), '~42%').toBeGreaterThan(40)
    expect(pStop(0.5, 0.6, 0.6), '~52%, steeper than the near corner').toBeGreaterThan(pStop(0.5, 0.4, 0.4))
    expect(pStop(0.5, 1, 1), 'a drained girl in a cold home reads it dominant').toBeGreaterThan(60)
    // ⚠ WORN WEIGHS MORE THAN STRAINED, asserted rather than assumed – it is the ordering of the two
    // gains and the reason the driver breaks its tie toward `worn`.
    expect(pStop(0.5, 0.5, 0), 'the same distance of wear').toBeGreaterThan(pStop(0.5, 0, 0.5))
  })

  it('⚠⚠ `college` and `tour` are BYTE-FOR-BYTE what they were, and the fence has three inputs', () => {
    // ⚠ THE OLD FORMULAE, TRANSCRIBED – the only place in this file that re-types the engine, and it
    // is deliberate: «untouched» is a claim about a value the engine no longer states anywhere else.
    const lean = (x: number) => 1 + 0.6 * Math.min(1, Math.max(0, x))
    for (const standing of [0, 0.3, 0.7, 1]) {
      for (const bondNow of [0, 40, B.start, 90, B.max]) {
        const w = forkWantWeights(standing, 55, bondNow)
        expect(w.college, `college @ ${standing}`).toBeCloseTo(lean(1 - standing), 10)
        expect(w.tour, `tour @ ${standing}, bond ${bondNow}`).toBeCloseTo(
          lean(standing) * lean((bondNow - B.start) / (B.max - B.start)),
          10,
        )
      }
    }
    // ⚠⚠ THE FENCE AS A SIGNATURE (who-she-is §3): standing, spirit, bond – and there is no fourth.
    // A temperament term cannot be added to the maths without changing this number.
    expect(forkWantWeights.length, 'three inputs and there is no fourth').toBe(3)
  })
})

// =================================================================================================
// §B – THE DRIVER NEVER RE-WEIGHTS THE DRAW IT EXPLAINS
// =================================================================================================

describe('wave 3 T17 B – the driver is wording, and the wall is asserted', () => {
  it('⭐⭐⭐ two states, the SAME three weights, two different drivers', () => {
    // ⚠⚠ THE SHAPE OF THIS PIN IS THE POINT, AND IT IS NOT AN ARM-TO-ARM EQUALITY. «A equals B» is
    // invisible to any mutation that moves both, and that exact shape has already produced one dead
    // net in this wave – so the two arms are compared to each other AND to the value the constants
    // say they must have. A driver that leaked into the weight breaks the first half; a moved
    // constant breaks the second.
    //
    // The states: `worn` is 2.5 per unit and `strained` is 2.0, so worn 0.16 and strained 0.20 buy
    // the identical 0.40 of extra weight – and 0.16 is above the driver line while a bond BELOW
    // start reads `close` as 0, exactly as a bond AT start does. Same weights, two roots.
    const a = forkWantWeights(0.5, spiritAt(0.16), B.start)
    const b = forkWantWeights(0.5, S.baseline, bondAt(0.2))
    const expected = F.floor + 0.16 * F.gainWorn
    expect(expected, 'the two roots really do buy the same weight').toBeCloseTo(F.floor + 0.2 * F.gainStrained, 10)
    expect(a.stop, 'arm A against the constants').toBeCloseTo(expected, 10)
    expect(b.stop, 'arm B against the constants').toBeCloseTo(expected, 10)
    expect(a, 'and the three weights are the same three').toEqual(b)
    // ...and the DRIVERS are two different words over that one set of weights.
    expect(forkStopDriverOf(spiritAt(0.16), B.start), 'arm A reads worn').toBe('worn')
    expect(forkStopDriverOf(S.baseline, bondAt(0.2)), 'arm B reads strained').toBe('strained')
  })

  it('⚠⚠ reading the driver changes nothing about the weights, at any state', () => {
    // The property said plainly: the weights are a pure function, and asking for a driver a thousand
    // times between two calls cannot move them. ⚠ It is the weak half of §B on purpose – the case
    // above is the one with teeth – and it exists because it is the claim a future reader will look
    // for by name.
    for (const worn of [0, 0.15, 0.5, 1]) {
      for (const strained of [0, 0.2, 0.9]) {
        const before = forkWantWeights(0.4, spiritAt(worn), bondAt(strained))
        for (let i = 0; i < 50; i++) forkStopDriverOf(spiritAt(worn), bondAt(strained))
        expect(forkWantWeights(0.4, spiritAt(worn), bondAt(strained)), `${worn}/${strained}`).toEqual(before)
      }
    }
  })
})

// =================================================================================================
// §C – THE DRIVER'S THRESHOLDS, AND THE WORDING THEY PICK
// =================================================================================================

/** A probe world holding ONE unanswered `'fork-opinion'` row whose want is `stop`, at a stated
 *  spirit and bond. ⚠ HAND-BUILT AND SAID SO: §D walks a real career for the arc's behaviour, and
 *  this is the wording half, where what matters is the STATE the prompt is assembled from and not
 *  how the row got there. `withBeats`' own shape in `tests/wave2-life-beat.test.ts`. */
function withStopRow(seed: string, at: { spirit: number; bond: number }): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.spirit = at.spirit
  world.bond = at.bond
  world.lifeLog = [{ week: world.week, kind: 'fork-opinion', detail: 'stop', answer: null }]
  return world
}

describe('wave 3 T17 C – which root the words claim', () => {
  it('⭐⭐⭐ the driver reads the root that actually leaned', () => {
    expect(forkStopDriverOf(S.baseline, B.start), 'at the baseline, nothing leans – the Barty case').toBe('own')
    expect(forkStopDriverOf(S.max, B.max), 'above the baseline, still nothing').toBe('own')
    expect(forkStopDriverOf(spiritAt(0.5), B.start), 'a worn girl').toBe('worn')
    expect(forkStopDriverOf(S.baseline, bondAt(0.5)), 'a strained home').toBe('strained')
    expect(forkStopDriverOf(spiritAt(0.5), bondAt(0.5)), '⚠ worn wins the tie, by the wording rule').toBe('worn')
  })

  it('⚠ the threshold is STRICTLY greater – a girl exactly on the line is still `own`', () => {
    expect(forkStopDriverOf(spiritAt(FROM), B.start), 'exactly at the line').toBe('own')
    expect(forkStopDriverOf(spiritAt(FROM + 0.01), B.start), 'a hair past it').toBe('worn')
    expect(forkStopDriverOf(S.baseline, bondAt(FROM)), 'exactly at the line, the other root').toBe('own')
    expect(forkStopDriverOf(S.baseline, bondAt(FROM + 0.01)), 'a hair past it').toBe('strained')
  })

  it('⭐⭐⭐ the line she says is the driver\'s, and the three are three', () => {
    // ⚠ THE PIN IS THAT THE THREE DRIVERS PRODUCE THREE DIFFERENT LINES, never what any of them says
    // (invariant 4). A wrong-way threshold hands a worn girl the Barty line, which this catches by
    // the line moving with the driver.
    for (const voice of TEMPERAMENTS) {
      const lines = FORK_STOP_DRIVERS.map((d) => lifeBeatSaid('fork-opinion', 'stop', voice, 'level', 'close', 'open', 'school', d))
      expect(new Set(lines).size, `${voice}: three drivers, three lines`).toBe(3)
      // ...and `'own'` is the SHIPPED line, byte-identical – wave 2's pool did not move.
      expect(lines[FORK_STOP_DRIVERS.indexOf('own')], `${voice}: own is wave 2's own line`).toBe(
        lifeBeatSaid('fork-opinion', 'stop', voice, 'level', 'close'),
      )
    }
  })

  it('⭐⭐⭐ the WORDING the engine hands over is the one her state calls for', () => {
    // ⚠⚠ THE PIN THE BRIEF ASKS FOR, AND IT HAS TO GO THROUGH THE WORLD. The case above hands
    // `lifeBeatSaid` a driver directly, so it proves the POOL has three columns and could never
    // notice a threshold pointing the wrong way. This one builds the prompt the dialog receives and
    // asks which column the ENGINE chose for a girl whose state is stated on the line above the
    // assertion – so the two sides do not move together, which is what makes it a net.
    const worn = withStopRow('t17-wording-worn', { spirit: spiritAt(0.6), bond: B.start })
    expect(worn.spirit, 'the fixture really is worn and not strained').toBeLessThan(spiritAt(FROM))
    expect(buildLifeBeatPrompt(worn)!.said, 'a worn girl is handed the tiredness register').toBe(
      lifeBeatSaid('fork-opinion', 'stop', worn.temperament!, 'low', 'close', 'open', 'school', 'worn'),
    )

    const strained = withStopRow('t17-wording-strained', { spirit: S.baseline, bond: bondAt(0.2) })
    expect(strained.bond, 'the fixture really is strained and not worn').toBeLessThan(bondAt(FROM))
    expect(buildLifeBeatPrompt(strained)!.said, 'a strained home is handed the distance register').toBe(
      lifeBeatSaid('fork-opinion', 'stop', strained.temperament!, 'level', 'close', 'open', 'school', 'strained'),
    )

    const own = withStopRow('t17-wording-own', { spirit: S.baseline, bond: B.max })
    expect(buildLifeBeatPrompt(own)!.said, 'and a girl with neither root is handed the Barty one').toBe(
      lifeBeatSaid('fork-opinion', 'stop', own.temperament!, 'bright', 'close', 'open', 'school', 'own'),
    )
  })

  it('⚠⚠ the driver touches `stop` ALONE – college and tour read exactly what they read before', () => {
    for (const voice of TEMPERAMENTS) {
      for (const want of ['college', 'tour'] as const) {
        for (const register of ['bright', 'level', 'low'] as const) {
          const base = lifeBeatSaid('fork-opinion', want, voice, register, 'close')
          for (const d of FORK_STOP_DRIVERS) {
            expect(
              lifeBeatSaid('fork-opinion', want, voice, register, 'close', 'open', 'school', d),
              `${voice}/${want}/${register}: the driver is not on this path`,
            ).toBe(base)
          }
        }
      }
    }
  })

  it('⚠ a flat home still collapses to the flat pool, whatever the root is', () => {
    // The bond channel outranks the driver for HER voice – losing her voice is the point – and the
    // root reaches a cold home through the coach instead (§D).
    for (const band of ['strained', 'cold'] as const) {
      const lines = FORK_STOP_DRIVERS.map((d) => lifeBeatSaid('fork-opinion', 'stop', 'deep', 'low', band, 'open', 'school', d))
      expect(new Set(lines).size, `${band}: one flat line, not three`).toBe(1)
    }
  })
})

// =================================================================================================
// §D – THE COUNSEL ARC
// =================================================================================================

/** ⭐⭐ A CAREER WALKED TO ITS FORK WITH THE ENGINE DRAWING THE WANT, never with a row written by
 *  hand. The state is pushed – her spirit is held at the floor every week, which is a thing a career
 *  can genuinely be – so that `stop` is a likely draw, and then SEEDS ARE SEARCHED until the engine
 *  draws the want this fixture is about.
 *
 *  ⚠⚠ IT THROWS WHEN NO SEED PRODUCES IT rather than returning something else: a fixture that
 *  silently handed back a `tour` career would make every case below pass while testing nothing, which
 *  is the failure mode this wave has already met eleven times. */
function atTheForkWanting(want: ForkWant, hold: { spirit: number; bond: number }): WorldState {
  const tried: ForkWant[] = []
  for (let seed = 0; seed < 12; seed++) {
    const world = createWorld(`t17-${want}-${seed}`, { ...DEFAULT_PROFILE, birthMonth: 9, birthDay: 1, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52 * 9 && world.fork === null; i++) {
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const birthday = pendingBirthday(world)
      if (birthday !== null) chooseGift(world, birthdayOfferFor(world, birthday).options[0].id)
      drainLifeBeats(world, 'fork-opinion')
      // ⚠ THE HOLD IS APPLIED IMMEDIATELY BEFORE THE TICK, so the state the fork's own draw reads is
      // the held one – `resolveEndings` runs inside `tickWeek` and `accrueSpirit` walks her back
      // toward the baseline every week, so a hold applied once would be gone by the fork.
      world.spirit = hold.spirit
      world.bond = hold.bond
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      tickWeek(world, rng)
      while (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      world.season = []
    }
    const drawn = forkWantOf(world)
    if (drawn === want && world.fork !== null && world.fork.answer === null) return world
    if (drawn !== null) tried.push(drawn)
  }
  throw new Error(`no seed in 12 reached a fork wanting '${want}' – drew ${tried.join(', ')}`)
}

/** Her state at the fork, chosen so the WORN root is the one the driver reads: spirit on the floor,
 *  bond at its start, which is a girl the season took apart in a home that is neither warm nor cold. */
const WORN_AT_THE_FORK = { spirit: 0, bond: B.start }

describe('wave 3 T17 D – answering a `stop` puts the coach in front of the fork', () => {
  it('⭐⭐⭐ answering a `stop` raises the coach\'s counsel, and the fork is shut behind it', () => {
    const world = atTheForkWanting('stop', WORN_AT_THE_FORK)
    // The fixture really is the state this case is about – the actuation check, before any claim.
    expect(forkWantOf(world), 'the engine drew `stop`').toBe('stop')
    expect(world.fork!.answer, 'and the fork is open behind her').toBeNull()
    expect(pendingLifeBeat(world)!.kind, 'her row is the one waiting').toBe('fork-opinion')

    answerLifeBeat(world, 'back')
    const raised = pendingLifeBeat(world)
    expect(raised, 'a row is waiting where the fork used to be').not.toBeNull()
    expect(raised!.kind, 'and it is the coach').toBe('fork-counsel')
    // ⚠⚠ THE EXPECTED DRIVER IS WRITTEN OUT AND NOT COMPUTED BY THE FUNCTION UNDER TEST. Comparing
    // `row.detail` to `forkStopDriverOf(…)` would be an equality between two arms that MOVE
    // TOGETHER – a threshold inversion flips both sides and the line stays green, which is exactly
    // the dead-net shape this wave has already produced once. So the state is asserted first (she
    // really is past the worn line) and the WORD is asserted second.
    expect(world.spirit, 'the fixture really is a worn girl').toBeLessThan(spiritAt(FROM))
    expect(world.bond, '...and her home is not the thing that is strained').toBeGreaterThan(bondAt(FROM))
    expect(raised!.detail, 'keyed on the root her own line was worded from').toBe('worn')
    expect(LIFE_BEAT_BLOCKING['fork-counsel'], 'declared blocking, which is the whole mechanism').toBe(true)
  })

  it('⭐⭐ ...and `answerFork` REFUSES while it stands', () => {
    const world = atTheForkWanting('stop', WORN_AT_THE_FORK)
    answerLifeBeat(world, 'back')
    expect(() => answerFork(world, 'continue'), 'the engine is the gate, not the screen').toThrow(/hear her out/)
    expect(world.fork!.answer, 'and the fork took nothing').toBeNull()
  })

  it('⭐⭐⭐ answering the coach is what opens it – and the arc is two cards, not three', () => {
    const world = atTheForkWanting('stop', WORN_AT_THE_FORK)
    answerLifeBeat(world, 'back')
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.kind, 'the counsel is on the wire, on the ordinary prompt contract').toBe('fork-counsel')
    expect(prompt.options.length, 'two acknowledgments').toBe(2)
    expect(prompt.listenFollowUp, 'and no listening detour – he has said his piece').toBeNull()

    answerLifeBeat(world, prompt.options[0].id)
    expect(pendingLifeBeat(world), 'nothing else is raised behind him').toBeNull()
    answerFork(world, 'continue')
    expect(world.fork!.answer, 'and the fork finally takes an answer').toBe('continue')
  })

  it('⚠⚠ counsel is INFORMATION, not a test – neither answer moves bond, and spirit never moves', () => {
    for (const optionId of LIFE_BEAT_OPTIONS['fork-counsel'].map((o) => o.id)) {
      const world = atTheForkWanting('stop', WORN_AT_THE_FORK)
      answerLifeBeat(world, 'back')
      const bondBefore = world.bond
      const spiritBefore = world.spirit
      answerLifeBeat(world, optionId)
      expect(world.bond, `'${optionId}' costs and earns nothing`).toBe(bondBefore)
      expect(world.spirit, 'and this file writes no spirit anywhere').toBe(spiritBefore)
    }
  })

  it('⚠ a `tour` want keeps today\'s EXACT flow – her row, then the fork, and nothing between', () => {
    // ⚠⚠ THE CONTROL FOR THE WHOLE OF §D. «The counsel appears» is worth nothing unless there is a
    // want for which it does not, and the ruling's own boundary is that `college` and `tour` are
    // untouched. Her state here is the neutral one, so the draw is free to land anywhere but `stop`.
    const world = atTheForkWanting('tour', { spirit: S.baseline, bond: B.max })
    answerLifeBeat(world, 'back')
    expect(pendingLifeBeat(world), 'no second card').toBeNull()
    expect(lifeLogOf(world).filter((r) => r.kind === 'fork-counsel'), 'and no row of any kind').toEqual([])
    answerFork(world, 'continue')
    expect(world.fork!.answer, 'the fork answers immediately, exactly as it did before T17').toBe('continue')
  })

  it('⭐⭐ a harness walks straight past the whole arc – `drainLifeBeats` survives it', () => {
    // The hard requirement, end to end through the SHARED helper: 40 tools, `npm run e2e:fixtures`
    // and every walked test go this way, and the helper THROWS if a kind has no bond-neutral answer.
    const world = atTheForkWanting('stop', WORN_AT_THE_FORK)
    const bondBefore = world.bond
    const cleared = drainLifeBeats(world)
    expect(cleared, 'her row AND the coach\'s, in one walk').toBe(2)
    expect(pendingLifeBeat(world), 'the queue is empty').toBeNull()
    expect(world.bond, '⚠ and the drain moved nothing it was not asked to').toBe(bondBefore)
    answerFork(world, 'continue')
    expect(world.fork!.answer, 'a walker reaches the fork').toBe('continue')
  })
})

// =================================================================================================
// §E – THE NEW POOLS ARE TOTAL, DISTINCT AND LEGAL. NOT ONE SENTENCE IS PINNED.
// =================================================================================================

describe('wave 3 T17 E – the drafts obey the bibles\' shape rules', () => {
  it('⭐⭐ the registry is still TOTAL BY TYPE, and the new kind declared in all four records', () => {
    const kinds = Object.keys(LIFE_BEAT_OPTIONS) as LifeBeatKind[]
    expect(kinds, 'the union grew by exactly one').toContain('fork-counsel')
    expect(Object.keys(LIFE_BEAT_BLOCKING).sort(), 'every kind declares, and no more').toEqual([...kinds].sort())
    // ⚠ AND THE BOND-NEUTRAL ANSWER IS THE HARD ONE (`drainLifeBeats` throws without it).
    expect(
      lifeBeatOptionsFor('fork-counsel', 'open').filter((o) => o.bond === 0).length,
      'both answers are free, and one would have been enough for the drain',
    ).toBe(2)
    expect(lifeBeatListenFollowUp('fork-counsel', 'own', 'deep', 'close'), 'no listen detour').toBeNull()
  })

  it('⚠ the coach\'s three reads are three, and the heading is one', () => {
    const reads = FORK_STOP_DRIVERS.map((d) => lifeBeatSaid('fork-counsel', d, 'deep', 'low', 'cold'))
    expect(new Set(reads).size, 'three drivers, three reads').toBe(3)
    // ⚠⚠ AND HE IS NOT INDEXED BY HER VOICE OR BY THE BOND BAND – the supporting-cast rule
    // (who-she-is §5c) as a property rather than as a comment.
    for (const voice of TEMPERAMENTS) {
      for (const band of ['close', 'steady', 'strained', 'cold'] as const) {
        for (const register of ['bright', 'level', 'low'] as const) {
          expect(lifeBeatSaid('fork-counsel', 'worn', voice, register, band), `${voice}/${band}/${register}`).toBe(reads[FORK_STOP_DRIVERS.indexOf('worn')])
          expect(lifeBeatHeading('fork-counsel', register, band), 'one frame, keyed on nothing').toBe(
            lifeBeatHeading('fork-counsel', 'bright', 'close'),
          )
        }
      }
    }
  })

  it('⚠ one quoted span, short dash only, no Cyrillic, no number and no price, in every new line', () => {
    const lines = [
      ...TEMPERAMENTS.flatMap((voice) =>
        (['worn', 'strained'] as const).map((d) =>
          lifeBeatSaid('fork-opinion', 'stop', voice, 'level', 'close', 'open', 'school', d),
        ),
      ),
      ...FORK_STOP_DRIVERS.map((d) => lifeBeatSaid('fork-counsel', d, 'sunny', 'level', 'close')),
      lifeBeatHeading('fork-counsel', 'level', 'close'),
      ...LIFE_BEAT_OPTIONS['fork-counsel'].map((o) => o.label),
    ]
    expect(lines.length, 'the sweep has lines to sweep').toBe(8 + 3 + 1 + 2)
    expect(new Set(lines).size, 'and not one of them is a duplicate of another').toBe(lines.length)
    for (const line of lines) {
      expect((line.match(/"[^"]*"/g) ?? []).length, `at most one quoted span: ${line}`).toBeLessThanOrEqual(1)
      expect(line, `no em-dash: ${line}`).not.toMatch(/—/)
      expect(line, `no Cyrillic: ${line}`).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, `no price: ${line}`).not.toMatch(/[$£€]|\d/)
    }
  })

  it('⚠ her eight new lines are HERS – and they obey exactly what the SHIPPED ones obey', () => {
    // The two shape rules the whole corpus obeys, on the pool T17 added. ⚠ The COACH's three are
    // deliberately not swept by this: the narration there names HIM, which is the point of §3d.
    //
    // ⚠⚠ THE SHIPPED `own` LINES ARE SWEPT BESIDE THE NEW ONES, and that is what stops the predicate
    // below being one this file invented. Wave 2's fork narration says «us» – it is the PARENT's
    // journal and the two of them are in it – so the ban is on the first person SINGULAR, and the
    // only way to state that honestly is to hold the new lines to a rule the old ones pass.
    const her: [string, string][] = []
    for (const voice of TEMPERAMENTS) {
      for (const d of ['worn', 'strained'] as const) {
        her.push([`${voice}/${d}`, lifeBeatSaid('fork-opinion', 'stop', voice, 'level', 'close', 'open', 'school', d)])
      }
      for (const register of ['level', 'low'] as const) {
        her.push([`${voice}/own/${register} (SHIPPED)`, lifeBeatSaid('fork-opinion', 'stop', voice, register, 'close')])
      }
    }
    expect(her.length, 'eight new and eight shipped').toBe(16)
    for (const [name, line] of her) {
      expect((line.match(/"[^"]*"/g) ?? []).length, `${name}: exactly one quoted span`).toBe(1)
      const narration = line.replace(/"[^"]*"/g, ' ')
      expect(narration.toLowerCase(), `${name}: the narration names her`).toMatch(/\bshe\b/)
      expect(narration, `${name}: the narration is not in the parent's own first person`).not.toMatch(
        /\b(I|my|mine|me)\b/i,
      )
    }
  })
})

describe('wave 3 T17 F – the two unions the sweeps above walk', () => {
  it('⚠ three drivers and three wants, derived from the engine\'s own totals', () => {
    // ⚠ THE SWEEPS IN §C AND §E ITERATE THESE LISTS, so a fourth driver or a fourth want would widen
    // them automatically – this case exists so that a union which grew is a VISIBLE event here
    // rather than an invisible one there. `FORK_STOP_DRIVERS` is derived from a total record, so it
    // cannot go stale on its own.
    const drivers: readonly ForkStopDriver[] = FORK_STOP_DRIVERS
    const wants: readonly ForkWant[] = FORK_WANTS
    expect(drivers.length, 'worn, strained, own').toBe(3)
    expect(wants.length, 'college, tour, stop').toBe(3)
    expect([...drivers].sort(), 'and they are those three').toEqual(['own', 'strained', 'worn'])
  })
})
