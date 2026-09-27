// ⭐⭐ T4.13 · E-04 – THE TIER CHIP PRINTS THE ENGINE'S REFUSALS (the owner's ruling 6a), AND CAN SEE
// THE THIRD CAP.
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-04) had two halves, and the second is the
// one with teeth:
//
//   the AGE arm    `tierState.ts` asked the engine's `tierAgeBlock` for the VERDICT and then composed
//                  its own sentence – «… she has aged out of it.» – while `snapshot.tierRefusal` for the
//                  same rung already carried the engine's «… she has aged out.» The age check runs
//                  before the refusal is read, so the engine's words were discarded. Parity spec §3's
//                  second bullet, verbatim: the screen re-authored a sentence the engine composed.
//   the CAP arms   two hand-composed sentences over `snapshot.entryCap` / `proEntryCap` – and the engine
//                  has THREE cap refusals. The third, the WTA sub-cap («at most three of a fourteen-
//                  year-old's eight may be at W75 or above»), had NO ARM AT ALL, so a sub-capped rung
//                  fell through to 'scheduled' / 'unscheduled' and the strip read OPEN over a rung
//                  `enterEvent` refuses.
//
// ⚠⚠ AND `tierRefusal` COULD NOT CARRY A CAP AT ALL, which is why the cap half was invisible rather than
// merely duplicated. `tierVerdict` asks `entryVerdict(…, availability = false)`, and all three caps lived
// inside `availabilityStatus`. So the fix is form A in two moves: `tierCapRefusal(world, tier, week)` is
// the cap block with a name (called by `availabilityStatus` too, so there is ONE spelling and no
// tournament's verdict moves), and `tierVerdict` consults it where the ladder had nothing to say.
//
// ⚠ WHICH HALF WAS ALREADY CLOSED, because this site is HALF-FIXED and the spec says so.
// docs/specs/engine-ui-parity-2026-09.md §5's second instance – `tierState`'s LOCKED arm reading two
// sources for one plaque – was closed on 25.09: the tooltip's re-derivation from `minPoints` went, and
// the distance, the «she has N of M» and the results plan all read one binding off
// `refusal.pointsToEnter`. That is the POINT LOCK's plaque. The AGE and CAP arms were untouched by it,
// and they are this task. Nothing here re-does that work; §1 below asserts it still holds.
//
// ⚠⚠ D-P9 RIDES: `TierRefusal.reason` admitted `'injured'` and `'medical'`, which its only producer
// cannot emit, and the projection cast the rows with an `as` so the compiler checked nothing. The union is
// narrowed to `'locked' | 'unavailable' | 'capped'` and the rows are built against the type – see §4.
//
// ⚠⚠ MUTATION ARM: restore the chip's own sentence in either arm and the matching case reddens, with both
// outputs quoted in the wave's report.
import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  createWorld,
  isCappedProTier,
  kidAgeAt,
  recomputeKidRank,
  seasonStartWeek,
  tierOpenFor,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { tierVerdict } from '../src/engine/world/medical'
import { proSubCapUsage } from '../src/engine/world/entryCaps'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { tierState } from '../src/composables/tierState'
import { engineModuleFunction, componentFile } from './worldSource'
import { codeOf } from './helpers/source'
import { DEFAULT_PROFILE, type Snapshot } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

/** The rung and the age the sub-cap is written for, read off `ECONOMY` rather than typed: the rule is
 *  `{ 14: { fromTier: 'w75', max: 3 } }` today and the fixture follows it wherever it moves. */
const SUB_AGE = Number(Object.keys(ECONOMY.entryCap.proSubCapByAge)[0])
const SUB_ROW = ECONOMY.entryCap.proSubCapByAge[SUB_AGE]

/** A fourteen-year-old with a professional book, who has already entered her sub-cap's worth of big W
 *  rungs this season.
 *
 *  ⚠⚠ IT IS POSED, AND SAYING WHY IS THE POINT OF THE FIXTURE. `world/entryCaps.ts` measures the
 *  sub-cap at **mean 0.0 over n = 90 careers, 676 weeks**: it CAN bind at the shipped constants (the
 *  age-grid ruling of 16.08 put `w75.minAgeYears` at 14) and it does not, because `w75.acceptsRank`
 *  refuses a fourteen-year-old who holds no professional ranking. The rule ships anyway, and its own note
 *  says why: «so that a phase which opens a rung lower does not have to remember it». THE CHIP WAS THE
 *  SURFACE THAT HAD TO REMEMBER, and a state no fixture can walk to is exactly what parity spec §5's
 *  second instance was – a latent instance is still an instance. So the professional book is granted and
 *  the ledger is written, which is the smallest world in which the third cap speaks. */
function subCappedWorld(seed = 'e04-subcap'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  // ⚠ THE WEEK IS FOUND, NOT WRITTEN. `START_AGE` is 13, so week 0 is a year too early and the row would
  // not apply at all: `kidAgeAt` is walked to the first week she is the sub-cap's age (23 on the default
  // profile's January birthday, still inside season 0) and the fixture sits three weeks into it.
  let at = -1
  for (let w = 0; w < 200 && at < 0; w++) if (kidAgeAt(world, w) === SUB_AGE) at = w
  expect(at, `a week at ${SUB_AGE} exists in the first two seasons`).toBeGreaterThan(0)
  world.week = at + 3
  // A COUNTING PROFESSIONAL ROW, so the acceptance list reads a live position for her rather than the tie
  // floor – `openProWorld`'s own device in tests/age-caps.test.ts, re-sized for this rung.
  //
  // ⚠⚠ THE NUMBER IS BRACKETED BY TWO GATES AND IS THEREFORE MEASURED, NOT PICKED. Too few points and
  // `w75.acceptsRank` (#300) refuses her – 150 points is #359 and the verdict comes back 'locked', which
  // is the acceptance cut and not the cap. Too many and `playDownBars` refuses her from the other side –
  // 4000 points is #12 and the verdict is «closed to the world's top 50 – she is #12», the sport refusing
  // her for being too GOOD. Measured on this fixture: 60 → #560, 150 → #359, 200 → #299, 500 → #162,
  // 1200 → #72. 500 sits in the middle of the window with room on both sides.
  world.results.push({ playerId: KID_ID, week: world.week, points: 500, tier: 'slam' })
  recomputeKidRank(world)
  // THREE ENTRIES AT OR ABOVE THE SUB-CAP'S FLOOR, in this season's ledger. `seasonWEntriesByTier`
  // folds `track: 'wta'` rows whose id ends in the rung's name, which is the shape `enterEvent` writes.
  world.seasonEntries = {
    fromWeek: seasonStartWeek(world.week),
    rows: Array.from({ length: SUB_ROW.max }, (_, i) => ({
      id: `subcap-${i}-${SUB_ROW.fromTier}`,
      track: 'wta' as const,
      outgrown: false,
      bookShut: false,
    })),
  }
  return world
}

/** `tierState`'s input, assembled off a snapshot exactly as `useTierStates` assembles it. */
function stateOf(snap: Snapshot, id: TierId) {
  return tierState(id, {
    ageYears: snap.ageYears,
    points: snap.ladders.domestic.points,
    itfPoints: snap.ladders.itf.points,
    itfRank: snap.ladders.itf.rank,
    upcoming: snap.upcoming,
    horizonWeeks: 8,
    entryCap: snap.entryCap,
    proEntryCap: snap.proEntryCap,
    engineOpen: snap.tierOpen[id],
    engineOutgrown: snap.tierOutgrown[id],
    acceptsRank: snap.tierAcceptance[id],
    refusal: snap.tierRefusal[id],
  })
}

describe('E-04 §1: the fixture really is sub-capped, and only by the THIRD cap', () => {
  const world = subCappedWorld()
  const tier = SUB_ROW.fromTier

  it('⚠ the sub-cap itself says so', () => {
    const usage = proSubCapUsage(world, world.week, tier)
    expect(usage, `${tier} is at or above the sub-cap's floor`).not.toBeNull()
    expect(usage!.limit, 'the rulebook\'s own quota').toBe(SUB_ROW.max)
    expect(usage!.remaining, 'and she has spent all of it').toBe(0)
    expect(isCappedProTier(tier), 'the rung is in the pro allowance\'s family').toBe(true)
  })

  it('⚠⚠ and the LADDER holds the rung open – so the cap is the only thing refusing her', () => {
    // Without this the case below would be measuring an acceptance cut, which is the null-arm shape:
    // a rung the ladder shuts reports 'locked' and the cap never speaks. This is also the sentence
    // that makes the fixture posed rather than walked (see `subCappedWorld`).
    expect(tierOpenFor(world, tier), `${TIERS[tier].label} is open to her on the ladder`).toBe(true)
    expect(kidAgeAt(world, world.week), 'and she is the age the sub-cap row is written for').toBe(SUB_AGE)
  })

  it('⚠ the PARENT allowance is untouched, so the third cap is the one being read', () => {
    // `tierCapRefusal` checks the ITF year, then the pro age-year, then the sub-cap. A fixture with the
    // parent allowance spent would get the parent's sentence and prove nothing about the third.
    const snap = toSnapshot(world)
    expect(snap.proEntryCap.remaining, 'her pro age-year allowance still has room').toBeGreaterThan(0)
    expect(snap.entryCap.remaining, 'and so does the junior one').toBeGreaterThan(0)
  })
})

describe('E-04 §2: the engine\'s cap verdict reaches a RUNG now', () => {
  it('⭐⭐⭐ `tierVerdict` refuses the sub-capped rung, with the engine\'s own sentence', () => {
    const world = subCappedWorld()
    const v = tierVerdict(world, SUB_ROW.fromTier)
    expect(v.level, 'the rung is shut').toBe('blocked')
    expect(v.reason, 'and the reason is the allowance').toBe('capped')
    expect(v.entryCap, 'carrying the engine\'s own count').toEqual({ used: SUB_ROW.max, limit: SUB_ROW.max, remaining: 0 })
    // The sentence is the sub-cap's own (`proSubCapRefusalDetail`), quoted from the engine rather than
    // retyped: it names the rule, the quota, what she has spent and what stays open.
    expect(v.detail, 'the quota names the rung it counts from').toContain(TIERS[SUB_ROW.fromTier].label)
    expect(v.detail, 'and says the smaller rungs are still hers').toContain('The smaller rungs stay open.')
  })

  it('⭐⭐ ...and the SNAPSHOT carries it, which is what the chip reads', () => {
    const snap = toSnapshot(subCappedWorld())
    const refusal = snap.tierRefusal[SUB_ROW.fromTier]
    expect(refusal, 'the projection holds a row for the rung').toBeTruthy()
    expect(refusal!.reason).toBe('capped')
    expect(refusal!.entryCap, 'the allowance rides along').toEqual({ used: SUB_ROW.max, limit: SUB_ROW.max, remaining: 0 })
  })

  it('⚠ `tierOpen` is UNTOUCHED, and that is deliberate', () => {
    // `tierOpenFor` is the FLOOR and has never counted availability; a cap is not a floor. The chip tells
    // 'capped' apart from 'locked' precisely because the two are different facts – and `isTierOpen`
    // reads `kind`, so nothing offers her the rung either way.
    const snap = toSnapshot(subCappedWorld())
    expect(snap.tierOpen[SUB_ROW.fromTier], 'the ladder still holds the rung open').toBe(true)
  })
})

describe('E-04 §3: the chip prints it, and composes nothing', () => {
  it('⭐⭐⭐ THE THIRD CAP HAS A CHIP AT ALL – it used to read as an open rung', () => {
    const snap = toSnapshot(subCappedWorld())
    const s = stateOf(snap, SUB_ROW.fromTier)
    // Before this task: 'scheduled' or 'unscheduled', i.e. the strip saying OPEN over a rung the
    // turnstile refuses. That is the defect, and this line is it closed.
    expect(s.kind, 'the rung reads as capped').toBe('capped')
    expect(s.entryCap, 'and the chip carries the engine\'s count for the abbreviated label').toEqual({
      used: SUB_ROW.max,
      limit: SUB_ROW.max,
      remaining: 0,
    })
  })

  it('⭐⭐ the tooltip IS the engine\'s sentence, byte for byte', () => {
    const snap = toSnapshot(subCappedWorld())
    const s = stateOf(snap, SUB_ROW.fromTier)
    // THE MUTATION ARM lands here: compose a sentence in `tierState` again and this line reddens while
    // the engine's own suites stay green. `toBe` and not `toContain`: «prints the engine's refusal» means
    // the whole string, or the screen is still editing it.
    expect(s.title).toBe(snap.tierRefusal[SUB_ROW.fromTier]!.detail)
  })

  it('⚠ the NOTE stays the screen\'s short form, and it is the owner\'s existing words', () => {
    // Invariant 4: the chip's short label is not this task's to invent. Both spellings already ship –
    // `SeasonScreen.vue` picks between the same two on the same predicate – and the count is the
    // engine's. Asserted so a future arm cannot quietly widen this into new copy.
    const snap = toSnapshot(subCappedWorld())
    const s = stateOf(snap, SUB_ROW.fromTier)
    expect(s.note).toBe(`Tour age rule – ${SUB_ROW.max} of ${SUB_ROW.max}`)
  })

  it('⭐⭐ and the AGED-OUT arm prints the engine\'s sentence instead of its own', () => {
    // The first half of E-04. Posed on `tierState` directly, because the two sentences differ by three
    // characters and the point is WHICH of them a reader gets.
    const engine = 'Junior Tour 30 is under-19 – at 26 she has aged out.'
    const s = tierState('j30', {
      ageYears: 26,
      points: 0,
      upcoming: [],
      horizonWeeks: 8,
      entryCap: { used: 0, limit: 14, remaining: 14 },
      proEntryCap: { used: 0, limit: 8, remaining: 8 },
      refusal: { reason: 'unavailable', detail: engine },
    })
    expect(s.kind).toBe('age-locked')
    expect(s.title, 'the engine speaks, the screen decorates').toBe(engine)
    // The chip's own short note is unchanged – it names the rule, not the sentence.
    expect(s.note).toBe(`Under-${TIERS.j30.maxAgeYears! + 1}`)
  })

  it('⚠ a caller with NO oracle keeps every sentence it had – the pure-caller fallback', () => {
    // Every arm in this file falls back to the live rule for a bench, a test or a fixture that hands no
    // `refusal`. Asserted in both directions so the fix cannot be read as «the arms below are dead».
    const aged = tierState('j30', {
      ageYears: 26,
      points: 0,
      upcoming: [],
      horizonWeeks: 8,
      entryCap: { used: 0, limit: 14, remaining: 14 },
      proEntryCap: { used: 0, limit: 8, remaining: 8 },
    })
    expect(aged.title, 'the screen\'s own line, exactly as it always read').toBe(
      `${TIERS.j30.label} is under-${TIERS.j30.maxAgeYears! + 1} – at 26 she has aged out of it.`,
    )
    const capped = tierState('j30', {
      ageYears: 15,
      points: 9999,
      itfPoints: 9999,
      upcoming: [],
      horizonWeeks: 8,
      entryCap: { used: 14, limit: 14, remaining: 0 },
      proEntryCap: { used: 0, limit: 8, remaining: 8 },
    })
    expect(capped.kind).toBe('capped')
    expect(capped.note).toBe('Year limit – 14 of 14')
    expect(capped.title, 'the ITF arm\'s own sentence, untouched').toContain('she has used all 14 of her international events')
  })
})

describe('E-04 §4: D-P9 – the wire type admits only what the producer emits', () => {
  it('⚠⚠ `TierRefusal.reason` no longer carries two dead members', () => {
    const src = codeOf(componentFile('shared/protocol/competition.ts'))
    const line = src.split('\n').find((l) => l.includes("reason: 'locked'"))
    expect(line, 'the union is declared on one line').toBeTruthy()
    expect(line, 'and admits exactly the three a rung can answer').toContain("'locked' | 'unavailable' | 'capped'")
    expect(line, 'a week fact is not a rung refusal').not.toContain("'injured'")
    expect(line).not.toContain("'medical'")
  })

  it('⚠⚠ ...and the projection is built WITHOUT the cast, so the compiler checks it', () => {
    // The `as Partial<Record<TierId, TierRefusal>>` is what let the union drift: `Object.fromEntries`
    // hands back a type the cast overwrote, so `reason: v.reason` was never compared with anything.
    const src = codeOf(engineModuleFunction('world/snapshot', 'tierRefusals'))
    expect(src, 'the rows go into a DECLARED record').toContain('const out: Partial<Record<TierId, TierRefusal>> = {}')
    expect(src, 'and nothing is cast on the way in').not.toContain('as Partial<Record<TierId, TierRefusal>>')
  })

  it('⚠ the narrowing is exhaustive, so a new `EntryStatus` reason cannot arrive unnoticed', () => {
    const src = codeOf(engineModuleFunction('world/snapshot', 'rungRefusalReason'))
    expect(src, 'the `never` guard, this file\'s own idiom').toContain('const unhandled: never = reason')
  })
})

describe('E-04 §5: and 25.09\'s half of this plaque still holds', () => {
  it('⚠ the point lock reads ONE binding off the engine\'s number', () => {
    // Parity spec §5's second instance, closed 25.09: the tooltip's re-derivation from the tier's own
    // `minPoints` is gone and the whole plaque follows `refusal.pointsToEnter`. Asserted here so this
    // task's report can say which half it did NOT have to do – and posed with the divergence no fixture
    // can produce, which is that closure's own technique.
    const s = tierState('regional', {
      ageYears: 15,
      points: 40,
      upcoming: [],
      horizonWeeks: 8,
      entryCap: { used: 0, limit: 14, remaining: 14 },
      proEntryCap: { used: 0, limit: 8, remaining: 8 },
      refusal: { reason: 'locked', detail: 'x', pointsToEnter: TIERS.regional.enterPointBand[0] + 45 },
    })
    expect(s.kind).toBe('locked')
    expect(s.pointsToEnter, 'the chip takes the ENGINE\'s threshold').toBe(TIERS.regional.enterPointBand[0] + 45)
    expect(s.title, 'and so does the tooltip beside it').toContain(`of ${TIERS.regional.enterPointBand[0] + 45}`)
  })
})
