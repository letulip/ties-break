import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
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
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

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

// =================================================================================================
// ⭐⭐ RE-FREEZE #13 – 19.08.2026, ONE FOR THE WHOLE OF ROUND 23.
// =================================================================================================
//
// ⚠ DELIBERATELY ONE, AND THAT IS THE POINT. Three separate agents in this wave moved these careers
// and each correctly declined to re-freeze: #12/#13 (the domestic table becomes season-to-date) went
// red first, #18's schema bump to v54 is a second independent reason, and #3b's retirement news a
// third. Three competing re-freezes, each baking in the others' unattributed movement, is how a hash
// pin dies quietly - so they reported, and this is the single re-cut that owes them all a diff.
//
// PER-KEY DIFF TAKEN FIRST, as this file demands - `tools/frozen-key-diff.ts`, all three presets,
// policy 1, against a worktree at `c518ad1`, the wave's own start.
//
// ⚠ AND RE-TAKEN AFTER THE LAST FIX, which is why it can be trusted against THESE hashes. The first
// cut of this note was written, correctly, before the season-table zero-rank rule was narrowed to
// the domestic fold - and three more edits then moved these careers again. A diff describing a tree
// that is not the frozen one is a stale comment of exactly the kind this round spent the day
// removing, so it was measured a second time on the tree these hashes were cut from. Both readings
// agree: 39 of 66 moved, `rngMain` unmoved, 27 unmoved.
//
// ⚠ 39 OF 66 KEYS MOVED, and for a wave that changed WHICH TABLE a domestic result is folded into,
// added a persisted field of her own, and put two new kinds of row in the feed, a narrow diff would
// have been the alarming outcome. The rank caches, the money, the ledgers and the season history all
// move together because they are all downstream of the same fold.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL IN ALL THREE PRESETS. The
// world's identity is intact with it - `seed`, `week`, `profile`, `potential`, `cohort`, `season`,
// `plan`, `college`, `fork`, `birthdays`; 27 keys unmoved in total. `schemaVersion` moved on purpose
// (53 -> 54) and `kidFundsCents` is the field that moved it.

// =================================================================================================
// ⭐⭐ RE-FREEZE #12 – 19.08.2026. THE WIDEST DIFF THIS FILE HAS EVER TAKEN, and by a long way.
// =================================================================================================
//
// PER-KEY DIFF TAKEN FIRST, as this file demands - `tools/frozen-key-diff.ts`, all three presets,
// policy 1, 156 weeks. The control was MY OWN CHANGE REVERTED in this same tree, never the previous
// commit, per CLAUDE.md's rule about shared checkouts.
//
// ⚠ 36 OF 65 KEYS MOVED. Every earlier re-freeze in this file moved between zero and a handful; this
// one moved more than half the world, and the honest reason is that TWO rules changed underneath it:
//
//   1. THE LIVE PROFESSIONAL TABLE WAS CORRECTED (season/fieldPros.ts `mergedWtaRanking`). v53 added
//      a pro's season winnings ON TOP of her derived book, which counted the same tennis twice and
//      inflated the table all season - measured +24% by mid-season, concentrated on the ~350 of 1600
//      pros who actually play. The acceptance cuts read that and refused the kid: a ten-season career
//      reached the W tour in NO season and finished on DOMESTIC events at 22. Winnings now REPLACE a
//      share of the book, the table's total is preserved by construction, and the same career turns
//      professional in season 2 and stays there.
//   2. THE AGE-ELIGIBILITY RULE NOW BINDS THE FIELD, not the kid alone (owner, 19.08). Four routes
//      into a W draw were gated - the entry list, the on-ramp's held slots, the slam wild cards, and
//      the shadow bracket's universe - so who is in a draw changed, and everything downstream of a
//      draw changed with it.
//
// A change to WHO IS IN EVERY PROFESSIONAL DRAW and to WHAT THE TABLE SAYS cannot leave a career's
// results, rankings, wallet, or development untouched, so a narrow diff here would have been the
// alarming outcome, not this one.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL IN ALL THREE PRESETS. That
// is the invariant this file guards and it held by construction rather than by luck - both rules run
// off event-scoped sub-streams and pure derivation, and neither adds or removes a MAIN draw. Twenty
// -nine keys were identical in total, and they are the world's identity: `seed`, `week`,
// `schemaVersion`, `profile`, `potential`, `plan`, `college`, `fork`, `birthdays`, `rngMain`.
//
// ⚠ `cohort` MOVED PARTLY FOR A COSMETIC REASON and it is named here so nobody re-derives it later:
// 'Martin' was APPENDED to SURNAMES the same day (owner's request), and the pool's length is part of
// `pickInt`'s index arithmetic, so new careers draw different surnames. The draw COUNT is unchanged -
// which is exactly why `rngMain` did not move - and no persisted career is renamed.
// =================================================================================================
// ⚠⚠ A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL – the invariant-2 claim, as a frozen capture
// =================================================================================================
//
// The three hashes below were measured at commit `2d7d336`, the commit BEFORE the travel helping,
// and they are the same three the changed engine produces: `sha256(JSON.stringify(world))` after 156
// weeks, which is the exact serialisation `compressWorld` feeds gzip, so "identical here" is
// "identical in a save". The two grinder careers hold a hired coach for the whole run with
// `coachOnEventWeeks` FALSE; the player-policy one has the switch ON and nobody to send.
//
// ⚠ THEY ARE A DOCUMENTED MEASUREMENT AND NOT A CHANGE-GATE, in exactly the sense CLAUDE.md's
// invariant 2 gives the frozen MAIN capture: a wave that legitimately moves a career updates them.
// What they may never do is move because of a change to the coach's edge that was supposed to be
// scoped to the trip.
// ⭐⭐ RE-FROZEN AT v49 (15.08), AND WHAT MOVED THEM WAS MEASURED KEY BY KEY BEFORE THEY WERE TOUCHED.
// The junior-travel stance is a persisted field (`coachOnJuniorEvents`, schema v49), so `createWorld`
// writes it and `SAVE_SCHEMA_VERSION` moved with it - and both of those are IN the serialisation
// these hashes are taken of. All three went red at once, which is exactly the alarm a wave touching
// coach travel should have to answer.
//
// ⚠ THE ANSWER IS A DIFF, NOT AN ASSERTION. Each of the 63/64 top-level keys of the week-156 career
// was hashed on its own, before and after: **`schemaVersion` (48 -> 49) and the new `coachOnJuniorEvents`
// key, and NOTHING ELSE.** Same funds, same results, same events, same rngMain, same everything the
// career actually is - the two differences are the schema bump's own footprint and could not have
// been avoided by any implementation of it. That is the "wave that legitimately moves a career"
// CLAUDE.md's invariant-2 note allows, and re-freezing without the per-key check would have been the
// thing it forbids.
//
// ⚠ AND THE STANCE IS `false` IN ALL THREE, asserted in `careerHash` below rather than assumed: these
// careers do not send the coach to junior events, so nothing about the new mechanic can be hiding
// inside the new numbers.
// ⭐⭐ RE-FROZEN AGAIN AT P1 (15.08, docs/specs/junior-access-2026-08.md), AND THE PER-KEY DIFF WAS
// TAKEN FIRST, EXACTLY AS THE PARAGRAPH ABOVE DEMANDS. This time the answer is the opposite shape and
// that is the point of writing it down: the v49 re-freeze moved TWO keys and both were the schema
// bump's own footprint; this one moves about THIRTY per career, and they are all downstream of the
// ladder. Measured, all 63/64 top-level keys hashed on their own on both sides (worktree at `ea8b97f`
// against this branch), the three careers agree on the moved set to within one or two keys:
//
//   MOVED   results · bestFinishByTier · trophiesByTier · entries · seasonEntries · seasonHistory ·
//           seasonRecord / seasonWins / seasonStartRank · kidRank / kidRankWta / kidRankDomestic and
//           their prev* companions · internationalEntryWeeks · fundsCents · financeWeeks ·
//           careerTotals · events · offers · milestones · knockHistory · injuryHistory · condition ·
//           skills · academy · nextEventId · walkoverWeek · lastSeasonSummary
//   UNMOVED **coachId · coachOnEventWeeks · coachOnJuniorEvents · coachSince · profile · seed ·
//           rngMain · cohort · schemaVersion**
//
// ⚠ READ THE SECOND LINE, NOT THE FIRST. What this file's frozen hashes are FOR is stated one
// paragraph up – *"what they may never do is move because of a change to the coach's edge that was
// supposed to be scoped to the trip"* – and every coach key, the profile and the schema are
// byte-identical. What moved is a career: she enters different tournaments, so she banks different
// results, holds different ranks and different money. A rule that changes which rungs a junior may
// stand on and left `results` untouched would be the thing to worry about.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED, which is the invariant-2 half of the same check: P1 draws on
// no stream at all (an access rule is a post-draw gate), so the persisted MAIN position after 156
// weeks is the same in both trees. The frozen MAIN capture in tests/condition.test.ts is likewise
// untouched – count 41550, hash e6b0c709 – and is asserted before its own companion constant.
// ⭐⭐ RE-FROZEN AGAIN AT P2 (16.08, docs/specs/age-eligibility-window-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST, AGAIN. All 63/64 top-level keys hashed on their own on both sides (a worktree
// at `4d49fc3` against this branch), and this time the three careers DISAGREE with each other in a way
// that is itself the evidence:
//
//   5:0  middle coach · grinder   MOVED **internationalEntryWeeks AND NOTHING ELSE** – 63 of 64 keys
//                                 byte-identical, `results` included. She never reaches a cap, so P2
//                                 changed no decision she made; what moved is how long the LEDGER is
//                                 kept, because `pruneInternationalEntries` now retains back to her
//                                 birthday instead of to New Year. A retention change, visible in the
//                                 whole-world hash and in nothing else.
//   8:0  elite coach · grinder    the junior allowance now bites on ONE window instead of two, so
//                                 results / ranks / money / milestones move. `proEntryWeeks` UNMOVED:
//                                 the grinder never enters a W event, so the pro half cannot show.
//   0:1  self-coached · player    both ledgers move, and with them `seasonEntries`, `results`, the
//                                 ranks and the wallet – this is the arm that actually plays the tour.
//
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion · season**
//
// ⚠ READ THE LAST LINE, AS ALWAYS. What these hashes are FOR is one paragraph up – they may never
// move because of a change to the coach's edge that was supposed to be scoped to the trip – and every
// coach key, the profile, the schema and the calendar are byte-identical on all three careers. What
// moved is a career: an age rule that changed how many events a fifteen-year-old may enter and left
// `results` untouched would be the alarm.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED on all three, which is the invariant-2 half: P2 draws on no
// stream at all (an entry allowance is a post-draw gate), so the persisted MAIN position after 156
// weeks is identical in both trees. The frozen MAIN capture in tests/condition.test.ts is likewise
// untouched – count 41550, hash e6b0c709.
// ⭐ AND RE-FROZEN ONCE MORE INSIDE THE SAME WAVE, FOR P2's OWN ITEM 6 (`w15.minAgeYears` 16 -> 14,
// the owner's ruling of 16.08) – PER-KEY DIFF TAKEN AGAIN, this time against the previous commit
// (`53223b3`) rather than against the start of the wave, so the number names ITS OWN change:
//
//   all three careers   32 of 64 keys moved, and they are the same 32 each time: `results`,
//                       `bestFinishByTier`, `entries`, `seasonEntries`, `seasonHistory`, the four
//                       rank caches and their prev* companions, `fundsCents`, `financeWeeks`,
//                       `careerTotals`, `skills`, `condition`, `events`, `milestones`, `offers`,
//                       `academy`, `trophiesByTier`, `knockHistory`, `injuryHistory`,
//                       `internationalEntryWeeks` – and on the player-policy arm `proEntryWeeks`.
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion · season**
//
// A rung that opens two years earlier changes which tournaments a girl enters from the age of
// fourteen, so a career diverges early and stays diverged – that is the whole of the 32. What these
// hashes exist to catch is a coach change leaking past the trip, and every coach key, the profile,
// the calendar and the schema are byte-identical on all three careers.
//
// ⚠ `rngMain` IS AGAIN AMONG THE UNMOVED, on all three. An age gate is a post-draw filter, so the
// persisted MAIN position after 156 weeks is identical – and the frozen capture in
// tests/condition.test.ts is likewise untouched (count 41550, hash e6b0c709), asserted before its own
// companion constant, which did move (89 -> 93; the mechanism is written out there).
// ⭐⭐ RE-FROZEN AGAIN AT P3 (16.08, docs/specs/acceptance-cuts-corrected-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST FOR THE FOURTH TIME – a worktree at `c04253f` (the commit this phase starts
// from) against this branch, all 64 top-level keys hashed on their own, on all three careers:
//
//   5:0  middle coach · grinder   28 keys, and ⚠ `ending`, `debtSinceWeek` and
//                                 `medicalWithdrawalWeek` are among them – THIS CAREER ENDS
//                                 DIFFERENTLY. A ladder that changes which tournaments she can
//                                 afford to enter changes what the money does, and this is the arm
//                                 where that shows as an ending rather than as a rank.
//   8:0  elite coach · grinder    27 keys – `results`, the rank caches, the season counters and the
//                                 wallet. No `ending`: the wealthy arm absorbs it.
//   0:1  self-coached · player    32 keys, the widest set – it is the arm that actually plays the
//                                 tour, so `entries`, `seasonEntries`, `proEntryWeeks` and even
//                                 `vacations` move with the rest.
//
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion**
//
// ⚠ READ THE LAST LINE, AS ALWAYS. An acceptance cut decides which rungs she may enter, so a career
// diverges at the first door that moved and stays diverged – that is the whole of the 27-32. What
// these hashes exist to catch is a coach change leaking past the trip, and every coach key, the
// profile and the schema are byte-identical on all three.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE THIRD WAVE RUNNING, which is the invariant-2 half:
// an acceptance cut is a POST-DRAW GATE and taps no stream, so the persisted MAIN position after 156
// weeks is identical in both trees. The frozen MAIN capture in tests/condition.test.ts is therefore
// untouched (count 41550, hash e6b0c709) and needed no paragraph this time – ⚠ nor did its companion
// `REF.kidRank`, which is the one difference from P1 and P2: that constant reads a career whose
// doors P3 did not move.
// ⭐⭐ RE-FROZEN AGAIN AT P5 (16.08, docs/specs/college-as-a-second-act-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST FOR THE FOURTH TIME – BUT NOT WITH A WORKTREE, BECAUSE A STRONGER ANSWER WAS
// AVAILABLE AND IT IS ASSERTED BELOW RATHER THAN REPORTED HERE.
//
// P5 spends the college freeze one year at a time and adds a national-team week inside it, and BOTH
// live behind `inCollege`. None of these three careers goes to college – `world.college` is `null` in
// all three at week 156, which is 32 weeks before the fork is even asked – so the only thing P5 can
// reach on them is `SAVE_SCHEMA_VERSION`, bumped 49 -> 50 for `CollegeState`'s new ledger.
//
// ⚠ SO THE CHECK IS AN IDENTITY, NOT A COMPARISON. Instead of hashing 64 keys on both sides of a
// worktree and reading which ones moved, `PRE_V50` below holds the OLD hashes and a case hashes the
// SAME live world with `schemaVersion` rolled back to 49 – and gets them back **byte for byte, all
// three**. That is not "the other keys look unmoved"; it is "there is no other difference at all".
// It is also self-evidencing forever: if a later wave moves one of these careers for a real reason,
// the rollback case goes red beside the freeze and says which kind of change it was.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE FOURTH WAVE RUNNING, by the same identity: the
// call-up draws on `seed:callup:<week>`, its own sub-stream, and is unreachable outside the freeze in
// any case. The frozen MAIN capture in tests/condition.test.ts is untouched (count 41550, hash
// e6b0c709).
//
// ⭐⭐ RE-FROZEN FOR THE FIFTH TIME (16.08), FOR THE OWNER'S AGE-GRID RULING – «настоящих порогов
// только два – 14 и 18 … Возрастное есть только по количеству сыгранных в год». `w35`/`w50`/`w75`/
// `w100` and the Slam moved to 14, the four WTA rungs to 15. PER-KEY DIFF TAKEN FIRST, as this file
// demands, from a worktree at `d595f5d` (the commit the wave starts from) against this branch, all
// 64 top-level keys hashed on their own:
//
//   ⚠⚠ THE SAME 27 KEYS ON ALL THREE CAREERS, AND `entries` IS NOT ONE OF THEM. Moved: `results`,
//   `bestFinishByTier`, `kidRank`, `kidRankWta`, the three `prev*` rank caches, `seasonStartRank`,
//   `seasonWins`, `seasonLosses`, `seasonRecord`, `seasonHistory`, `lastSeasonSummary`, `fundsCents`,
//   `financeWeeks`, `careerTotals`, `skills`, `condition`, `events`, `milestones`, `offers`,
//   `academy`, `trophiesByTier`, `knockHistory`, `injuryHistory`, `internationalEntryWeeks`,
//   `proEntryWeeks`, `nextEventId`.
//
//   UNMOVED IN ALL THREE  **entries · seasonEntries · coachId · coachOnEventWeeks ·
//                         coachOnJuniorEvents · profile · seed · rngMain · cohort · schemaVersion ·
//                         season · college · fork · ending · debtSinceWeek · knock · injury · kit ·
//                         potential · plan · vacations · practices · penalties · birthdays**
//
// ⭐ AND `entries` UNMOVED IS THE FINDING, NOT A FOOTNOTE. **She did not enter one different event.**
// Every previous re-freeze of this file moved `entries` – a rung that opens earlier is a rung she
// enters earlier. Not here: the three frozen careers are 156 weeks long (she is 16.6 at the end) and
// on the two grinder arms she plays nothing paid at all, while the acceptance cuts refuse her at the
// rungs whose floors moved. What moved is `results`, and the mechanism is worth naming because it is
// the one this file could otherwise be read as an alarm about: `selectEntrants` filters a draw's
// CANDIDATES on the same age gate, so opening W35+ to fourteen-year-olds changes which COHORT players
// fill the fields she meets. Different opponents, same calendar, different results.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE FIFTH WAVE RUNNING – an age gate is a POST-DRAW
// filter and taps no stream, so the persisted MAIN position after 156 weeks is identical and the
// frozen MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
//
// ⚠ `ending`, `college` AND `fork` ARE ALSO UNMOVED, which is the other ruling's half: the college
// rule was removed the same day, and none of these careers reaches the fork (week 156 is 32 weeks
// short of it), so nothing in that removal can reach a hash here by construction.
//
// ⭐⭐ RE-FROZEN FOR THE SIXTH TIME (16.08), FOR THE TWO ACCEPTANCE INVERSIONS –
// `docs/specs/the-ladder-is-monotone-2026-08.md` §2. `wta125.acceptsRank` 180 -> 210 (it was TIGHTER
// than the WTA 250 above it) and `j300.enterPct` 0.20 -> 0.25 (it was tighter than the rung's own
// field band, so the rung refused the population its draw is made of). PER-KEY DIFF TAKEN FIRST, as
// this file demands, from a worktree at `3198a11` against this branch, all 62 top-level keys hashed
// on their own on all three careers:
//
//   ⚠⚠ TWO OF THE THREE CAREERS DID NOT MOVE ONE BYTE. `middleGrinder` and `eliteGrinder` are
//   IDENTICAL – zero keys of sixty-two – and only the PLAYER arm moved, exactly as the P5 re-freeze
//   went. The grinder policy enters everything it can afford in ladder order and its two careers
//   never clear a J300's cut at either value.
//
//   MOVED, on `selfTravelling` alone (17 of 62): `results`, `bestFinishByTier`, `kidRank`,
//   `prevKidRank`, `seasonStartRank`, `seasonHistory`, `lastSeasonSummary`, `fundsCents`,
//   `financeWeeks`, `careerTotals`, `skills`, `events`, `nextEventId`, `milestones`, `offers`,
//   `academy`, `trophiesByTier`.
//
//   UNMOVED IN ALL THREE  **entries · seasonEntries · season · internationalEntryWeeks ·
//                         proEntryWeeks · rngMain · cohort · schemaVersion · profile · seed ·
//                         potential · plan · condition · kit · injury · injuryHistory · knock ·
//                         knockHistory · kidRankWta · kidRankDomestic · prevKidRankWta ·
//                         prevKidRankDomestic · seasonWins · seasonLosses · seasonRecord · college ·
//                         fork · ending · debtSinceWeek · vacations · practices · penalties ·
//                         birthdays · coachId · coachOnEventWeeks · coachOnJuniorEvents ·
//                         onRampCleared · physioActive · recoveryBuff · suspendedUntilWeek ·
//                         retirementOffer · pendingTournament · oneMoreYearCount · careerId · week**
//
// ⭐⭐ AND THE MECHANISM IS MEASURED RATHER THAN INFERRED, WHICH IS THE POINT OF DOING THE DIFF. The
// three unmoved ledgers above (`entries`, `internationalEntryWeeks`, `proEntryWeeks`) say she played
// the same WEEKS, and a per-tier count of her 156 weeks of entries says why:
//
//     tier      before                                          after
//     j60       12                                              **11**
//     j300      0                                               **1**
//     everything else (j30 13 · local 10 · regional 12 · national 2 · w15 7 · w35 3)   unchanged
//     TOTAL     59                                              **59**
//
// **ONE J60 BECAME ONE J300, ON THE SAME WEEK.** The entry policy takes at most one event a week and
// walks the calendar strongest-first, so the moment the prestige rung's cut reached her the swap was
// free – same week, same allowance, one rung up. Her ITF rank at week 156 moved **#46 -> #21** on
// that single event (a J300 pays 300/210/140/100/60 against a J60's table) and the family is $425
// lighter for the bigger fee and trip. That is the fix working, on exactly one week of one career.
//
// ⚠ THE WTA 125 HALF CANNOT REACH THESE HASHES AT ALL, and that is arithmetic rather than luck: she
// is 16.6 at week 156 and the baseline's median rank at 17 is #375, so a door at 210 refuses her
// exactly as a door at 180 did. Everything above is `j300` alone.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE SIXTH WAVE RUNNING – an acceptance cut is a gate on an
// entry, not a draw, so the persisted MAIN position after 156 weeks is identical and the frozen MAIN
// capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
// =================================================================================================
// ⭐⭐ RE-FROZEN AN EIGHTH TIME (17.08, THE SKILL LAW - docs/specs/the-skill-gap-2026-08.md), AND
// THIS IS THE WIDEST DIFF IN THIS FILE'S HISTORY BY A WIDE MARGIN. Every previous re-freeze moved
// ONE key of sixty-four. This one moves TWENTY-EIGHT, and that is the honest shape of the change
// rather than an alarm: `season/fieldPros.ts` replaced eight uniform core bands with one curve
// fitted to the live 2026 WTA Elo list, so EVERY professional in the world has a different strength.
// A career that plays professionals therefore diverges everywhere at once.
//
// THE PER-KEY DIFF WAS TAKEN FIRST, AS THE PROTOCOL DEMANDS - `tools/frozen-key-diff.ts`, all three
// presets, a worktree at this commit with `a412162` reverted (`git revert --no-commit`) against this
// branch. Reader check on the control: `grep -c coreForStanding src/engine/season/fieldPros.ts`
// returns 0 and the shipped uniform draw is present.
//
//   MOVED (28 of 64, middle-grinder; 28 elite-grinder; 24 self-travelling): results · events ·
//     kidRank · kidRankWta · kidRankDomestic · prevKidRank(+Wta/Domestic) · seasonStartRank ·
//     seasonHistory · lastSeasonSummary · bestFinishByTier · trophiesByTier · careerTotals ·
//     fundsCents · financeWeeks · milestones · offers · academy · knockHistory · injuryHistory ·
//     condition · walkoverWeek · medicalWithdrawalWeek · nextEventId · seasonEntries ·
//     internationalEntryWeeks · proEntryWeeks · onRampCleared · vacations · skills
//
//   ⚠ `skills` IS ON THAT LIST AND IT IS THE ONE WORTH NAMING. Her own attributes moved - not
//   because development changed (it did not; `SKILL_K`, `RALLY_K` and `PACE_K` are untouched and
//   `src/engine/match/` does not change at all in this wave) but because a different set of match
//   results feeds a different condition and a different training week. It is a SECOND-ORDER effect
//   of the field, reached through her body, and it is exactly what a wave that re-deals the world's
//   strength should produce.
//
//   UNMOVED (36 of 64): seed · profile · plan · potential · cohort · coachOnEventWeeks ·
//     coachOnJuniorEvents · college · fork · schemaVersion · and the rest of the static contour.
//
// ⚠⚠ **`rngMain` UNMOVED, ON ALL THREE CAREERS, AND IT WAS CHECKED RATHER THAN ASSUMED** - which is
// the load-bearing half and the one the last five re-freezes each verified in turn. Hashes, named:
// middle-grinder `1dbff28caca2` both sides · elite-grinder `aebc8101d6df` both sides ·
// self-travelling `d84bcbf0c481` both sides. A rank-to-core re-deal is POST-DRAW arithmetic:
// `makeFieldPro` still takes exactly one uniform, in the same position, off the same key, and the
// new core is arithmetic on it. **So the frozen MAIN capture in tests/condition.test.ts is untouched
// - count 41550, hash e6b0c709 - and needs no re-pin.** Its COMPANION constant `kidRank` did move,
// 93 -> 88, and is re-pinned there with its own paragraph; the input-independence A/B halves in
// tests/planner.test.ts still pass, which is the fairness property and is not a hash.
//
// ⚠ AND THE POINTS TABLE DID NOT MOVE AT ALL, measured separately: the merged 1,600-row professional
// ranking hashes identically on both arms across five worlds, so every acceptance cut still admits
// exactly the same population. What changed is how strong each of those places is, not who is in it.
//
// ⚠ THE ROLLBACK IDENTITIES BELOW ARE RE-ANCHORED, NOT BROKEN, and the file has precedent language
// for exactly this case: this wave changed the CAREER, not a schema field, so `PRE_V52`/`PRE_V51`/
// `PRE_V50` are re-taken against the new world. Swapping only `schemaVersion` on the SAME live world
// still reproduces them byte for byte, which is the property those constants exist to assert.
// =================================================================================================
// ⭐⭐ RE-FROZEN A NINTH TIME (18.08, THE OWNER'S RENAME) – AND THIS IS THE NARROWEST DIFF IN THE
// FILE'S HISTORY: **ONE KEY OF SIXTY-FOUR, `events`, ON ALL THREE CAREERS.** The owner asked for the
// four professional rungs to join the World Tour family («WTA 125/250/500/1000 – переименовать в
// World Tour по аналогии с предыдущими»), so `TIERS.wta125.label` … `TIERS.wta1000.label` are
// "World Tour 125" … "World Tour 1000" now. Nothing else moved: the tier IDS did not change, and a
// label is display.
//
// PER-KEY DIFF TAKEN FIRST, as this file demands – `tools/frozen-key-diff.ts`, all three presets, a
// detached worktree at `46998dd` (this branch with nothing of the rename in it) against this tree.
// Reader check on the control: the A tree's `calendar.ts` still carries `label: 'WTA 125'` and this
// one carries `label: 'World Tour 125'`.
//
//   MOVED (1 of 64 · 1 of 64 · 1 of 63):  **events**
//
//   UNMOVED IN ALL THREE (everything else, and the four worth naming out loud): **results ·
//     entries · seasonEntries · trophiesByTier · bestFinishByTier · kidRank(+Wta/Domestic) ·
//     fundsCents · financeWeeks · skills · condition · milestones · offers · academy · cohort ·
//     rngMain · schemaVersion** – i.e. every ledger keyed by tier id, which is the proof that the
//     ids did not move with the names.
//
// ⭐⭐ AND THE MECHANISM IS MEASURED RATHER THAN INFERRED. Dumping `world.events[].text` on both arms
// (middle-grinder): **16 lines of 400 differ, and all sixteen are the same sentence with one word
// changed** – "🏆 P. Delgado won the WTA 500." -> "🏆 P. Delgado won the World Tour 500.". Same
// winner, same week, same rung; only the spelling of the rung. ⚠ AND SHE IS IN NONE OF THEM: at week
// 156 she is 16.6 and has never entered a professional rung, so every one of the sixteen is TOUR
// NEWS about the AI field. A rename that had reached her career would have shown up in `results`,
// and `results` is byte-identical.
//
// ⚠ `rngMain` IS AMONG THE UNMOVED FOR THE NINTH WAVE RUNNING – a label is not a draw – so the frozen
// MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
// =================================================================================================
const FROZEN = {
  /** PRESETS[5] · 25k middle family, middle coach · grinder policy (never travels) */
  /** ⚠ MOVED WITH ITS TWINS A FOURTH TIME (17.08, the college choice – schema v52). All three moved
   *  by exactly ONE KEY again, and `PRE_V52` below proves it: rolling `schemaVersion` back to 51 on
   *  the NEW world reproduces the old hashes byte for byte, for all three. */
  /** ⚠ MOVED WITH ITS TWINS AGAIN (21.08, round 24 – the freeze's hygiene, schema v55), and again by
   *  EXACTLY ONE KEY. `PRE_V55` below is the proof rather than the claim: rolling `schemaVersion`
   *  back to 54 on the NEW world reproduces the old hashes byte for byte, for all three careers.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control was **this branch
   *  with MY OWN COMMIT REVERTED** in a dedicated worktree (`git revert --no-commit`) – not the
   *  previous commit, because B2's ranking wave landed on this branch between them and comparing
   *  against it would have measured both. `tools/frozen-key-diff.ts` on all three (preset/policy 5/0,
   *  8/0, 0/1), headers checked against the filenames: **one line of 66 differs, and it is
   *  `schemaVersion`.** `rngMain`, `results`, `season`, `cohort`, `events`, `fundsCents`, `kidRank`,
   *  `skills` – every one byte-identical.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. Round 24's three rules all live inside the college freeze:
   *  `answerFork(…, 'college')` releases her entries, `resumeFromCollege` refuses on an open reveal,
   *  and `tickWeek` step 2 is gated on `inCollege`. Week 156 is 32 weeks short of the fork, so
   *  `world.fork` and `world.college` are both null here – asserted in `walkFrozenCareer`, not
   *  assumed. `rngMain` is untouched for the twelfth wave running: nothing this wave added draws on
   *  any stream, so the frozen MAIN capture in tests/condition.test.ts (count 41550, hash e6b0c709)
   *  is not re-pinned, and it was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 – the student championship, schema v56), and
   *  again by EXACTLY ONE KEY. `PRE_V56` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 55 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with MY OWN COMMIT REVERTED** in a detached
   *  worktree (`git revert --no-commit`) – never the previous commit and never a worktree at HEAD.
   *  All three arms, headers checked against the filenames: **one line of 66 differs, and it is
   *  `schemaVersion`.**
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The championship fires on `COLLEGE_LEAGUE.seasonWeek` behind
   *  `inCollege`, and the earned call-up reads `lastLeagueRun`, a field that only exists inside
   *  `world.college`. Week 156 is 32 weeks short of the fork, so both are null here – asserted in
   *  `walkFrozenCareer`, not assumed. `rngMain` is untouched for the thirteenth wave running: the
   *  new draws are on `seed:collegeleague:<week>` and `seed:collegematch:<week>:<r>`, and the
   *  call-up's own four pulls on `seed:callup:<week>` are byte-identical – only the threshold the
   *  first is compared against moved. The frozen MAIN capture (41550 / e6b0c709) is not re-pinned
   *  and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 – the college birthday, schema v57), and
   *  again by EXACTLY ONE KEY. `PRE_V57` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 56 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave was UNCOMMITTED and its
   *  agent the only one running, so "this branch with my own change reverted" IS a detached worktree
   *  at `1356712` – the shared tree held nothing but this wave on top of that commit. Verified both
   *  ways rather than assumed (the 17.08 null-arm hazard): `grep -c pendingYearStart` returns 0 in
   *  the A tree's engine and 6/2 (world.ts / protocol.ts) in B's, so the A arm lacks the change and
   *  the B arm contains its reader. All three arms (preset/policy 5/0, 8/0, 0/1), headers checked
   *  against the invocations: **one line of 66 differs, and it is `schemaVersion`**
   *  (7688b6ef5255 -> c837649cce43).
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. v57's field (`college.pendingYearStart`, the opening of a year
   *  paused on her birthday) lives on a college state that is null in all three careers – week 156
   *  is 32 weeks short of the fork, asserted in `walkFrozenCareer` – and `pendingBirthday`'s opened
   *  guard changes behaviour only when `world.college` exists or the latch is the resumable college
   *  one, neither of which a frozen career ever has. ⚠⚠ THE TOUR BIRTHDAY PATH IS BYTE-IDENTICAL:
   *  each of these careers holds three tour birthdays inside its 156 weeks, and every key that could
   *  see one – `birthdays`, `events`, `rngMain` – hashed identically on both arms. `rngMain` unmoved
   *  for the fourteenth wave running: a guard is not a draw, and the gift never was one
   *  (`seed:birthday:<age>`, never MAIN). The frozen MAIN capture (41550 / e6b0c709) is not
   *  re-pinned and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 #5 – the fork moves off her birthday, schema
   *  v58), and again by EXACTLY ONE KEY. `PRE_V58` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 57 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave was UNCOMMITTED and its
   *  agent the only one running, so "this branch with my own change reverted" IS a detached worktree
   *  at HEAD (`8b057bc`, a docs-only review commit on top of `7c64ea6` – five plan files, zero
   *  engine lines). All three arms (preset/policy 5/0, 8/0, 0/1), headers checked against the
   *  invocations: **one line of 66 differs, and it is `schemaVersion`** (c837649cce43 ->
   *  6208ef0f7750), on all three.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The redesign's whole machinery sits past these careers' horizon:
   *  the ask now fires at `schoolEndWeek(6)` = week 242 – measured, 86 weeks past the 156-week
   *  freeze (under the old birthday clock it was ≈283) – so `world.fork` is still null here
   *  (asserted in `walkFrozenCareer`, not assumed), no reservation exists, `fork.departsWeek` is
   *  never written, and `resolveCollegeDeparture` returns at its first guard on every one of the 156
   *  resolved weeks. `rngMain` is unmoved for the fifteenth wave running, and it is the load-bearing
   *  half: the ask is a week comparison, the reservation is state, and the departure draws nothing –
   *  the offer's own draws live on `seed:collegeoffer:<week>` and are not reached at all here. The
   *  frozen MAIN capture (41550 / e6b0c709) is not re-pinned and was re-run green beside this
   *  re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, the travelling team step 1 – the masseur, schema
   *  v59), and for the first time the one line is a NEW KEY rather than a moved one: `masseurHired`
   *  appears (hash fcbcf165908d = `false`) beside the `schemaVersion` bump. `PRE_V59` below is the
   *  proof rather than the claim: rolling the schema back to 58 AND dropping that one key – which
   *  is what "this save at v58" literally means, the key did not exist – reproduces the previous
   *  three hashes byte for byte, for all three careers.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave sat alone on
   *  `wave/staff-masseur` in its own worktree, so the control is a detached worktree at the branch
   *  base `2a398f0` – which IS this branch with the wave's one commit reverted. Verified both ways
   *  rather than assumed (the 17.08 null-arm hazard): `grep -c masseur` returns 0 in the A tree's
   *  engine and the B tree carries both the field and its readers. All three arms (preset/policy
   *  5/0, 8/0, 0/1), headers checked against the invocations: **`schemaVersion` moved
   *  (6208ef0f7750 -> 3e1e967e9b79) and `masseurHired` appeared, and NOTHING ELSE** – `rngMain`,
   *  `results`, `season`, `events`, `entries`, `fundsCents`, `condition`, `injury`,
   *  `injuryHistory`, `careerTotals`, `skills` – every other key byte-identical on all three.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The hire is pro-career gated (`activeLadderOf === 'wta'`) and
   *  no bench policy ever hires him, so `masseurHired` is false here – asserted in
   *  `walkFrozenCareer`, not assumed – and every effect (the salary, the +1 condition, the rehab
   *  cadence) sits behind `masseurWorksThisWeek`, which is false without a hire. `rngMain` is
   *  unmoved for the sixteenth wave running, and it is the load-bearing half: the hire is a
   *  boolean, the salary is a flat subtraction, and the rehab cadence is arithmetic off
   *  (week − sinceWeek) – ZERO draws on any stream by design. The frozen MAIN capture
   *  (41550 / e6b0c709) is not re-pinned and was re-run green beside this re-freeze. */
  /** ⚠ MOVED AGAIN BY STEP 2 OF THE SAME WAVE (22.08 – the dial and the seat, still schema v59:
   *  the version shipped to no player and was extended in place). TWO new keys this time, both
   *  inert by their written defaults: `masseurSessionsPerWeek` appears (hash 4b227777d4dd = `4`,
   *  the middle rung) and `masseurTravels` appears (fcbcf165908d = `false`). `PRE_V59` below still
   *  holds the v58-era constants, and the rollback identity now drops all THREE masseur keys –
   *  which is what "this save at v58" literally means.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = a detached worktree at `c976786` (this branch with
   *  step 2's work reverted – step 1's own commits stay in both arms, so the diff isolates step 2).
   *  Null-arm checked both ways (the 17.08 hazard): `grep -c masseurSessionsPerWeek` = 0 in the A
   *  tree's src, and the B tree carries the field plus its readers in six files. All three arms
   *  (preset/policy 5/0, 8/0, 0/1), headers checked against the invocations – and the check earned
   *  its keep: the first run's three arms all came back `# preset 0 policy 1` (a zsh word-split
   *  swallowed the flags) and was thrown away. The honest re-run: **`masseurSessionsPerWeek` and
   *  `masseurTravels` appeared, and NOTHING else moved** – `rngMain`, `schemaVersion` (59 both
   *  sides), `results`, `season`, `events`, `entries`, `fundsCents`, `condition`, `injury`,
   *  `injuryHistory`, `careerTotals`, `skills` – every other key byte-identical on all three arms.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION, twice over: no bench policy hires him (asserted in
   *  `walkFrozenCareer`), and step 2's every effect needs the hire AND a stance – the rung bill
   *  and cadence read `masseurWorksThisWeek` (false without a hire), the fare and the tour relief
   *  read `masseurTravels` (asserted false). `rngMain` is unmoved for the seventeenth wave
   *  running: the dial and the stance are plain state, the fare is a subtraction in the play arm,
   *  and the tour relief is post-strain arithmetic – ZERO draws on any stream. The frozen MAIN
   *  capture (41550 / e6b0c709) is not re-pinned and was re-run green beside this re-freeze. */
  middleGrinder: '2e45cbb90ff4be9e168f66909792b4aaf8fba13fe9f178a7987d35ef7a85198e',
  /** PRESETS[8] · 120k wealthy family, elite coach · grinder policy (never travels) */
  eliteGrinder: '748108f4e7a85ea47509da7778d9e3c5d31779bdc1231a9d1b8d246f9d010897',
  /** PRESETS[0] · 8k working family, SELF-COACHED · player policy (switch on, nobody to send)
   *
   *  ⭐⭐ RE-FROZEN A FIFTH TIME (16.08) – AND ALONE, WHICH IS THE FINDING. The owner's correction of
   *  that afternoon made the Junior Accelerator a reserved place instead of a ceiling, so a junior
   *  enters a W rung on its own acceptance cut. The two GRINDER careers above did not move a bit; only
   *  the player arm did.
   *
   *  ⚠ AND THE PER-KEY DIFF SAYS SHE DID NOT ENTER ONE DIFFERENT EVENT (`tools/frozen-key-diff.ts`,
   *  the protocol this file demands, run against 3fc17ab). UNMOVED: `entries`, `seasonEntries`,
   *  `internationalEntryWeeks`, `proEntryWeeks`, `season`, `skills`, `potential`, `plan` – and
   *  `rngMain`, for the fifth wave running. MOVED: `results`, `kidRankWta`, `bestFinishByTier`,
   *  `events`, `fundsCents`, `careerTotals`, `trophiesByTier`, `academy`, `milestones`, `offers`.
   *
   *  So the change reached her through the COHORT and not through her own calendar: `proDoors` is
   *  "the kid's rule, line for line" by design, so the AI on-ramp reads the same corrected door, the
   *  fields she met are different fields, and her results moved with them. A career that never
   *  reached W35 in the first place could not have been freed by the correction, and was not.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF: an access rule is a post-draw gate, so the frozen
   *  MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
   *
   *  ⭐⭐ RE-FROZEN A SIXTH TIME (16.08) – AND ALONE AGAIN, WHICH IS THE SAME FINDING TWICE. The two
   *  grinder careers above are byte-identical across the acceptance-inversion fix; only this one
   *  moved, and the per-key block above has the receipt: ONE J60 became ONE J300 on the same week,
   *  and her ITF rank at 16.6 went #46 -> #21 on it.
   *
   *  ⭐⭐ RE-FROZEN A SEVENTH TIME (17.08, round 21 #4 – `TierDef.acceptsFromRank`), AND THIS TIME ALL
   *  THREE MOVED AND ALL THREE MOVED ON ONE KEY. `tools/frozen-key-diff.ts` was run on both trees –
   *  the protocol this file demands, `0d35f3d` against `6f64b01`, all three presets – and the diff is
   *  **one line of sixty-three, in every career: `events`.**
   *
   *  ⚠ UNMOVED, AND THIS IS THE LIST THAT MATTERS: `results`, `entries`, `seasonEntries`, `skills`,
   *  `potential`, `kidRankWta`, `bestFinishByTier`, `fundsCents`, `careerTotals`, `trophiesByTier`,
   *  `season`, `plan`, `offers`, `milestones` – and `rngMain`, for the seventh wave running.
   *  **NOT ONE OF THESE THREE CAREERS PLAYED A DIFFERENT MATCH.**
   *
   *  ⭐ WHY, AND IT IS CHECKED RATHER THAN ASSUMED: the freeze is 156 weeks, which ends at age 16.6,
   *  and `tools/ladder-baseline.ts` §3 measures **0.0 WTA 250 entries a year before age 17**. The
   *  rung this wave changed is one none of them has reached. What moved is the WORLD'S NEWS about it:
   *  the canonical `seed:aitour:` bracket of every WTA 250 now draws a different field, so a different
   *  professional wins it, so the feed item announcing her is a different item. Her career is
   *  untouched; the tour she reads about is not.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF. `selectEntrants` spends its draws on the
   *  event-scoped `seed:aitour:` / `seed:kidtour:` sub-streams and never on MAIN, so the frozen MAIN
   *  capture in tests/condition.test.ts is untouched BY CONSTRUCTION – count 41550, hash e6b0c709 –
   *  and it is verified below rather than promised. */
  /** ⭐⭐ RE-FROZEN AN EIGHTH TIME (17.08, round 21 #2b – docs/specs/the-wild-cards-2026-08.md), AND
   *  ONLY THIS ONE OF THE THREE. The two grinder hashes above are untouched, which is this file's
   *  own signature for "a change that reached one career of three" and is the whole reason it holds
   *  three careers instead of one.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands (`tools/frozen-key-diff.ts`, preset
   *  0 policy 1 – which IS this career). What moved: `results`, `events`, `entries`, `seasonEntries`,
   *  `seasonHistory`, `kidRank*`, `skills`, `condition`, `fundsCents`, `academy`, `knockHistory`,
   *  `injuryHistory`, `trophiesByTier`, `bestFinishByTier`. So unlike the last three re-freezes this
   *  one is NOT a schema field – **this career really did play a different season**, and the two
   *  rollback identities below move with it rather than reproducing the old values.
   *
   *  ⚠⚠ AND THE ATTRIBUTION WAS TAKEN RATHER THAN ASSUMED, because another agent was committing into
   *  this branch throughout. The A arm was built as **5737c40 with the engine commit fd66d52 reverted**
   *  – i.e. the wild card removed and everything else, that agent's college work included, held
   *  identical – and it reproduces **all three shipped constants byte for byte**, at all three schema
   *  versions. So 100% of this movement is the wild cards and none of it is theirs. Naming the arms as
   *  "before and after HEAD" would have credited this file with somebody else's change; measured that
   *  way first, it did.
   *
   *  ⭐ WHY THIS CAREER AND NOT THE OTHER TWO, and it is the shape of the mechanic rather than luck.
   *  The eight held places change who is in a **Slam** draw. A Slam draw is almost entirely derived
   *  professionals, and `runAiTournament` writes NO ledger row for a field pro – so a changed Slam
   *  usually changes nothing that any table can read. It bites only when a LIVE cohort player is in
   *  the draw, and then the merged W standings move, and then the fields of her own shadow draws move.
   *  That reached the player-policy career and not the two grinders.
   *
   *  ⚠ `rngMain` UNMOVED, for the eighth wave running, and it is again the load-bearing half. The
   *  wild-card pass draws on `seed:wildcard:<eventId>` and the host nation on `seed:host:<eventId>` –
   *  purpose-scoped sub-streams, re-derived at the call site, persisting nothing. The frozen MAIN
   *  capture in tests/condition.test.ts is untouched BY CONSTRUCTION – count 41550, hash e6b0c709 –
   *  and it is verified below rather than promised. */
  /** ⭐⭐ RE-FROZEN A NINTH TIME (17.08 – `wta500.acceptsFromRank = 50`, the owner's «давай 50»), AND
   *  IT IS THE SEVENTH RE-FREEZE'S FINDING REPEATING EXACTLY: all three moved, all three on ONE KEY,
   *  and the key is `events`.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands (`tools/frozen-key-diff.ts`, all
   *  three presets). ⚠ AND THE CONTROL IS THIS CHANGE REVERTED, NOT THE PREVIOUS COMMIT – CLAUDE.md's
   *  shared-checkout rule – so the A arm is this very tree with the single `acceptsFromRank: 50` line
   *  removed and everything else, the second-seat work included, held identical.
   *
   *  **MOVED: `events`. UNMOVED, 62 keys of 63:** `results`, `entries`, `seasonEntries`, `season`,
   *  `skills`, `potential`, `kidRankWta`, `bestFinishByTier`, `fundsCents`, `careerTotals`,
   *  `trophiesByTier`, `plan`, `offers`, `milestones` – and `rngMain`, for the ninth wave running.
   *  **NOT ONE OF THESE THREE CAREERS PLAYED A DIFFERENT MATCH.**
   *
   *  ⭐ WHY, and it is the same argument as the seventh with one rung's name changed: the freeze ends
   *  at age 16.6 and none of these careers has ever entered a WTA 500 – `acceptsRank` is 120 and only
   *  6 of 54 measured careers ever clear it, let alone by sixteen. What moved is the WORLD'S NEWS: the
   *  canonical `seed:aitour:` bracket of every WTA 500 now draws from #50-120 instead of from the top
   *  of its band, so a different professional wins it, so the feed item announcing her is a different
   *  item. Their careers are untouched; the tour they read about is not.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF, again by construction rather than by luck:
   *  `selectEntrants` spends its draws on the event-scoped `seed:aitour:` / `seed:kidtour:`
   *  sub-streams and never on MAIN, so the frozen MAIN capture in tests/condition.test.ts is untouched
   *  – count 41550, hash e6b0c709 – and it is verified below rather than promised.
   *
   *  ⚠ AND ALL THREE MOVED THIS TIME, WHICH IS ITSELF THE SIGNAL. A change to a rung nobody has
   *  reached should reach all three careers equally through the feed, and it did – unlike the fifth,
   *  sixth and eighth re-freezes, which moved this career alone because they changed what SHE could
   *  enter. Three of three means "the world", one of three means "her". */
  /** ⭐⭐ RE-FROZEN A TENTH TIME (18.08 – the DATE CLOCK), AND THIS ONE IS NOTHING LIKE THE NINE BEFORE
   *  IT. Every previous re-freeze moved ONE key of sixty-three and the careers were byte-identical
   *  underneath; this one moves TWENTY-SEVEN, `results`, `skills`, `condition`, `fundsCents`,
   *  `kidRank` and `trophiesByTier` among them. **These three careers really did play different
   *  seasons**, and that is the change working rather than leaking.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with the control built as THIS tree
   *  with the clock reverted (`git stash` of age.ts / dates.ts / endings.ts / migrations.ts) rather
   *  than as an older commit - CLAUDE.md's shared-checkout rule.
   *
   *  ⚠ UNMOVED, AND THE LIST IS THE ARGUMENT: `rngMain` (tenth wave running), `season`, `profile`,
   *  `potential`. Same world, same calendar, same dice, same ceiling - so nothing about the SIMULATION
   *  moved. What moved is which weeks her age gates opened on: `kidAgeExact` now turns on her birth
   *  DATE instead of the first Monday of her birth month, and measured across all 365 dates that is
   *  1-5 weeks LATER at every gate, never earlier. Different weeks eligible -> different events
   *  entered -> different results, money and development.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF, and here it is doing more work than usual: a
   *  change that moves `results` COULD have moved the stream, and did not, because the age clock is a
   *  post-draw gate exactly like the acceptance rules before it. The frozen MAIN capture in
   *  tests/condition.test.ts is untouched - count 41550, hash e6b0c709 - and verified below. */
  /** ⭐⭐ RE-FROZEN AN ELEVENTH TIME (18.08 – `power()` over EVERY skill), AND THE NEW KEY IN THE DIFF
   *  NAMES THE CAUSE: **`cohort`**. Ten previous re-freezes never moved it; this one does, because
   *  `power()` is what `driftCohort`'s conveyor SORTS BY, and widening it from four attributes to five
   *  re-ranks all 199 rivals. Everything downstream - who she meets, what she wins - follows from that.
   *
   *  ⚠ PER-KEY DIFF FIRST, control = this tree with `power()` reverted to four attributes. 25-32 keys
   *  of 63 moved per career; UNMOVED in all three: `rngMain` (eleventh wave), `season`, `profile`,
   *  `potential`. Same world, same calendar, same dice, same ceilings.
   *
   *  ⚠⚠ AND THE FIRST TWO ATTEMPTS AT THIS MEASUREMENT WERE GARBAGE, WHICH IS WHY THE HEADERS ARE NOW
   *  CHECKED. One capture ran from the wrong directory and wrote a module-not-found stack trace into
   *  the arm file; the other bound its loop variables wrongly, so a file named for preset 5 carried
   *  `# preset 0 policy 1` in its own header. Both would have re-frozen these constants off a diff of
   *  two unrelated careers. `tools/frozen-key-diff.ts` prints that header for exactly this reason -
   *  read it, and check it against the filename, before believing any diff built from it.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF and it is doing real work here: `power()` is read by
   *  the conveyor's SORT, which is a post-draw ordering, so no draw moved. The frozen MAIN capture in
   *  tests/condition.test.ts is untouched - count 41550, hash e6b0c709 - and verified below. */
  /** ⭐⭐ AND MOVED AGAIN THE SAME DAY (21.08, round 24 #1 – the tick raises the academy's letters),
   *  BY ONE KEY AND ON TWO CAREERS OF THREE. This is a CONTENT move, not a schema one, and the split
   *  is the evidence: `eliteGrinder` is byte-identical here and in all four `PRE_*` sets below,
   *  because the 120k family never qualifies for a scholarship and so never receives a letter. The
   *  two that moved are the ones that do – measured, not inferred: `middleGrinder` (middle
   *  background) carries academy level 0.354 and three letters, `selfTravelling` (working background)
   *  carries 0.721 and three. The need factor is visible in which hashes moved.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own commit reverted** in a detached
   *  worktree – not the previous commit, which carried two other agents' waves. All three arms
   *  (preset/policy 5/0, 8/0, 0/1), headers checked against the filenames: **exactly one key of 66
   *  differs and it is `offers`.** `rngMain`, `results`, `season`, `cohort`, `events`, `fundsCents`,
   *  `kidRank`, `skills` – every one byte-identical, on every arm.
   *
   *  ⚠⚠ SO THE `PRE_*` SETS ARE RE-TAKEN AGAINST THE NEW WORLD, on this file's own recorded
   *  precedent for a career-content wave (see the v52 block: *"this wave changed the CAREER, not a
   *  schema field, so PRE_V52/PRE_V51/PRE_V50 are re-taken against the new world"*). Rolling
   *  `schemaVersion` back on the OLD worlds cannot reproduce the new ones – a data key moved, not a
   *  version number – but the rollback IDENTITY keeps its meaning unchanged: swapping only
   *  `schemaVersion` on the new world still reproduces exactly these, which is all those lines ever
   *  claimed.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF: raising a letter is arithmetic and one
   *  idempotent push, and the frozen MAIN capture is untouched – count 41550, hash e6b0c709. */
  /** ⚠ MOVED WITH `middleGrinder` AND WITHOUT `eliteGrinder` (21.08, round 24 #1). See the paragraph
   *  above: one key of 66 – `offers` – and this career is the one on the largest scholarship of the
   *  three. `PRE_V55` reproduces this exact value by rolling only `schemaVersion` back to 54. */
  /** ⚠ MOVED WITH BOTH TWINS (22.08, the college birthday, v57) by the version number alone – see
   *  the paragraph on `middleGrinder`, and `PRE_V57` below for the identity. */
  /** ⚠ MOVED WITH ITS TWINS a fourth time (22.08, round 24 #5, schema v58) – see the paragraph on
   *  `middleGrinder`, and `PRE_V58` below for the identity. */
  /** ⭐⭐ RE-FROZEN – ALONE OF THE THREE – FOR THE 22.08 RULINGS WAVE (recovery variant C, the
   *  dial's +1/+2/+3, per-match tour pricing, the return-week session, the team's prize shares),
   *  and the SPLIT IS THE ATTRIBUTION: the two grinder hashes are byte-identical across the whole
   *  wave, because week 156 ends at age 16.6 and neither grinder career has a counting W-series
   *  result – so `activeLadderOf` never says 'wta' for them and every one of the five changes is
   *  gated behind that door, a hire (none exists), or a wta cheque (none is won). This career –
   *  the 8k player-policy one – IS on the professional ladder inside the freeze, and variant C's
   *  base-5 pro weeks really did change the seasons it played.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file demands: `tools/frozen-key-diff.ts` on both trees,
   *  control = a detached worktree at `53146b7` (this branch with every commit of the wave
   *  reverted – the agent was alone on the branch, so the branch base IS "my own change
   *  reverted"). Null-arm checked both ways (the 17.08 hazard): `grep -rl proPhaseRecoveryBase|
   *  staffPrizeShareCents|masseurTourWeekCents|masseurReturnDue` = 0 files in A's src, and B
   *  carries each constant plus its readers. All three arms, headers checked against the
   *  invocations – ⚠ and the check caught a THIRD zsh word-split (a `set -- $arm` loop fed every
   *  run `preset 0 policy 1`); those captures were thrown away and re-taken with explicit flags.
   *
   *  THE VERDICT: grinder arms **0 keys of 69 moved**. Player arm **25 value keys moved** –
   *  `condition`, `results`, `events`, `fundsCents`, `skills`, `kidRankWta`, `seasonHistory`,
   *  `careerTotals`, `trophiesByTier`, `bestFinishByTier`, `knock`, `academy`, `offers`,
   *  `milestones`, `financeWeeks`, `internationalEntryWeeks`, `proEntryWeeks`,
   *  `medicalWithdrawalWeek`, `lastSeasonSummary`, `nextEventId`, `prevKidRank`, `prevKidRankWta`,
   *  `seasonRecord`, `seasonStartRank`, `seasonWins` – a career that genuinely played different
   *  professional weeks on base 5. UNMOVED, and the list is the argument: **`rngMain`**
   *  (seventeenth wave running – nothing here draws), **`schemaVersion`** (59 both sides – the
   *  share mechanic persists NOTHING, verified rather than promised), `entries`, `seasonEntries`,
   *  `season`, `cohort`, `profile`, `potential`, `injury`, `injuryHistory`, `kidFundsCents`
   *  (under 18 at week 156), `coachId` (null – so ZERO share rows on this arm by the self-coached
   *  rule), and all three masseur keys on their defaults. Same calendar, same entries, same dice –
   *  what changed is how tired a professional week leaves her, which is exactly the ruling.
   *
   *  ⚠ THE `PRE_*` selfTravelling IDENTITIES ARE RE-TAKEN against the new world (the file's own
   *  precedent for a career-content wave – the v50/wild-cards paragraph): a data wave cannot be
   *  rolled back by a version number, but swapping ONLY `schemaVersion` on the new world still
   *  reproduces each, which is all those lines ever claimed. The frozen MAIN capture
   *  (41550 / e6b0c709) is untouched and was re-run green beside this re-freeze. */
  selfTravelling: '2c87f829d75a63674900e88dad48ffe797e5c8a20d9b43e55c2f917b7a2ce2c1',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v56 – the identity that proves the v57 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  college birthday pauses `resumeFromCollege` on her birthday week and persists the paused year's
 *  opening (`college.pendingYearStart`) – all of it behind a college state that is null in every
 *  frozen career, and behind a latch none of them ever wears. Week 156 is 32 weeks short of the
 *  fork, which `walkFrozenCareer` asserts rather than assumes. The THREE TOUR BIRTHDAYS inside each
 *  of these careers are the sharper half of the claim: `pendingBirthday`, `chooseGift` and
 *  `markBirthday` were all touched this wave, and `birthdays`, `events` and `rngMain` hashed
 *  byte-identical on both arms anyway – the change is confined to the freeze path, measured rather
 *  than promised.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = this tree's own wave absent (a detached worktree at
 *  `1356712`; the wave was uncommitted and its agent alone, so that IS "my own change reverted" –
 *  and it was verified to lack the change while the B arm was verified to contain its reader).
 *  Headers checked against the invocations on every arm (5/0, 8/0, 0/1).
 *
 *  ⚠ `rngMain` UNMOVED for the fourteenth wave running, and it is the load-bearing half: the pause
 *  is a break in a loop, the guard is a read, and the gift's offer lives on `seed:birthday:<age>` –
 *  none of it is a draw. The frozen MAIN capture is untouched: count 41550, hash e6b0c709. */
const PRE_V57 = {
  middleGrinder: '94b9f1cef8eb5f74c573b909cd1a19c4bbe6888aed6c7070bedbb4371db4bcef',
  eliteGrinder: '52a3e09c48882dc43dc78644eb4b288b3c48f1f9b59e0f3add6d3db611fbc4e2',
  selfTravelling: 'fcb7ca425632583aad2efa58ffb012c10d1e5751dd9a873aba9357aad852a8e0',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v57 – the identity that proves the v58 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE MOVED TOGETHER, which is the signature of a schema bump rather than a career change.
 *  Round 24 #5 moved the fork's ask to `schoolEndWeek` (week 242 for these birth-month-6 careers,
 *  86 weeks past this freeze's horizon; the old birthday ask was ≈283) and made the college answer
 *  a reservation executed at the September departure – all of it unreachable in 156 weeks, which
 *  `walkFrozenCareer`'s own `world.fork` null assertion checks rather than assumes.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own change reverted** in a detached
 *  worktree – the wave was uncommitted and its agent alone, so the worktree at HEAD (`8b057bc`,
 *  docs-only on top of `7c64ea6`) IS that control. Headers checked against the invocations on every
 *  arm (5/0, 8/0, 0/1): one line of 66 differs, `schemaVersion`, on all three.
 *
 *  ⚠ `rngMain` UNMOVED for the fifteenth wave running, and it is the load-bearing half: `forkDue`
 *  became a week comparison, the reservation is pure state, and `resolveCollegeDeparture` draws
 *  nothing on any stream. The frozen MAIN capture is untouched: count 41550, hash e6b0c709. */
const PRE_V58 = {
  middleGrinder: '2137a9e5e2a69ca0af681e051b3c224dcb2179bc41c2f2c9f6eb4215b82064e2',
  eliteGrinder: '87b7f5860fb28f3147a416a275fd49fd8e8d684319fee18372df554c91a9cc1d',
  selfTravelling: '13cf9b6d871d21365a3ae410997ae0eb9196a5da872699e1c5f5a87955660c7d',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v58 – the identity that proves the v59 re-freeze
 *  (the masseur, travelling team step 1) moved the schema number, ADDED one inert key, and touched
 *  nothing else. These are the v58-era `FROZEN` values verbatim; `careerHashAtSchema(…, 58)` drops
 *  the key v59 added before hashing, because a v58 serialisation never held it. */
const PRE_V59 = {
  middleGrinder: '3c1876b343be327f440f61f40a4f845e31274e74e729c3ad79807ca54d05e24c',
  eliteGrinder: '1ab7aae6fc3b6a5df9e778e878c6dffff91b099f2c19f00d8bcf3bed8f45927f',
  selfTravelling: '4f3d56881fdc538a6b326c9185de9fe1e3089ce2e077ae445055bd3cfd606e2d',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v55 – the identity that proves the v56 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  student championship (`engine/collegeLeague.ts`) fires only on `COLLEGE_LEAGUE.seasonWeek` INSIDE
 *  the college freeze, and the earned call-up reads a field that only exists inside it; week 156 is
 *  32 weeks short of the fork, which `walkFrozenCareer` asserts rather than assumes. So what the wave
 *  did to these three careers is the version number and nothing else.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own commit reverted** in a detached
 *  worktree – never the previous commit and never a worktree at HEAD. Headers checked against the
 *  filenames on every arm (5/0, 8/0, 0/1).
 *
 *  ⚠ `rngMain` UNMOVED for the twelfth wave running, and it is the load-bearing half: the
 *  championship draws on `seed:collegeleague:<week>` and `seed:collegematch:<week>:<r>`, both
 *  re-derived at the call site, and the call-up's own four draws on `seed:callup:<week>` are
 *  byte-identical – only the threshold the first one is compared against moved. The frozen MAIN
 *  capture is untouched: count 41550, hash e6b0c709. */
const PRE_V56 = {
  middleGrinder: '5adaba3d2f9200f45d75189cd50bc8dac5da6f67e1e62d1fe3ffd4a3b93dc8f4',
  eliteGrinder: '5b966447a2d321ce81c0239568aec6d48400518871fa5b8b36781ba5b749cd9b',
  selfTravelling: '00420f786008bace3fd37fc16ba01cc727094000281bc4995d1eb0d8cf67f70c',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v54 – the identity that proves the v55 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  three rules are entirely inside the college freeze and week 156 is 32 weeks short of the fork, so
 *  what the wave did to these careers is the version number and nothing else. The per-key diff –
 *  control built as this branch with the wave's own commit reverted, never the previous commit –
 *  named `schemaVersion` and no other key, on all three. */
const PRE_V55 = {
  middleGrinder: '9fbeef43715151638d343637f513019421f8eaa8bb9c2430d221abdaca73466e',
  eliteGrinder: '19a26b42147619412944d74e3ddffe37290d3387b66629267f377ede31e0e301',
  selfTravelling: 'e91be33c67f4dfebd6670bf9748e394addd62b5244452f17c555c86056762a5b',
}

/** ⭐⭐ RE-FROZEN A SEVENTH TIME (16.08, v51 – docs/specs/what-the-college-place-costs-2026-08.md) AND
 *  ALL THREE MOVED, WHICH IS THE OPPOSITE OF ALARMING – it is the signature of a change that reached
 *  no career at all.
 *
 *  Every previous re-freeze moved ONE career of three and the per-key diff said which and why. This
 *  one moved all three by exactly one key, and `PRE_V51` below is the proof: rolling `schemaVersion`
 *  back to 50 on the NEW world reproduces the OLD hashes byte for byte, for all three. Nothing else
 *  in these worlds is different.
 *
 *  ⚠ AND THAT IS BY CONSTRUCTION RATHER THAN BY LUCK. v51 adds `ForkState.offer` and a weekly tuition
 *  debit. Week 156 is 32 weeks short of the fork, so `world.fork` is still null here and there is no
 *  offer to measure; `resolveCollegeBill` returns at its first line because `inCollege` is false. Both
 *  facts are asserted in `walkFrozenCareer` so a future wave that made either reachable goes red with
 *  a reason instead of just a different hash. `rngMain` is untouched for the sixth wave running: the
 *  offer draws on a `seed:collegeoffer:<week>` sub-stream and the bill draws nothing at all, so the
 *  frozen MAIN capture (41550 / e6b0c709) is not re-pinned. */
/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v51 – the identity that proves the v52 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ AND ALL THREE HELD THIS TIME, which is worth stating because the previous two re-freezes could
 *  not say it: v52 replaces the SHAPE of `ForkState.offer` (a funding share becomes a place with a
 *  price) and adds a match-play term to `growWeek` that only fires inside the college freeze. Neither
 *  is reachable at week 156 – the fork is 32 weeks away and `world.college` is null – and
 *  `walkFrozenCareer` asserts both rather than assuming them. So the whole of what the college choice
 *  did to these three careers is the version number, and this block is the proof rather than the
 *  claim. `rngMain` is untouched for the seventh wave running: the offer draws on a
 *  `seed:collegeoffer:<week>` sub-stream (three draws now instead of one, still not MAIN) and the
 *  match term draws nothing at all, so the frozen MAIN capture (41550 / e6b0c709) is not re-pinned. */
/** ⚠ ALL THREE RE-ANCHORED WITH THE FREEZE (18.08, the rename), NOT BROKEN – the file's own
 *  precedent language for a wave that changes the CAREER rather than a schema field. The rename
 *  changed `events` on all three, so rolling `schemaVersion` back on the OLD worlds cannot reproduce
 *  the new ones; these are re-taken by swapping only `schemaVersion` on the new world, which is
 *  exactly the property the three PRE_ blocks assert. They go on doing their job: a later wave that
 *  moves one of these careers through anything but `SAVE_SCHEMA_VERSION` still goes red here beside
 *  a red freeze, and the pair is what says which kind of change it was. */
const PRE_V52 = {
  middleGrinder: '957a343dee1e3c9c8135b821cc223aa72779e2f2687cc00d7d55f369b7f7c399',
  eliteGrinder: '3d78611cd6cb3185044aeab113809a363b1b8ed2bea06538483d8498aa8ee0d7',
  selfTravelling: 'a0e29c36acb0452d1b4c6800bfb18bbdcd7f8c1079be75f0708a6e0b731e8505',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v50 – the identity that proves the v51 re-freeze
 *  moved ONE key and nothing else. */
const PRE_V51 = {
  middleGrinder: '1a27b99d593239e354deb1bf9b1e4822682e01caabc1da724838e401cb136bf0',
  eliteGrinder: 'f1082e29809c242438ac1163fe904f77b4bfb80b8ed08b6b56b90f5297cc7988',
  /** ⚠ MOVED WITH THE FREEZE ABOVE (17.08, round 21 #2b) AND THAT IS THE HONEST OUTCOME, not a
   *  weakening. The v51 case asks "does rolling ONLY the schema back reproduce the v50 hashes" – and
   *  for the two grinders it still does, untouched. For THIS career it no longer can, because the
   *  wild cards changed the career itself and not a schema field: rolling the version back on a
   *  different season cannot produce the old season. The identity is re-anchored to the new world, so
   *  it goes on doing its job – if a LATER wave moves this career through anything but
   *  `SAVE_SCHEMA_VERSION`, this line goes red beside the freeze exactly as it just did. */
  selfTravelling: 'bb14cdecda0a13668df1bb7bb5024406a9ed21a02161eb1a53698a48bbecbd14',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v49, kept so the re-freeze above can PROVE its own
 *  claim rather than assert it. See the paragraph on `FROZEN`. */
const PRE_V50 = {
  /** ⚠ MOVED WITH ITS TWINS A THIRD TIME (17.08, round 21 #4). These two grinder hashes had held
   *  across every previous wave, and they moved here for the reason the block on `FROZEN` records in
   *  full: the WTA 250's field changed, so the tour NEWS in `events` changed, and `events` is inside
   *  the hash. The rollback identity itself is untouched in meaning – swapping only `schemaVersion`
   *  on the new world still reproduces exactly this, which is what these three lines are for. */
  middleGrinder: 'a664e84b1ac5c94975e1b64be814f22f3cf2e44e2a8815be764f5f6a997865a4',
  eliteGrinder: 'b7a622eb775f9964bf9bc84074d86635c3004d81f4071293e87f1945a5f2491a',
  /** ⚠ MOVED WITH ITS TWIN ABOVE, AND THE PARAGRAPH ON `FROZEN` PREDICTED EXACTLY THIS: *"if a later
   *  wave moves one of these careers for a real reason, the rollback case goes red beside the freeze
   *  and says which kind of change it was."* It did, on 16.08, and it said so – both hashes red, and
   *  the per-key diff showing a career that really is different rather than a schema field that is.
   *  The identity below still does its own job: rolling `schemaVersion` back to 49 on the NEW world
   *  reproduces this, so nothing about P5's claim has been quietly lost in the re-freeze.
   *
   *  ⚠ MOVED WITH ITS TWIN A SECOND TIME (16.08, the acceptance inversions), for the same reason and
   *  with the same proof beside it. The two grinder rollback hashes above did NOT move, which is the
   *  identity doing its job: a change that reaches one career of three shows up in one pair of hashes
   *  of three, not in all six. */
  /** ⚠ MOVED WITH ITS TWIN A THIRD TIME (17.08, round 21 #2b), for the reason written on the v50
   *  line: this wave changed the CAREER, not a schema field, so the rollback is re-anchored to the
   *  new world. The two grinder hashes in this block did NOT move, which is the identity doing its
   *  job – a change that reaches one career of three shows up in one pair of hashes of three. */
  selfTravelling: 'b6edef407671d1c2a0da8cbff9c8eacdce2296315cf58980d931010495da0629',
}
const FREEZE_WEEKS = 156

function walkFrozenCareer(presetIndex: number, policyIndex: number, force?: Partial<{ coachOnEventWeeks: boolean }>) {
  const { world, rng } = openCareer(PRESETS[presetIndex], 0, POLICIES[policyIndex])
  if (force?.coachOnEventWeeks !== undefined) world.coachOnEventWeeks = force.coachOnEventWeeks
  for (let w = 0; w < FREEZE_WEEKS; w++) stepCareerWeek(world, rng, POLICIES[policyIndex])
  // ⚠ v49: none of these three careers sends the coach to a junior event, so the hashes above are
  // about the mechanic being INERT here. Checked rather than assumed - a bench policy that started
  // ticking this would move the numbers for a reason the comment above says is impossible.
  expect(world.coachOnJuniorEvents, 'the v49 stance is present and OFF in the frozen careers').toBe(false)
  // ⚠ v50: and none of them goes to COLLEGE either – the fork sits far past week 156 – so
  // everything P5 added is unreachable here by construction, not by luck.
  expect(world.college, 'the v50 freeze is not entered by any frozen career').toBeNull()
  // ⚠ v51: and the fork is never RAISED here either, so there is no college offer to measure and no
  // tuition line to charge. ⚠ ROUND 24 #5 moved the ask off her birthday (≈283 for these
  // birth-month-6 careers) to `schoolEndWeek(6)` = 242 – measured, still 86 weeks past this freeze's
  // 156-week horizon. That is why all three hashes moved by exactly `schemaVersion` and nothing else
  // (see `PRE_V51`…`PRE_V58`), and it is checked rather than assumed: a wave that moved the fork
  // under week 156 would go red HERE, with a sentence, instead of three hashes drifting for a
  // reason nobody could name.
  expect(world.fork, 'the v51 offer is unreachable in a frozen career: the fork is never raised').toBeNull()
  // ⚠ v59: and none of them ever hires the masseur – the hire is pro-career gated and no bench
  // policy takes it – so everything the travelling team's step 1 added is inert here by
  // construction, not by luck. A policy that started hiring would move the hashes for a reason
  // this line names instead of leaving three hashes drifting.
  expect(world.masseurHired, 'the v59 seat is present and EMPTY in the frozen careers').toBe(false)
  // ⚠ v59 STEP 2: the dial stands on its written default and the travel stance is OFF – checked
  // rather than assumed, because every step-2 effect (the rung bill, the rung cadence, the tour
  // relief, the fare) sits behind the hire and the stance, and a policy that started moving either
  // would move the hashes for a reason these two lines name.
  expect(world.masseurSessionsPerWeek, 'the v59 dial is present and on its default').toBe(4)
  expect(world.masseurTravels, 'the v59 travel stance is present and OFF').toBe(false)
  // ⚠ 22.08 rulings wave: the return-week mark needs a HIRE at finalize, so it can never exist
  // here – asserted, because a key that appears only sometimes is exactly what a whole-world hash
  // is worst at explaining. And no share row can exist either: a share needs a wta cheque, which
  // the grinders never win inside 156 weeks, or a coach, which the player arm does not have.
  expect('masseurReturnDue' in world, 'no return-session mark in a masseur-less career').toBe(false)
  expect(
    world.events.some((e) => e.text.includes("share of the prize money") && e.type === 'expense'),
    'no staff share row in any frozen career',
  ).toBe(false)
  return world
}

function careerHash(presetIndex: number, policyIndex: number, force?: Partial<{ coachOnEventWeeks: boolean }>): string {
  return createHash('sha256').update(JSON.stringify(walkFrozenCareer(presetIndex, policyIndex, force))).digest('hex')
}

/** The same walk, hashed with `schemaVersion` rolled back – the identity that proves the v50 re-freeze
 *  moved ONE key. Overwriting the value in place preserves `JSON.stringify`'s key order, so this is
 *  the same serialisation with one number changed and nothing else.
 *
 *  ⚠ v59: A ROLLBACK BELOW 59 ALSO DROPS THE MASSEUR'S THREE KEYS – `masseurHired`, and step 2's
 *  `masseurSessionsPerWeek` + `masseurTravels` – and that is what "this save at v58" means rather
 *  than a convenience: none of the three existed at any earlier schema, so a pre-59 serialisation
 *  containing any of them would be a shape no shipped version ever wrote. They are the LAST keys
 *  of `createWorld`'s literal (placed there for exactly this), so dropping them leaves every other
 *  key's order untouched and all seven older identities reproduce their constants byte for byte. */
function careerHashAtSchema(presetIndex: number, policyIndex: number, schemaVersion: number): string {
  const world = walkFrozenCareer(presetIndex, policyIndex)
  const { masseurHired: _seat, masseurSessionsPerWeek: _dial, masseurTravels: _stance, ...preMasseur } = world
  const shape = schemaVersion < 59 ? preMasseur : world
  return createHash('sha256').update(JSON.stringify({ ...shape, schemaVersion })).digest('hex')
}

describe('the byte-identity of a career that does not travel', () => {
  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
  })

  it('⭐⭐ v59: rolling the schema back to 58 – and dropping the keys v59 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE MASSEUR DID TO THESE THREE CAREERS, as an identity. The hire is
    // pro-career gated and no bench policy takes it, so `masseurHired` is false here (asserted in
    // `walkFrozenCareer`) and every effect sits behind `masseurWorksThisWeek`, which a false flag
    // shuts – step 2's dial and stance included: the rung bill and cadence need the hire, the fare
    // and the tour relief need the stance, and both stand on their written defaults (also asserted
    // there). If the salary, the condition bonus, the rehab cadence, the fare or the relief had
    // leaked into a career that never hired him, THIS case would be red beside the freeze – the one
    // signal a whole-world hash cannot otherwise give. Unlike every earlier rollback this drops
    // KEYS as well as a number, because v59 added three: see `careerHashAtSchema`.
    expect(careerHashAtSchema(5, 0, 58), '25k · middle coach · grinder').toBe(PRE_V59.middleGrinder)
    expect(careerHashAtSchema(8, 0, 58), '120k · elite coach · grinder').toBe(PRE_V59.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 58), '8k · self-coached · player').toBe(PRE_V59.selfTravelling)
  })

  it('⭐⭐ v58: rolling ONLY the schema back to 57 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24 #5 DID TO THESE THREE CAREERS, as an identity. The ask moved to
    // `schoolEndWeek` – week 242 for these careers, 86 weeks past this freeze's horizon (the old
    // birthday ask was ≈283) – so the fork is still never raised here (`walkFrozenCareer` asserts
    // it), no reservation is written and the departure step returns at its first guard every week.
    // If the earlier ask, the hold or the departure had leaked into an ordinary 156-week career,
    // THIS case would be red beside the freeze – the one signal a whole-world hash cannot give.
    expect(careerHashAtSchema(5, 0, 57), '25k · middle coach · grinder').toBe(PRE_V58.middleGrinder)
    expect(careerHashAtSchema(8, 0, 57), '120k · elite coach · grinder').toBe(PRE_V58.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 57), '8k · self-coached · player').toBe(PRE_V58.selfTravelling)
  })

  it('⭐⭐ v57: rolling ONLY the schema back to 56 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE COLLEGE BIRTHDAY DID TO THESE THREE CAREERS, as an identity. The pause,
    // the persisted year-opening and the opened guard all live behind a college state that is null
    // here and a latch these careers never wear – asserted in `walkFrozenCareer`, not assumed. The
    // three TOUR birthdays inside each career are the case this wave was most required not to move,
    // and if any of `pendingBirthday`'s, `chooseGift`'s or `markBirthday`'s tour behaviour had
    // shifted one byte, THIS case would be red beside the freeze – which is the one signal a
    // whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 56), '25k · middle coach · grinder').toBe(PRE_V57.middleGrinder)
    expect(careerHashAtSchema(8, 0, 56), '120k · elite coach · grinder').toBe(PRE_V57.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 56), '8k · self-coached · player').toBe(PRE_V57.selfTravelling)
  })

  it('⭐⭐ v56: rolling ONLY the schema back to 55 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24'S STUDENT CHAMPIONSHIP DID TO THESE THREE CAREERS, as an identity.
    // The fixture fires on `COLLEGE_LEAGUE.seasonWeek` inside the college freeze and the earned
    // call-up reads a field that only exists there, so neither is reachable at week 156 – asserted in
    // `walkFrozenCareer`, not assumed. If either had leaked into an ordinary career, THIS case would
    // be red beside the freeze, which is the one signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 55), '25k · middle coach · grinder').toBe(PRE_V56.middleGrinder)
    expect(careerHashAtSchema(8, 0, 55), '120k · elite coach · grinder').toBe(PRE_V56.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 55), '8k · self-coached · player').toBe(PRE_V56.selfTravelling)
  })

  it('⭐⭐ v55: rolling ONLY the schema back to 54 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24'S FREEZE FIXES DID TO THESE THREE CAREERS, as an identity. The
    // three rules – the entry release at the fork, `resumeFromCollege`'s refusal on an open reveal,
    // and `tickWeek`'s `inCollege` gate – all live inside the college freeze, and `walkFrozenCareer`
    // asserts below that neither `world.fork` nor `world.college` is reachable at week 156. If any of
    // them had leaked into an ordinary career, THIS case would be red beside the freeze, which is the
    // one signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 54), '25k · middle coach · grinder').toBe(PRE_V55.middleGrinder)
    expect(careerHashAtSchema(8, 0, 54), '120k · elite coach · grinder').toBe(PRE_V55.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 54), '8k · self-coached · player').toBe(PRE_V55.selfTravelling)
  })

  it('⭐⭐ v52: rolling ONLY the schema back to 51 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE COLLEGE CHOICE DID TO THESE THREE CAREERS, as an identity. All three
    // freeze hashes moved and all three roll back exactly, so the change is one number and not three
    // different careers. If the new `ForkState.offer` shape or the college match-play term had
    // reached any of these worlds, this case would be red beside the freeze.
    expect(careerHashAtSchema(5, 0, 51), '25k · middle coach · grinder').toBe(PRE_V52.middleGrinder)
    expect(careerHashAtSchema(8, 0, 51), '120k · elite coach · grinder').toBe(PRE_V52.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 51), '8k · self-coached · player').toBe(PRE_V52.selfTravelling)
  })

  it('⭐⭐ v51: rolling ONLY the schema back to 50 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THIS WAVE DID TO THESE THREE CAREERS, as an identity. All three freeze
    // hashes moved, which on any previous wave would have meant three different careers; here it
    // means one different number. If v51's offer or its tuition line had reached any of these worlds,
    // this case would be red beside the freeze – which is the one signal a whole-world hash cannot
    // otherwise give.
    expect(careerHashAtSchema(5, 0, 50), '25k · middle coach · grinder').toBe(PRE_V51.middleGrinder)
    expect(careerHashAtSchema(8, 0, 50), '120k · elite coach · grinder').toBe(PRE_V51.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 50), '8k · self-coached · player').toBe(PRE_V51.selfTravelling)
  })

  it('⭐⭐ P5: rolling ONLY the schema back to 49 reproduces the old hashes byte for byte', () => {
    // The per-key diff, as an identity rather than a comparison. If P5 had reached any of these
    // careers through anything but `SAVE_SCHEMA_VERSION`, this would be red – and it would be red
    // beside a green freeze, which is precisely the signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 49), '25k · middle coach · grinder').toBe(PRE_V50.middleGrinder)
    expect(careerHashAtSchema(8, 0, 49), '120k · elite coach · grinder').toBe(PRE_V50.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 49), '8k · self-coached · player').toBe(PRE_V50.selfTravelling)
  })

  it('MOVES when the same career sends him – so the three pins above are not vacuous', () => {
    // ⚠ THE MUTATION CHECK, and it is what makes this file a test rather than a photograph. The same
    // preset, the same policy, the same seed and the same 156 weeks, with only the stance flipped:
    // if the travel helping were inert the two would hash the same and the pins would be proving
    // nothing. (The fare moves with the switch too, which is the point of the switch - what is
    // isolated to the edge alone is asserted arithmetically further up this file.)
    expect(careerHash(5, 0, { coachOnEventWeeks: true })).not.toBe(FROZEN.middleGrinder)
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
