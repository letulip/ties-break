import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  buildCoachRoster,
  coachEdgePlacement,
  coachEdgePp,
  COACH_EDGE_CORRIDOR_PP,
  HIREABLE_TIERS,
} from '../src/engine/coach'
import { coachMatchEdge, kidMatchPlayerFor, COACH_EDGE_POINTS_PER_PP } from '../src/engine/world/player'
import { coachEdgeView, coachTravelsWithHer, createWorld, hireCoach } from '../src/engine/world'
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
    expect(coachEdgeView(travels)).toEqual(coachEdgeView(stays))
    expect(coachEdgePlacement(travels.seed, travels.coachId)).toBe(coachEdgePlacement(stays.seed, stays.coachId))
    // ⚠ AND THAT IS ALSO A GAP THIS SLICE DELIBERATELY DOES NOT CLOSE: `corridorPct` and the market
    // card's `edgePct` still print the rung's HOME corridor to a family that travels. The engine
    // change is invisible on screen T until the owner rules on the copy - flagged in the spec's §6
    // rather than smuggled in beside a balance change.
    expect(coachEdgeView(travels).corridorPct).toEqual(COACH_EDGE_CORRIDOR_PP.middle)
  })
})

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
const FROZEN = {
  /** PRESETS[5] · 25k middle family, middle coach · grinder policy (never travels) */
  middleGrinder: 'b31309b2c3fc1dc2011868b6f3e7690cbb317021d26c70635a0614dabf26fdb4',
  /** PRESETS[8] · 120k wealthy family, elite coach · grinder policy (never travels) */
  eliteGrinder: '80fcd7910eca5cdae7cd4c71e1f68b56099c49912d71d6905cb67953819bef0b',
  /** PRESETS[0] · 8k working family, SELF-COACHED · player policy (switch on, nobody to send) */
  selfTravelling: 'a513ebc013a735c8e3ceea1e591a98c65b9111f4fce12c36ac6d19b33243522c',
}
const FREEZE_WEEKS = 156

function careerHash(presetIndex: number, policyIndex: number, force?: Partial<{ coachOnEventWeeks: boolean }>): string {
  const { world, rng } = openCareer(PRESETS[presetIndex], 0, POLICIES[policyIndex])
  if (force?.coachOnEventWeeks !== undefined) world.coachOnEventWeeks = force.coachOnEventWeeks
  for (let w = 0; w < FREEZE_WEEKS; w++) stepCareerWeek(world, rng, POLICIES[policyIndex])
  // ⚠ v49: none of these three careers sends the coach to a junior event, so the hashes above are
  // about the mechanic being INERT here. Checked rather than assumed - a bench policy that started
  // ticking this would move the numbers for a reason the comment above says is impossible.
  expect(world.coachOnJuniorEvents, 'the v49 stance is present and OFF in the frozen careers').toBe(false)
  return createHash('sha256').update(JSON.stringify(world)).digest('hex')
}

describe('the byte-identity of a career that does not travel', () => {
  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
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
