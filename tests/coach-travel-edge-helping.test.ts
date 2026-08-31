import { describe, it, expect } from 'vitest'
import {
  buildCoachRoster,
  coachEdgeCorridorPp,
  coachEdgePlacement,
  coachEdgePp,
  COACH_EDGE_CORRIDOR_PP,
  HIREABLE_TIERS,
} from '../src/engine/coach'
import { coachMatchEdge, kidMatchPlayerFor, COACH_EDGE_POINTS_PER_PP } from '../src/engine/world/player'
import { coachEdgeView, coachMarket, coachTravelsWithHer, createWorld, hireCoach, setCoachOnEventWeeks } from '../src/engine/world'
import { coachTravelFareFor } from '../src/engine/world/sponsors'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

// ⚠ THE BEHAVIOUR HALF of what was one 2,571-line file until the cut of 31.08. Claims 1-3 of the
// design header below are held here; claim 4 – the byte identity – is held by
// tests/coach-travel-edge.test.ts and tests/coach-travel-edge-older-schemas.test.ts, which share
// tests/coachTravelEdgeFixtures.ts. That module's header carries the measurement and the reason:
// the file stalled CI at 62,889 ms with all 43 tests green, and 98.5 % of the cost was the frozen
// describe. This half is 23 of the 43 cases and 0.43 s of the 28.09 s. Not one seed, constant or
// assertion moved in the move.

// ⭐ THE TRAVEL HELPING (docs/specs/coach-travel-2026-08.md §6). Round-21 #2 shipped PRESENCE - he
// goes, the family pays a second fare, three surfaces say so - and she gained nothing by it. The
// owner's sizing of the bonus, 14.08, is the whole design:
//
//   «что если мы привяжем это как раз к тренерской лестнице? у нас там есть уже верхний процент,
//    будет не так сильно влиять как будто.»
//
// So a coach who travels is worth HIS OWN NUMBER AGAIN, and COACH_EDGE_CORRIDOR_PP is the scale.
// The four claims this file exists to hold:
//
//   1. PER TIER, the edge is larger with travel than without - by exactly his own tier's worth, and
//      never by more than that corridor's own top.
//   2. `self` IS ZERO ON BOTH SIDES OF THE SWITCH. Twice nothing is nothing, and the parent in the
//      car is not "travelling with her".
//   3. IT IS `coachTravelsWithHer` AND NOT A SECOND COPY OF IT. player.ts is a leaf and cannot import
//      the predicate; this file is the device that keeps the two answering the same question.
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.

/** Every coach id on the market, by rung – seed-free, exactly as tests/coach-edge.test.ts builds it. */
const IDS_BY_TIER: Record<string, string[]> = Object.fromEntries(
  HIREABLE_TIERS.map((t) => [t, buildCoachRoster('any-seed', 14).filter((c) => c.tier === t).map((c) => c.id)]),
)

const seeds = (n: number, prefix = 'travel'): string[] => Array.from({ length: n }, (_, i) => `${prefix}-${i}`)

const WINGS = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const

describe('a coach who travels is worth his own number again, per tier', () => {
  it('is strictly larger with travel than without, at every rung, for every coach', () => {
    for (const tier of HIREABLE_TIERS) {
      for (const seed of seeds(200)) {
        for (const id of IDS_BY_TIER[tier]) {
          const stays = coachEdgePp(seed, id)
          const travels = coachEdgePp(seed, id, true)
          expect(stays, `${tier} ${seed}/${id}`).toBeGreaterThan(0)
          expect(travels, `${tier} ${seed}/${id}`).toBeGreaterThan(stays)
        }
      }
    }
  })

  it('...and larger by EXACTLY his own number – which is also the proof that no second draw is spent', () => {
    // ⚠ THIS IS THE RNG ASSERTION AS WELL AS THE ARITHMETIC ONE. Exact proportionality to the bit can
    // only come from re-using the SAME uniform: an independent second draw off a second sub-stream
    // would land somewhere else in the corridor and this would fail on the first seed. So "the travel
    // helping spends no draw" is checked here rather than asserted in a comment.
    for (const tier of HIREABLE_TIERS) {
      for (const seed of seeds(200)) {
        for (const id of IDS_BY_TIER[tier]) {
          const stays = coachEdgePp(seed, id)
          expect(coachEdgePp(seed, id, true), `${tier} ${seed}/${id}`).toBe(stays * 2)
          expect(coachEdgePp(seed, id, true) - stays, `${tier} ${seed}/${id}`).toBe(stays)
        }
      }
    }
  })

  it('adds no more than that corridor\'s own top, and no less than its floor', () => {
    // «у нас там есть уже верхний процент» – the bound is the table's, and it is structural rather
    // than a clamp: the helping IS his draw from the bracket, so it cannot leave the bracket.
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      for (const seed of seeds(200, 'bound')) {
        for (const id of IDS_BY_TIER[tier]) {
          const added = coachEdgePp(seed, id, true) - coachEdgePp(seed, id)
          expect(added, `${tier} ${seed}/${id}`).toBeGreaterThanOrEqual(lo)
          expect(added, `${tier} ${seed}/${id}`).toBeLessThan(hi)
        }
      }
    }
  })

  it('is a LADDER on the road as well as at home – elite adds more than budget, rung by rung', () => {
    // The decision the owner wants to exist: an expensive coach's fare is worth paying and a cheap
    // one's is marginal. Measured as the mean helping per rung, which is the corridor's own midpoint.
    const meanHelping = (tier: CoachTier): number => {
      const vals = seeds(300, 'ladder').flatMap((s) =>
        IDS_BY_TIER[tier].map((id) => coachEdgePp(s, id, true) - coachEdgePp(s, id)),
      )
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }
    const means = HIREABLE_TIERS.map(meanHelping)
    for (let i = 0; i < means.length - 1; i++) {
      expect(means[i], `${HIREABLE_TIERS[i]} vs ${HIREABLE_TIERS[i + 1]}`).toBeLessThan(means[i + 1])
    }
    // ...and the whole thing still fits inside the ladder it is tied to: the dearest helping is under
    // the corridor's top, which is what makes this a re-reading of the table rather than a new dial.
    expect(Math.max(...means)).toBeLessThan(COACH_EDGE_CORRIDOR_PP.elite[1])
  })

  it('SCALES the ladder rather than shifting it, so the budget lottery survives the trip', () => {
    // ⚠ WHY THE OPERATION IS A MULTIPLY. §1's rule - each tier's ceiling is the next tier's midpoint,
    // no tier reaches two rungs up - is a rule about RATIOS, so it is invariant under scaling and is
    // destroyed by a shift. Both halves are checked, because "we chose a multiply" is only a design
    // decision if the alternative would have done something different.
    const doubled = (t: CoachTier): [number, number] => [COACH_EDGE_CORRIDOR_PP[t][0] * 2, COACH_EDGE_CORRIDOR_PP[t][1] * 2]
    for (let i = 0; i + 2 < HIREABLE_TIERS.length; i++) {
      expect(doubled(HIREABLE_TIERS[i])[1]).toBeLessThanOrEqual(doubled(HIREABLE_TIERS[i + 2])[0])
    }
    const spread = (lo: [number, number], hi: [number, number]): number =>
      (hi[0] + hi[1]) / (lo[0] + lo[1])
    const shipped = spread(COACH_EDGE_CORRIDOR_PP.budget, COACH_EDGE_CORRIDOR_PP.elite)
    // the elite rung is worth ~2.2x the budget one, at home and on the road alike
    expect(spread(doubled('budget'), doubled('elite'))).toBeCloseTo(shipped, 10)
    // ...whereas the +3.0 pp SHIFT the spec recommended would have made every rung nearly the same
    // coach, which is the reason that dose could not simply be attached to the switch.
    const shift = (t: CoachTier): [number, number] => [COACH_EDGE_CORRIDOR_PP[t][0] + 3, COACH_EDGE_CORRIDOR_PP[t][1] + 3]
    expect(spread(shift('budget'), shift('elite'))).toBeLessThan(1.3)
  })
})

describe('self is exactly zero on BOTH sides of the switch', () => {
  it('is zero for nobody hired, travelling or not', () => {
    expect(Object.is(coachEdgePp('any', null), 0)).toBe(true)
    expect(Object.is(coachEdgePp('any', null, true), 0), 'twice nothing is nothing').toBe(true)
  })

  it('is zero for a degenerate corridor too – the bench control cannot be handed an edge by the trip', () => {
    // `self` is [0, 0] by design and a bench arm zeroes the whole table; an id no roster knows reads
    // `self` for the same reason.
    expect(Object.is(coachEdgePp('any', 'no-such-coach', true), 0)).toBe(true)
  })

  it('leaves a self-coached career on the code path it has always been on, switch or no switch', () => {
    const off = createWorld('self-travel', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const on = createWorld('self-travel', { ...DEFAULT_PROFILE, coachTier: 'self' })
    on.coachOnEventWeeks = true
    expect(on.coachId).toBeNull()
    expect(coachTravelsWithHer(on), 'nobody to send – so nobody travels').toBe(false)
    expect(Object.is(coachMatchEdge(on), 0)).toBe(true)
    const a = kidMatchPlayerFor(on, 'clay')
    const b = kidMatchPlayerFor(off, 'clay')
    expect(a).toEqual(b)
    for (const k of WINGS) expect(Object.is(a[k], b[k]), k).toBe(true)
  })
})

describe('it IS `coachTravelsWithHer`, not a second copy of it', () => {
  it('doubles exactly when that predicate is true, over all four states of the two clauses', () => {
    // ⚠ THE ANTI-DRIFT DEVICE. player.ts is a leaf and cannot import a predicate that lives in
    // world/coachMarket.ts (which imports the ledger, the ladder and world/sponsors at runtime), so
    // the two clauses are read structurally there and pinned to the predicate HERE. If either side
    // ever grows a third clause, this goes red.
    for (const seed of seeds(25, 'predicate')) {
      for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
        for (const on of [false, true]) {
          const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
          world.coachOnEventWeeks = on
          const base = coachEdgePp(world.seed, world.coachId) * COACH_EDGE_POINTS_PER_PP
          const expected = coachTravelsWithHer(world) ? base * 2 : base
          expect(coachMatchEdge(world), `${seed} ${tier} on=${on}`).toBe(expected)
          expect(coachTravelsWithHer(world), `${seed} ${tier} on=${on}`).toBe(on && tier !== 'self')
        }
      }
    }
  })

  it('follows the coach out of the door and back in, with the switch left on', () => {
    const world = createWorld('leaves-travel', DEFAULT_PROFILE)
    world.coachOnEventWeeks = true
    const him = world.coachId!
    const travelling = coachMatchEdge(world)
    expect(travelling).toBe(coachEdgePp(world.seed, him) * 2 * COACH_EDGE_POINTS_PER_PP)

    hireCoach(world, null)
    expect(world.coachOnEventWeeks, 'the stance is untouched by the firing').toBe(true)
    expect(Object.is(coachMatchEdge(world), 0), 'nobody to send').toBe(true)

    hireCoach(world, him)
    expect(coachMatchEdge(world), 'the same man comes back with the same trip').toBe(travelling)
  })
})

describe('percent becomes tennis – twice, at the same seam', () => {
  it('adds exactly 2 x pp x 0.5225 to all five wings and to nothing else', () => {
    const travels = createWorld('compose-travel', DEFAULT_PROFILE)
    travels.coachOnEventWeeks = true
    const stays = createWorld('compose-travel', DEFAULT_PROFILE)
    const self = createWorld('compose-travel', DEFAULT_PROFILE)
    self.coachId = null

    // ⚠ RE-AIMED 15.08: the third argument is «is he at THIS court», not the standing stance. The
    // owner's ruling – «поездки С тренером открываются на w серии с призами» – means the helping
    // follows the FARE, so `world.coachOnEventWeeks` alone no longer buys it. Reading it off the
    // stance is exactly what gave a junior event and a home practice friendly the doubled edge for
    // free; `travels` still carries the stance, and the flag is what says he came.
    const a = kidMatchPlayerFor(travels, 'hard', true)
    const b = kidMatchPlayerFor(stays, 'hard', false)
    const c = kidMatchPlayerFor(self, 'hard', true)
    const one = coachEdgePp(travels.seed, travels.coachId) * COACH_EDGE_POINTS_PER_PP
    expect(one).toBeGreaterThan(0)
    for (const k of WINGS) {
      expect(a[k] - c[k], `${k} vs self`).toBeCloseTo(2 * one, 10)
      expect(b[k] - c[k], `${k} vs self, staying`).toBeCloseTo(one, 10)
      expect(a[k] - b[k], `${k} – the helping itself`).toBeCloseTo(one, 10)
    }
    // her age and her name are hers, not the coach's, and not the trip's
    expect(a.age).toBe(c.age)
    expect(a.name).toBe(c.name)
  })

  it('spends no MAIN draw at any rung, with the switch ON', () => {
    for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
      const world = createWorld('main-travel', { ...DEFAULT_PROFILE, coachTier: tier })
      world.coachOnEventWeeks = true
      const before = { ...world.rngMain }
      kidMatchPlayerFor(world, 'hard')
      coachMatchEdge(world)
      coachEdgeView(world)
      expect(world.rngMain, tier).toEqual(before)
    }
  })

  it('is undefined-safe: a pure caller with no stance composes as a career that does not travel', () => {
    const world = createWorld('pure-travel', DEFAULT_PROFILE)
    world.coachOnEventWeeks = false
    const { coachOnEventWeeks: _drop, ...noStanceField } = world
    const withField = kidMatchPlayerFor(world, 'clay')
    const withoutField = kidMatchPlayerFor(noStanceField, 'clay')
    expect(withField).toEqual(withoutField)
    for (const k of WINGS) expect(Object.is(withField[k], withoutField[k]), k).toBe(true)
  })
})

describe('the plaque is about the MAN, and the trip is not part of who he is', () => {
  it('names the same third of the same corridor whether or not he travels', () => {
    // `coachEdgePlacement` reads his own draw and takes no trip: a coach cannot be a different person
    // at an away tournament. Asserted on the VIEW as well, because that is what a screen reads.
    const stays = createWorld('plaque-travel', DEFAULT_PROFILE)
    const travels = createWorld('plaque-travel', DEFAULT_PROFILE)
    travels.coachOnEventWeeks = true
    stays.week = travels.week = 300
    // ⚠⚠ RE-AIMED, NOT WEAKENED (round-21 #2, the last open item). This used to be a whole-view
    // `toEqual`, and the sentence under it said so in as many words: «a gap this slice deliberately
    // does not close - `corridorPct` and the market card's `edgePct` still print the rung's HOME
    // corridor to a family that travels ... invisible on screen T until the owner rules on the copy».
    // He ruled, the copy shipped, and the view now carries a SECOND bracket - so a whole-view equality
    // would have to be deleted or the fix reverted. It is neither: every field the claim was ever
    // about is named below, one by one, and the ONE field that legitimately differs is asserted to
    // differ. A `toEqual` that is edited whenever it fails proves nothing; a list of the fields the
    // trip may not touch cannot be satisfied by accident.
    const { travelCorridorPct: _t, travelLine: _l, ...stayed } = coachEdgeView(stays)
    const { travelCorridorPct: _t2, travelLine: _l2, ...travelled } = coachEdgeView(travels)
    expect(travelled, 'the place, the plaque, the clock and the home corridor are all his, not the trip\'s').toEqual(stayed)
    expect(coachEdgePlacement(travels.seed, travels.coachId)).toBe(coachEdgePlacement(stays.seed, stays.coachId))
    // THE HOME CORRIDOR IS STILL THE HOME CORRIDOR on both sides - the original assertion, unchanged.
    // Whatever the screen gains, `corridorPct` may never quietly become the doubled band: something
    // reading it as "what her rung is worth per match" would be off by a factor of two and silent.
    expect(coachEdgeView(travels).corridorPct).toEqual(COACH_EDGE_CORRIDOR_PP.middle)
    expect(coachEdgeView(stays).corridorPct).toEqual(COACH_EDGE_CORRIDOR_PP.middle)
    // ...and the ONE field the trip owns, which is the item this closes: the same band, doubled, and
    // absent entirely for the family that leaves him at home.
    expect(coachEdgeView(travels).travelCorridorPct).toEqual([1.0, 1.8])
    expect(coachEdgeView(stays).travelCorridorPct).toBeNull()
  })
})

// =================================================================================================
// ⭐⭐ ...AND THE SCREEN SAYS SO NOW – round-21 #2's last open item
// =================================================================================================
//
// The ledger's own words: «STILL HIS, AND SMALL: the screen does not yet say the bonus exists –
// `edgePct` prints the rung's HOME corridor to a family that travels». The doubling shipped, was
// measured at 500 paired careers, and a family paying a second fare to every W event read exactly
// the number a family that leaves the coach at home reads.
//
// WHAT THE FIX MAY NOT COST, and each of these has a test below:
//   * §4's ANTI-SHOPPING RULE. The market may quote a price bracket and may never quote a man. Twice
//     a bracket is a bracket - but only while the doubling is cut from the TIER TABLE, so the test is
//     that every card in a rung carries the identical pair and that no coach's own travelling value
//     is recoverable from his row.
//   * §7's RULE THAT THE PLAQUE NAMES A THIRD AND NEVER A FIGURE. The sentence beside the second
//     bracket quotes no number at all, and the placement does not move when the family travels.
//   * INVARIANT 2. Both views are asked with the stance ON and the MAIN stream may not move.
//   * AND IT MAY NOT OVERSTATE. `coachTravelFareFor` sends him only to rungs that pay prize money
//     unless the junior stance is open too, so «the corridor is doubled» would be false for a girl on
//     the junior tour. The copy says «twice that on the trips the coach travels to», which is true of
//     every family that holds the stance, and the test is that no arm of it claims otherwise.
describe('the two readouts say the bonus exists, without overstating it', () => {
  it('doubles every rung exactly, and leaves `self` the zero it is', () => {
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      expect(coachEdgeCorridorPp(tier), tier).toEqual([lo, hi])
      expect(coachEdgeCorridorPp(tier, true), tier).toEqual([lo * 2, hi * 2])
    }
    // Twice nothing is nothing - and the parent in the car is not "travelling with her" anyway, which
    // is why `coachTravelsWithHer` refuses before this is ever reached on a self-coached career.
    expect(coachEdgeCorridorPp('self', true)).toEqual([0, 0])
  })

  it('⚠ THE MARKET STILL SELLS A PRICE BRACKET – every card in a rung carries the same pair', () => {
    // The whole of §4: a number on an unhired card turns the market into a shop window with the
    // prices written on the back, and since the value is a property of the MAN that search would
    // always succeed. So the travel column is asserted to be a FUNCTION OF THE RUNG - identical on
    // every man in it - and his own travelling figure is asserted to be absent from his row.
    const world = createWorld('market-travel', DEFAULT_PROFILE)
    setCoachOnEventWeeks(world, true)
    const rows = coachMarket(world)
    expect(rows.length, 'the market drew cards to check').toBeGreaterThan(8)
    for (const tier of HIREABLE_TIERS) {
      const inRung = rows.filter((r) => r.tier === tier)
      expect(inRung.length, `${tier} has cards`).toBeGreaterThan(0)
      for (const r of inRung) {
        expect(r.edgeTravelPct, `${tier}/${r.id}`).toEqual(coachEdgeCorridorPp(tier, true))
        // ...and the HOME figure has not moved, which is what makes the second one an addition rather
        // than a re-labelling of the first.
        expect(r.edgePct, `${tier}/${r.id}`).toEqual(COACH_EDGE_CORRIDOR_PP[tier])
        // HIS OWN travelling value is a number nothing on this row can produce: it is strictly inside
        // the bracket at both ends for every coach the roster builds.
        const his = coachEdgePp(world.seed, r.id, true)
        expect(his, `${tier}/${r.id}`).toBeGreaterThan(r.edgeTravelPct![0])
        expect(his, `${tier}/${r.id}`).toBeLessThan(r.edgeTravelPct![1])
      }
    }
  })

  it('...and the family that leaves him at home reads the card it read before', () => {
    const stays = coachMarket(createWorld('market-home', DEFAULT_PROFILE))
    expect(stays.length).toBeGreaterThan(8)
    for (const r of stays) {
      expect(r.edgeTravelPct, `${r.tier}/${r.id}`).toBeNull()
      expect(r.edgePct, `${r.tier}/${r.id}`).toEqual(COACH_EDGE_CORRIDOR_PP[r.tier])
    }
  })

  it('⚠ A SELF-COACHED FAMILY WITH THE STANCE ON IS SHOWN NOTHING – there is nobody to send', () => {
    // The stance persists for a self-coached family (it takes effect the day she hires somebody), so
    // this is a real state and not a corner. `coachTravelsWithHer` is the gate on both views, which is
    // the same pair the fare is charged on - so the screen cannot promise a helping the till would
    // refuse to buy.
    const world = createWorld('self-travel', { ...DEFAULT_PROFILE, coachTier: 'self' })
    setCoachOnEventWeeks(world, true)
    expect(coachTravelsWithHer(world), 'nobody to send').toBe(false)
    expect(coachEdgeView(world).travelCorridorPct).toBeNull()
    expect(coachEdgeView(world).travelLine).toBe('')
    for (const r of coachMarket(world)) expect(r.edgeTravelPct, r.id).toBeNull()
  })

  it('⚠ THE SENTENCE NAMES A CONDITION AND CLAIMS NO DOUBLING – and quotes no figure at all', () => {
    const world = createWorld('line-travel', DEFAULT_PROFILE)
    setCoachOnEventWeeks(world, true)
    const line = coachEdgeView(world).travelLine
    expect(line).toBe('Twice that on the trips the coach travels to.')
    // ⚠ THE THING IT MAY NOT SAY. A junior week doubles nothing unless the family has opened that
    // stance too (`coachTravelFareFor` tests the rung's own `prizeCents`), so a flat "the corridor is
    // doubled" would be a claim about a season a fourteen-year-old is not playing. The conditional is
    // the true form, and it is asserted as an absence so a future rewrite cannot quietly drop it.
    expect(line, 'it names the trips it applies to').toMatch(/on the trips/)
    expect(line, 'and never claims the corridor itself is doubled').not.toMatch(/doubled/i)
    // No figure: this line sits under a bracket and beside a plaque, and neither of those may be read
    // as a measurement of one person (§7).
    expect(line, 'no numeral anywhere').not.toMatch(/\d/)
    // R15-7 (owner, 09.08): no pronoun names the coach - a woman sits on every roster by construction.
    expect(line, 'no pronoun for the coach').not.toMatch(/\b(he|him|his)\b/i)
    // Short dash only, and English only - the app's standing copy rules.
    expect(line).not.toMatch(/—/)
    expect(line).not.toMatch(/[Ѐ-ӿ]/)
  })

  it('⚠ SPENDS NO MAIN DRAW, with both views asked and the stance ON', () => {
    // Invariant 2. Both readouts are snapshot-derived and the frozen capture may not move because a
    // screen started telling the truth.
    for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
      const world = createWorld('main-views', { ...DEFAULT_PROFILE, coachTier: tier })
      world.coachOnEventWeeks = true
      const before = { ...world.rngMain }
      coachMarket(world)
      coachEdgeView(world)
      expect(world.rngMain, tier).toEqual(before)
    }
  })

  it('⚠ AND NO SCHEMA MOVED – both readouts are derived, and a save round-trips without them', () => {
    // The two fields are computed in `coachMarket` / `coachEdgeView` at snapshot time, exactly like
    // the corridor they sit beside. Nothing about the edge has ever been persisted (§2: the value is
    // re-derived off his id), and the proof is that the world carries no key for either.
    const world = createWorld('schema-travel', DEFAULT_PROFILE)
    setCoachOnEventWeeks(world, true)
    const keys = Object.keys(world)
    expect(keys).not.toContain('travelCorridorPct')
    expect(keys).not.toContain('edgeTravelPct')
    expect(keys).not.toContain('travelLine')
    // ...and the stance it IS gated on is the one that already shipped, so this closes without a
    // migration: same field, one more reader.
    expect(keys, 'the gate is a field the save already had').toContain('coachOnEventWeeks')
  })
})

// ---------------------------------------------------------------------------
// ⚠⚠ THE HELPING FOLLOWS THE FARE – the owner's ruling, 15.08, and the two places it was leaking.
//
// «Надбавка — везде, включая юниорские турниры» was my reading of the shipped code, and he refused
// it: «я такого не говорил. Еще раз: поездки С тренером открываются на w серии с призами.» The
// helping had been reading `world.coachOnEventWeeks` – the standing STANCE – so it applied at two
// weeks nobody ever sent him to:
//
//   * a JUNIOR event, where `coachTravelFareFor` charges nothing because the rung pays nothing, so
//     the family got the doubled edge for free at exactly the rungs his own 30.07 argument excluded;
//   * a HOME PRACTICE FRIENDLY, which is not a trip at all.
//
// The fix is that the caller answers "is he at THIS court", and the one source of truth is the fare
// – it already carries the stance, the "somebody to send" clause and the W-series gate together.
// ---------------------------------------------------------------------------
describe('round-21 – the travel helping is charged where the fare is, and nowhere else', () => {
  it('a W-series trip doubles him; a junior trip does not, on the SAME career with the switch ON', () => {
    const world = createWorld('helping-follows-fare', DEFAULT_PROFILE)
    world.coachOnEventWeeks = true
    expect(world.coachId, 'the fixture must actually employ somebody').not.toBeNull()

    const paying = world.season.find((e) => TIERS[e.tier].prizeCents !== undefined && e.travelCostCents > 0)
    const junior = world.season.find((e) => TIERS[e.tier].prizeCents === undefined)
    expect(paying, 'the calendar reaches a rung that pays').toBeTruthy()
    expect(junior, 'the calendar has a junior rung').toBeTruthy()

    // The engine's own answer at each event – the same expression world.ts and the preview use.
    const atPaying = kidMatchPlayerFor(world, 'hard', coachTravelFareFor(world, paying!) > 0)
    const atJunior = kidMatchPlayerFor(world, 'hard', coachTravelFareFor(world, junior!) > 0)
    const alone = kidMatchPlayerFor({ ...world, coachId: null }, 'hard', true)

    const one = coachEdgePp(world.seed, world.coachId) * COACH_EDGE_POINTS_PER_PP
    expect(one).toBeGreaterThan(0)
    for (const k of WINGS) {
      expect(atPaying[k] - alone[k], `${k}: he came, so he counts twice`).toBeCloseTo(2 * one, 10)
      expect(atJunior[k] - alone[k], `${k}: nobody paid a fare, so he counts once`).toBeCloseTo(one, 10)
    }
  })

  it('and a caller with no event – the home practice friendly – gets no helping at all', () => {
    // `planner.ts` builds her for a practice match and passes no trip, which is the whole point: a
    // friendly at her own club cannot be a journey he came on. Omitted means false by construction.
    const world = createWorld('helping-friendly', DEFAULT_PROFILE)
    world.coachOnEventWeeks = true
    const atHome = kidMatchPlayerFor(world, 'hard')
    const onTour = kidMatchPlayerFor(world, 'hard', true)
    const one = coachEdgePp(world.seed, world.coachId) * COACH_EDGE_POINTS_PER_PP
    for (const k of WINGS) {
      expect(onTour[k] - atHome[k], `${k}: the trip is worth exactly one more helping`).toBeCloseTo(one, 10)
    }
  })
})
