// =================================================================================================
// WAVE 3, T3 + T5 – THE ARRIVAL HAZARD, AND THE TWO DRAWS THAT FILL THE ROW IN
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T3 and §2 T5, constants from
// `docs/specs/who-she-is-2026-09.md` §4. T3 and T5 are ONE MOMENT in the code – the row cannot be
// honestly constructed without both draws – so they are one test file with two halves.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence, because this step raises none
// (CLAUDE.md invariant 4): no beat, no feed row, no string. `wants` is a machine value and never a
// rendered word. Delivery on `knownWeek` is T6's.
//
// ⚠ EXACT MEDIANS ARE NOT HERE EITHER. The census bars (romance counts, first-arrival ages, late
// shares) are T11's bench and its acceptance table; every corridor below is deliberately WIDE and
// exists to catch a wiring defect, not to measure the design.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ARM 1  the age gate deleted – `if (kidAgeNow(world) < life.ageGate) return false` removed
//          3 RED · «not one arrival in any week before the gate: expected 44 to be +0», «at 15.9
//          she is not eligible: expected true to be false», and §B's «the gate returned before any
//          key existed: expected [ 'zero-draw-age:life:arrival:127' ] to deeply equal []»
//
//   ARM 2  ⚠⚠ THE ZERO-DRAW SHORT-CIRCUIT, and it is ONE mutation read TWO ways, because the
//          brief's own framing for it turned out not to be testable – the finding is under §B.
//          The mutation: the roll hoisted above the gate, `const roll = rngFromSeed(...)()` then
//          `if (!arrivalEligible(world)) return` – i.e. draw-and-discard on an ineligible week.
//          2a  against §B's key COUNTS – 3 RED · «the gate returned before any key existed:
//              expected [ 'zero-draw-age:life:arrival:127' ] to deeply equal []», the occupied-slot
//              case («expected [ 'zero-draw-slot:life:arrival:232' ]») and the cooldown case.
//          2b  against §B's two-worlds ALIGNMENT comparison, the SAME run – **GREEN. It did not go
//              red**, and that is the finding rather than a failed arm: `✓ the arrival verdict is
//              keyed on (seed, week) and on no part of the career's history 5ms`. Every key in this
//              wave carries its own week, so a discarded draw cannot shift any other week's value –
//              alignment is true BY CONSTRUCTION and is vacuous AS a short-circuit test. Kept under
//              its honest name as the guard for a future re-key; §B's counts are the real net.
//
//   ARM 3  the bond shave ignored at the call site – `knownWeek = sinceWeek + raw`
//          1 RED · §D «⚠ ...and the week he HEARS about it can be, which is the design: expected 0
//          to be greater than 0»
//   ARM 3b `shaveLag` itself returns `raw` for every band
//          3 RED · «expected 1 to be +0» (the shave table), «expected 6 to be less than 6» (the
//          monotone case's own anti-vacuity line) and the §D end-to-end case again
//
//   ARM 4  the two partner draws folded onto ONE key (`:partner:<w>` for both)
//          2 RED · §B «an ARRIVAL takes exactly three, one per key: expected […(3)] to deeply equal
//          […(3)]» and §D «sunny: p-zero differs by 0.6286528866714184 across the wants split»
//          ⚠ AND THE FIRST DRAFT OF §D's SPLIT-KEY CASE SURVIVED THIS MUTATION GREEN – see §D.
//
//   ARM 5  the cooldown compared with `<=` instead of `<`
//          1 RED · §A «sunny: the boundary week itself clears: expected false to be true»
//
//   ARM 6  `drawPartnerWants` leans AWAY from her own register
//          1 RED · §D «sunny drew its own register 0.303 of the time: expected 0.303 to be greater
//          than 0.66»
//
//   ARM 7  `temperamentOpenness` inverted (sunny/fiery -> 'private')
//          1 RED · §D «expected [ Array(4) ] to deeply equal [ Array(4) ]» – the literal mapping
//          pin, which exists precisely because every other case reads `own` through the same
//          function and would have moved with it
//
//   ARM 8  `rollArrival` also raises a `lifeLog` row and a feed event
//          1 RED · §C «and the parent has been told nothing: expected [ { week: 238, …(3) } ] to
//          deeply equal []»
//
// ⚠⚠ AND A WORD ON WHY THE LEDGER IS RUN AND NOT REASONED, kept from T1's own header: an assertion
// can be vacuous and still look green. TWO were caught here, both by the same root cause –
// `rngFromSeed` hands back a FRESH stream per call, so nothing in this wave can misalign anything
// else – and both are recorded above (ARM 2b, ARM 4). Three structural habits below exist for the
// same reason: every «never happens» sweep is PAIRED with a positive control in the same case (so it
// cannot pass because nothing ever fires); §B holds the keys the code reached in an array the code
// under test cannot see; and ARM 8 proves the one «nothing changed» assertion here is reachable.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB. Every call is delegated to the real `rngFromSeed`, so the
// numbers this file measures are the engine's own; the mock exists only so §B can COUNT the keys the
// gate reached. Hoisted, because `vi.mock`'s factory is lifted above the imports.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import {
  activeEpisode,
  arrivalEligible,
  arrivalHazardFor,
  createWorld,
  drawPartnerWants,
  drawRawLag,
  kidAgeExact,
  loveEpisodesOf,
  rollArrival,
  shaveLag,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { temperamentOpenness, type Temperament } from '../src/engine/spirit'
import type { BondBand, LoveEpisode } from '../src/shared/protocol'

const LIFE = ECONOMY.life

/** Her age in `week` on a given career's own birth date. */
function ageAt(world: WorldState, week: number): number {
  return kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay)
}

/** The FIRST week she reads at or above `years` – found by walking the same clock the gate reads,
 *  never by arithmetic of our own, so the boundary this file tests is the boundary the engine has. */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) if (ageAt(world, w) >= years) return w
  throw new Error(`no week reaches age ${years}`)
}

/** A career, parked at `week`, with an empty love life. ⚠ A REAL `createWorld` rather than a cast:
 *  the profile, the seed and the temperament are then the engine's own, which is what makes the
 *  numbers below the engine's numbers. */
function careerAt(seed: string, week: number, temperament?: Temperament): WorldState {
  const world = createWorld(seed)
  world.week = week
  if (temperament !== undefined) world.temperament = temperament
  return world
}

/** One roll on a career reset to «nobody has ever arrived», so a sweep measures the HAZARD rather
 *  than the slot filling up after the first success. Returns the row if someone appeared. */
function rollFresh(world: WorldState, week: number): LoveEpisode | null {
  world.week = week
  world.loveEpisodes = []
  rollArrival(world)
  return world.loveEpisodes[0] ?? null
}

const SWEEP_SEEDS = Array.from({ length: 40 }, (_, i) => `arrival-sweep-${i}`)

// =================================================================================================
// A. THE GATE – ⭐ SIXTEEN, AN EMPTY SLOT, AND A COOLDOWN THAT NOTHING IN THIS WAVE CAN REACH
// =================================================================================================
describe('wave 3 T3 A – eligibility', () => {
  it('⭐⭐ nobody arrives before her sixteenth – 40 careers, every week of them, and the control fires', () => {
    // ⚠ THE POSITIVE CONTROL IS IN THE SAME CASE ON PURPOSE. A «never happens» sweep passes
    // trivially if the machinery could never have fired at all, so the second count below is what
    // makes the first one mean something: the identical loop, run over the weeks AFTER the gate,
    // has to produce arrivals.
    let early = 0
    let later = 0
    for (const seed of SWEEP_SEEDS) {
      const world = careerAt(seed, 0)
      const gate = weekAtAge(world, LIFE.ageGate)
      for (let w = 0; w < gate; w++) if (rollFresh(world, w) !== null) early++
      for (let w = gate; w < gate + 208; w++) if (rollFresh(world, w) !== null) later++
    }
    expect(early, 'not one arrival in any week before the gate').toBe(0)
    expect(later, 'and the very same loop after it is busy – the sweep could have failed').toBeGreaterThan(20)
  })

  it('⭐ the boundary is the WEEK SHE TURNS SIXTEEN: 15.9 never, 16.0 eligible', () => {
    const world = careerAt('arrival-boundary', 0)
    const gate = weekAtAge(world, 16)
    // The week before is genuinely 15.9-something and not 15.0 – the boundary is tight, which is the
    // whole reason the gate reads `kidAgeExact` and not the whole-years version.
    expect(ageAt(world, gate - 1)).toBeGreaterThan(15.9)
    expect(ageAt(world, gate - 1)).toBeLessThan(16)
    world.week = gate - 1
    expect(arrivalEligible(world), 'at 15.9 she is not eligible').toBe(false)
    world.week = gate
    expect(arrivalEligible(world), 'and at 16.0 she is').toBe(true)
  })

  it('⭐ nobody new appears while someone is already there', () => {
    const world = careerAt('arrival-occupied', 0)
    world.week = weekAtAge(world, 18)
    expect(arrivalEligible(world)).toBe(true)
    world.loveEpisodes = [{ id: 'p:400', sinceWeek: 400, endedWeek: null, knownWeek: 402, wants: 'open', partnerId: 'p:400' }]
    expect(activeEpisode(world), 'the fixture really is an open row').not.toBeNull()
    expect(arrivalEligible(world), 'an occupied slot refuses').toBe(false)
  })

  it('⚠ the cooldown clears ON the boundary week, per temperament – hand-built, because nothing in this wave can reach it', () => {
    // ⚠ UNREACHABLE IN PLAY AND TESTED ANYWAY: wave 3 never writes `endedWeek`, so the only worlds
    // that can carry one are the ones built here. It ships now so wave 4 changes nothing in the gate.
    for (const temperament of TEMPERAMENTS) {
      const wait = LIFE.cooldownWeeks[temperament]
      const world = careerAt(`cooldown-${temperament}`, 0, temperament)
      const ended = weekAtAge(world, 18)
      world.loveEpisodes = [{ id: 'p:1', sinceWeek: ended - 40, endedWeek: ended, knownWeek: ended - 38, wants: 'open', partnerId: 'p:1' }]
      expect(activeEpisode(world), 'the row has ENDED, so the slot itself is free').toBeNull()
      world.week = ended + wait - 1
      expect(arrivalEligible(world), `${temperament}: one week short of ${wait} still refuses`).toBe(false)
      world.week = ended + wait
      expect(arrivalEligible(world), `${temperament}: the boundary week itself clears`).toBe(true)
    }
    // ...and the four waits really are four different numbers, so the loop above is four cases.
    expect(new Set(TEMPERAMENTS.map((t) => LIFE.cooldownWeeks[t])).size).toBe(4)
  })

  it('a career with no ended row is CLEAR, never blocked – «no ended row yet ⇒ clear»', () => {
    const world = careerAt('cooldown-virgin', 0, 'deep')
    world.week = weekAtAge(world, 16)
    expect(loveEpisodesOf(world)).toEqual([])
    // deep waits 52 weeks after an ending, and week 130-ish minus «no ending» must not read as 0.
    expect(arrivalEligible(world)).toBe(true)
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS ON AN INELIGIBLE WEEK – THE LOAD-BEARING RULE OF THE STEP
// =================================================================================================
//
// ⚠⚠ THE FINDING, AND WHY THIS SECTION IS SHAPED THE WAY IT IS. The brief asks for the short-circuit
// to be proven «by stream alignment – two worlds differing only in an ineligible week's state must
// produce identical later arrivals». Measured: that comparison CANNOT FAIL here. Every key in this
// wave carries its own week (`seed:life:arrival:<week>`), so each week derives a fresh stream from
// its own key and a discarded draw shifts nothing – the alignment property is true by construction
// and stays green under the very mutation it was meant to catch (ARM 2b in the ledger above).
//
// So the honest net is a COUNT of the keys the code reached, held in an array the code under test
// cannot see, and the alignment comparison is kept one case below under its true name: the guard
// that would catch a future re-key onto a stream shared between weeks.
describe('wave 3 T3 B – an ineligible week takes ZERO draws', () => {
  beforeEach(() => {
    rngKeys.length = 0
  })

  /** The life-layer keys reached since the last reset. ⚠ Filtered, because `createWorld` legitimately
   *  derives `:temperament` and a dozen others – this section is a claim about THIS wave's streams. */
  function lifeKeys(): string[] {
    return rngKeys.filter((k) => k.includes(':life:'))
  }

  it('⭐⭐ an UNDER-AGE week derives no stream at all – not one, not discarded', () => {
    const world = careerAt('zero-draw-age', 0)
    const gate = weekAtAge(world, 16)
    world.week = gate - 1
    rngKeys.length = 0
    rollArrival(world)
    expect(lifeKeys(), 'the gate returned before any key existed').toEqual([])
  })

  it('⭐⭐ an OCCUPIED slot derives no stream at all', () => {
    const world = careerAt('zero-draw-slot', 0)
    world.week = weekAtAge(world, 18)
    world.loveEpisodes = [{ id: 'p:9', sinceWeek: 9, endedWeek: null, knownWeek: 9, wants: 'open', partnerId: 'p:9' }]
    rngKeys.length = 0
    rollArrival(world)
    expect(lifeKeys()).toEqual([])
  })

  it('⭐⭐ a week inside a COOLDOWN derives no stream at all', () => {
    const world = careerAt('zero-draw-cooldown', 0, 'deep')
    const ended = weekAtAge(world, 18)
    world.loveEpisodes = [{ id: 'p:1', sinceWeek: ended - 10, endedWeek: ended, knownWeek: ended - 8, wants: 'open', partnerId: 'p:1' }]
    world.week = ended + LIFE.cooldownWeeks.deep - 1
    rngKeys.length = 0
    rollArrival(world)
    expect(lifeKeys()).toEqual([])
  })

  it('⭐ an ELIGIBLE week that MISSES takes exactly one draw, on the arrival key and nothing else', () => {
    // The positive control for the three cases above: the same call on an eligible world DOES reach
    // a stream, so «no keys» above is a property of the gate and not of the recorder being broken.
    const world = careerAt('zero-draw-eligible', 0, 'deep')
    const week = firstMiss(world)
    world.week = week
    world.loveEpisodes = []
    rngKeys.length = 0
    rollArrival(world)
    expect(lifeKeys()).toEqual([`${world.seed}:life:arrival:${week}`])
    expect(loveEpisodesOf(world), 'and it really was a miss').toEqual([])
  })

  it('⭐⭐ an ARRIVAL takes exactly three, one per key – the split-key law made a count', () => {
    const world = careerAt('zero-draw-hit', 0, 'fiery')
    const week = firstHit(world)
    world.week = week
    world.loveEpisodes = []
    rngKeys.length = 0
    rollArrival(world)
    expect(lifeKeys()).toEqual([
      `${world.seed}:life:arrival:${week}`,
      `${world.seed}:life:partner:${week}:wants`,
      `${world.seed}:life:partner:${week}:lag`,
    ])
    // ⚠ AND NO OTHER `:life:` KEY EXISTS ON THIS TREE. `seed:life:smalltalk:*` is T8's and
    // `seed:life:ends:*` is WAVE 4's; neither may be created early (brief §3).
    //
    // ⚠⚠ THE NOTE IS RE-AIMED 12.09 BY WAVE 4's T2 AND THE ASSERTION IS UNTOUCHED, which is worth
    // saying out loud because a reader meeting the two together will wonder. Both of those keys DO
    // exist on the tree now – `:smalltalk:` since T8 (lifeBeat §7) and `:ends:` since T2 (§8) – and
    // the claim this line makes was never «nobody has one»: it is that `rollArrival` derives the
    // three keys named above and NO OTHER, which is the split-key law read as a count. It is now
    // strictly stronger than it was when both siblings were hypothetical, because both of them are
    // real functions that a careless edit could reach from here.
    expect(lifeKeys().some((k) => k.includes(':smalltalk:') || k.includes(':ends:'))).toBe(false)
  })

  it('the arrival verdict is keyed on (seed, week) and on no part of the career\'s history', () => {
    // ⚠⚠ THIS IS THE ALIGNMENT COMPARISON THE BRIEF ASKED FOR, UNDER ITS HONEST NAME. It is true by
    // CONSTRUCTION today – the key carries the week – and it stayed green under the draw-and-discard
    // mutation (ARM 2b), which is why the key COUNT above is the short-circuit's real net. It is kept
    // because it is the guard that would catch a future re-key onto a stream shared between weeks:
    // the day `:life:arrival:` stops carrying `<week>`, this case is the one that goes red.
    const virgin = careerAt('alignment', 0, 'sunny')
    const lived = careerAt('alignment', 0, 'sunny')
    const start = weekAtAge(virgin, 18)
    // `lived` spent its adult years ineligible – an attachment that was there the whole time.
    const history: LoveEpisode[] = [{ id: 'p:0', sinceWeek: start - 60, endedWeek: start - 1, knownWeek: start - 58, wants: 'open', partnerId: 'p:0' }]
    const a: number[] = []
    const b: number[] = []
    for (let w = start + LIFE.cooldownWeeks.sunny; w < start + 400; w++) {
      if (rollFresh(virgin, w) !== null) a.push(w)
      lived.week = w
      lived.loveEpisodes = [...history]
      rollArrival(lived)
      if (lived.loveEpisodes.length > 1) b.push(w)
    }
    expect(a.length, 'the sweep found arrivals at all').toBeGreaterThan(2)
    expect(b).toEqual(a)
  })
})

/** The first adult week this career MISSES on – used as a positive control rather than assumed. */
function firstMiss(world: WorldState): number {
  const start = weekAtAge(world, 18)
  for (let w = start; w < start + 400; w++) if (rollFresh(world, w) === null) return w
  throw new Error('no miss found')
}

/** ...and the first it HITS on. */
function firstHit(world: WorldState): number {
  const start = weekAtAge(world, 18)
  for (let w = start; w < start + 2000; w++) if (rollFresh(world, w) !== null) return w
  throw new Error('no hit found')
}

// =================================================================================================
// C. THE HAZARD – the corridor, the age step, the temperament order, and determinism
// =================================================================================================
describe('wave 3 T3 C – the weekly hazard', () => {
  /** How many of `weeks` this career arrives on, with the slot emptied between every roll. */
  function hits(seeds: string[], temperament: Temperament, from: (w: WorldState) => number, count: number): number {
    let n = 0
    for (const seed of seeds) {
      const world = careerAt(seed, 0, temperament)
      const start = from(world)
      for (let w = start; w < start + count; w++) if (rollFresh(world, w) !== null) n++
    }
    return n
  }

  const ADULT = (w: WorldState) => weekAtAge(w, 18)
  const SAMPLES = SWEEP_SEEDS.length * 260

  it('⭐ the adult rate lands in a WIDE corridor around who-she-is §4\'s table, per temperament', () => {
    // ⚠ WIDE AND NON-FLAKY BY DESIGN. 10,400 (seed, week) samples per arm; the corridor is ±30% of
    // the predicted rate, which is 6+ standard errors at the smallest cell. The exact medians are
    // T11's bench and its acceptance table, never this file's.
    for (const temperament of TEMPERAMENTS) {
      const predicted = LIFE.arrivalPerWeek.adult * LIFE.temperamentMult[temperament]
      const measured = hits(SWEEP_SEEDS, temperament, ADULT, 260) / SAMPLES
      expect(measured, `${temperament}: ${measured} against ${predicted}`).toBeGreaterThan(predicted * 0.7)
      expect(measured, `${temperament}: ${measured} against ${predicted}`).toBeLessThan(predicted * 1.3)
    }
  })

  it('⭐ the 18th birthday is a STEP UP, and the same girl is the control for herself', () => {
    // 16.0 to 17.99 against the two years after – one temperament, one seed set, so the only thing
    // that differs between the arms is which side of `adultFrom` the weeks sit on.
    const minor = hits(SWEEP_SEEDS, 'fiery', (w) => weekAtAge(w, 16), 104)
    const adult = hits(SWEEP_SEEDS, 'fiery', ADULT, 104)
    expect(minor, 'the minor arm is not empty either').toBeGreaterThan(0)
    expect(adult / minor, `${adult} adult against ${minor} minor`).toBeGreaterThan(1.6)
    expect(adult / minor).toBeLessThan(3.4)
  })

  it('⭐⭐ the four temperaments NEST exactly, because the multiplier is all that separates them', () => {
    // ⚠ A STRONGER STATEMENT THAN A CORRIDOR AND NOT A FLAKY ONE. The arrival key carries no
    // temperament, so all four arms compare the SAME uniform against different hazards: the weeks a
    // quiet girl arrives on must be a strict subset of a sunny girl's, and so on up the table. It
    // goes red the moment the multiplier stops being a pure scale on one shared draw.
    const weeksFor = (temperament: Temperament): Set<number> => {
      const world = careerAt('nesting', 0, temperament)
      const start = weekAtAge(world, 18)
      const out = new Set<number>()
      for (let w = start; w < start + 3000; w++) if (rollFresh(world, w) !== null) out.add(w)
      return out
    }
    const ladder: Temperament[] = ['deep', 'quiet', 'sunny', 'fiery']
    expect(ladder.map((t) => LIFE.temperamentMult[t]), 'the ladder really is ascending').toEqual([0.5, 0.6, 1.2, 1.6])
    const sets = ladder.map(weeksFor)
    for (let i = 0; i + 1 < sets.length; i++) {
      expect(sets[i].size, `${ladder[i]} arrived at all`).toBeGreaterThan(0)
      expect(sets[i].size, `${ladder[i]} is rarer than ${ladder[i + 1]}`).toBeLessThan(sets[i + 1].size)
      for (const w of sets[i]) expect(sets[i + 1].has(w), `${ladder[i]} arrived in ${w}, ${ladder[i + 1]} did not`).toBe(true)
    }
  })

  it('the hazard table itself is who-she-is §4\'s, read as a pure function of (age, temperament)', () => {
    for (const temperament of TEMPERAMENTS) {
      expect(arrivalHazardFor(17.99, temperament)).toBeCloseTo(0.010 * LIFE.temperamentMult[temperament], 10)
      expect(arrivalHazardFor(18, temperament)).toBeCloseTo(0.025 * LIFE.temperamentMult[temperament], 10)
    }
    expect(LIFE.temperamentMult).toEqual({ sunny: 1.2, fiery: 1.6, quiet: 0.6, deep: 0.5 })
    expect(LIFE.ageGate).toBe(16)
  })

  it('⭐ DETERMINISM – same seed, same week, same verdict, and the whole row with it', () => {
    const a = careerAt('determinism', 0, 'sunny')
    const b = careerAt('determinism', 0, 'sunny')
    const start = weekAtAge(a, 18)
    const rowsA: (LoveEpisode | null)[] = []
    const rowsB: (LoveEpisode | null)[] = []
    for (let w = start; w < start + 300; w++) {
      rowsA.push(rollFresh(a, w))
      rowsB.push(rollFresh(b, w))
    }
    expect(rowsA.filter((r) => r !== null).length, 'the run had verdicts of both kinds').toBeGreaterThan(2)
    expect(rowsB).toEqual(rowsA)
  })

  it('the row it appends is the v74 shape, with `endedWeek` null and nothing invented', () => {
    const world = careerAt('row-shape', 0, 'fiery')
    const week = firstHit(world)
    const row = rollFresh(world, week)!
    expect(row).toEqual({
      id: `p:${week}`,
      sinceWeek: week,
      endedWeek: null,
      knownWeek: row.knownWeek,
      wants: row.wants,
      partnerId: `p:${week}`,
    })
    // ⚠ WAVE 3 NEVER WRITES AN ENDING, and the row carries no name and no gender – the schema must
    // not hardwire boyfriend->husband (T1's own note on the type).
    expect(row.endedWeek).toBeNull()
    expect(Object.keys(row).sort()).toEqual(['endedWeek', 'id', 'knownWeek', 'partnerId', 'sinceWeek', 'wants'])
  })

  it('⚠ it raises NO beat and writes NO feed row – delivery is T6\'s, on `knownWeek`', () => {
    const world = careerAt('no-beat', 0, 'fiery')
    const week = firstHit(world)
    world.week = week
    world.loveEpisodes = []
    world.lifeLog = []
    const eventsBefore = world.events.length
    rollArrival(world)
    expect(loveEpisodesOf(world), 'someone did arrive').toHaveLength(1)
    expect(world.lifeLog, 'and the parent has been told nothing').toEqual([])
    expect(world.events.length, 'no feed row either').toBe(eventsBefore)
  })
})

// =================================================================================================
// D. T5 – THE TWO DRAWS: WHAT SHE WANTS, HOW LONG HE WAITS, AND THE SHAVE
// =================================================================================================
describe('wave 3 T5 D – lag and wants', () => {
  const WEEKS = Array.from({ length: 4000 }, (_, i) => 200 + i)

  it('⭐ `wants` leans 70/30 toward her OWN register, both ways round', () => {
    // ⚠ THE MAPPING ITSELF IS PINNED HERE, LITERALLY, and it is not decoration. Every other case in
    // this section reads `own` through `temperamentOpenness` – so an INVERTED projection would move
    // the implementation and the expectation together and every corridor would stay green. who-she-is
    // §1: «sunny = open + steady · fiery = open + intense · quiet = private + steady · deep = private
    // + intense», and `TEMPERAMENTS` is in that order.
    expect(TEMPERAMENTS.map(temperamentOpenness)).toEqual(['open', 'open', 'private', 'private'])
    for (const temperament of TEMPERAMENTS) {
      const own = temperamentOpenness(temperament)
      const share = WEEKS.filter((w) => drawPartnerWants('wants-corridor', w, temperament) === own).length / WEEKS.length
      expect(share, `${temperament} drew its own register ${share} of the time`).toBeGreaterThan(0.66)
      expect(share, `${temperament} drew its own register ${share} of the time`).toBeLessThan(0.74)
    }
    expect(LIFE.wantsOwnRegister).toBe(0.70)
  })

  it('⭐⭐ ...and an open girl and a private girl are exact MIRRORS on one key', () => {
    // The key carries no temperament, so the same uniform is read for all four girls and only `own`
    // flips. Stronger than the corridor and not a sampled claim at all: it holds on every week.
    for (const w of WEEKS) {
      expect(drawPartnerWants('mirror', w, 'sunny')).toBe(drawPartnerWants('mirror', w, 'fiery'))
      expect(drawPartnerWants('mirror', w, 'quiet')).toBe(drawPartnerWants('mirror', w, 'deep'))
      expect(drawPartnerWants('mirror', w, 'sunny')).not.toBe(drawPartnerWants('mirror', w, 'quiet'))
    }
  })

  it('⭐ the RAW lag honours who-she-is §4: p-zero, and the range outside it', () => {
    // ⚠⚠ RE-AIMED 11.09.2026 AND **NOT WEAKENED**. WHAT MOVED: who-she-is §4's «Feed lag» OPEN row –
    // `0 with p 0.45, else uniform 1..5` became `0 with p 0.70, else uniform 1..4`. WHY: T11's
    // arrival census (§4a's wave-3 entry) measured the open late-share at 44.0% against its own
    // ≤ 25% bar, and measured the cause beside it – the RAW draw was already 57.4% late before
    // `bondShave` could touch it, 2.3× the bar with no shave at all. The owner moved the TABLE and
    // not the bar («двигать таблицу – ок»). The PRIVATE row did not move.
    //
    // ⚠ THE CORRIDOR IS THE SAME WIDTH AROUND THE NEW CENTRE and it always was: ±0.04 read off
    // `table.zeroChance` itself, so it re-aims with the constant and cannot be «widened» by a wave
    // without the widening being visible right here. The three claims under it – the floor, the
    // ceiling and «every value in between is reachable» – are likewise read off the table, so the
    // narrowed open range 1..4 is asserted at its new ceiling rather than at a loosened one.
    for (const openness of ['open', 'private'] as const) {
      const table = LIFE.lag[openness]
      const draws = WEEKS.map((w) => drawRawLag('lag-corridor', w, openness))
      const pZero = draws.filter((d) => d === 0).length / draws.length
      expect(pZero, `${openness}: p-zero ${pZero} against ${table.zeroChance}`).toBeGreaterThan(table.zeroChance - 0.04)
      expect(pZero, `${openness}: p-zero ${pZero} against ${table.zeroChance}`).toBeLessThan(table.zeroChance + 0.04)
      const nonZero = draws.filter((d) => d !== 0)
      expect(Math.min(...nonZero), `${openness}: the floor of the uniform`).toBe(table.min)
      expect(Math.max(...nonZero), `${openness}: the ceiling of the uniform`).toBe(table.max)
      // ...and every value in between is reachable, so the range is a uniform and not two endpoints.
      for (let v = table.min; v <= table.max; v++) {
        expect(nonZero.filter((d) => d === v).length, `${openness}: the lag is sometimes ${v}`).toBeGreaterThan(0)
      }
    }
    // ⚠ RE-AIMED, NOT WEAKENED: the literal table moved with the row above it and is still asserted
    // whole – every field of both registers, so a half-applied move (threshold without ceiling, or
    // the private row dragged along) fails here rather than passing as «close enough».
    expect(LIFE.lag).toEqual({ open: { zeroChance: 0.70, min: 1, max: 4 }, private: { zeroChance: 0.10, min: 2, max: 12 } })
  })

  it('⭐ a private girl\'s silence CONTAINS an open girl\'s – one key, two thresholds', () => {
    // p 0.10 against p 0.70 on the same uniform: every week a private girl says it at once is a week
    // an open girl would have. Exact, not sampled.
    // ⚠ RE-AIMED 11.09.2026, NOT WEAKENED – the OPEN threshold moved 0.45 -> 0.70 (the census miss,
    // the owner's ruling). The claim is the same exact one over the same 4,000 weeks, and what it
    // holds is STRUCTURAL rather than statistical: the two registers read ONE key, so the two
    // thresholds cut the same uniform and the smaller set sits inside the larger whatever the numbers
    // are. It is the case that would catch a second key appearing under `private`, and it catches
    // that at 0.70 exactly as it did at 0.45.
    for (const w of WEEKS) {
      if (drawRawLag('containment', w, 'private') === 0) {
        expect(drawRawLag('containment', w, 'open'), `week ${w}`).toBe(0)
      }
    }
  })

  it('⭐⭐ the two facts are INDEPENDENT – knowing `wants` tells you nothing about the lag', () => {
    // ⚠⚠ THE SPLIT-KEY LAW, IN THE ONLY FORM THAT CAN ACTUALLY FAIL HERE, and it took a mutation to
    // find that out (ARM 4 in the ledger). The obvious phrasing – «the lag does not move when the
    // wants draw is taken first, or five times» – is VACUOUS in this engine: `rngFromSeed` hands back
    // a FRESH stream on every call, so two functions that each derive their own can never shift each
    // other however many reads either one takes. That test stayed green with both draws folded onto
    // one key.
    //
    // What a shared key DOES produce is a CORRELATION: both facts are then read off the same first
    // uniform, and for an open girl `lag === 0` would become a strict consequence of `wants === own`.
    // So the honest behavioural net is the conditional p-zero, measured on both sides of the wants
    // split and required to agree.
    //
    // ⚠ RE-AIMED 11.09.2026, NOT WEAKENED – and the move made this net STRONGER, which is worth
    // writing down rather than leaving as luck. The open p-zero went 0.45 -> 0.70 (§4's lag row moved
    // on the census miss, the owner's ruling) and `wantsOwnRegister` is 0.70, so for an OPEN girl the
    // two thresholds now coincide: under a shared key the two facts would not merely correlate, they
    // would be the SAME EVENT, and the conditional p-zero would read 1.0 against 0.0. The gap bar is
    // unchanged at 0.06 – the same tightness, on a net that now has a wider failure to catch.
    for (const temperament of TEMPERAMENTS) {
      const own = temperamentOpenness(temperament)
      const drawn = WEEKS.map((w) => ({
        own: drawPartnerWants('independence', w, temperament) === own,
        zero: drawRawLag('independence', w, own) === 0,
      }))
      const share = (group: boolean): number => {
        const rows = drawn.filter((d) => d.own === group)
        expect(rows.length, `${temperament}: both sides of the split are populated`).toBeGreaterThan(800)
        return rows.filter((d) => d.zero).length / rows.length
      }
      const gap = Math.abs(share(true) - share(false))
      expect(gap, `${temperament}: p-zero differs by ${gap} across the wants split`).toBeLessThan(0.06)
    }
  })

  it('⭐⭐ the shave: close shortens, steady halves, strained and cold pay in full', () => {
    expect(LIFE.bondShave).toEqual({ close: 3, steady: 2, strained: 1, cold: 1 })
    for (let raw = 0; raw <= 12; raw++) {
      expect(shaveLag(raw, 'close')).toBe(Math.floor(raw / 3))
      expect(shaveLag(raw, 'steady')).toBe(Math.floor(raw / 2))
      expect(shaveLag(raw, 'strained')).toBe(raw)
      expect(shaveLag(raw, 'cold')).toBe(raw)
    }
    // The one concrete case the brief names, spelled out so the table above cannot be read past:
    expect(shaveLag(12, 'close')).toBe(4)
    expect(shaveLag(12, 'steady')).toBe(6)
    expect(shaveLag(12, 'cold')).toBe(12)
  })

  it('⭐ the shave is MONOTONE in the band for every raw lag this wave can draw', () => {
    const BANDS: BondBand[] = ['close', 'steady', 'strained', 'cold']
    for (let raw = 0; raw <= 12; raw++) {
      const [close, steady, strained, cold] = BANDS.map((b) => shaveLag(raw, b))
      expect(close, `raw ${raw}`).toBeLessThanOrEqual(steady)
      expect(steady, `raw ${raw}`).toBeLessThanOrEqual(strained)
      expect(strained, `raw ${raw}`).toBe(cold)
      expect(close, `raw ${raw}: a shave never invents time`).toBeLessThanOrEqual(raw)
    }
    // ...and it really does bite somewhere, so the monotone claim is not four equal numbers.
    expect(shaveLag(6, 'close')).toBeLessThan(shaveLag(6, 'strained'))
  })

  it('⭐⭐ `knownWeek >= sinceWeek` on every row the engine can produce', () => {
    let rows = 0
    for (const seed of SWEEP_SEEDS) {
      for (const temperament of TEMPERAMENTS) {
        const world = careerAt(`known-${seed}`, 0, temperament)
        const start = weekAtAge(world, 16)
        for (let w = start; w < start + 300; w++) {
          const row = rollFresh(world, w)
          if (row === null) continue
          rows++
          expect(row.knownWeek, `${seed}/${temperament} week ${w}`).not.toBeNull()
          expect(row.knownWeek!).toBeGreaterThanOrEqual(row.sinceWeek)
          expect(row.knownWeek! - row.sinceWeek, 'and never longer than the raw ceiling').toBeLessThanOrEqual(LIFE.lag.private.max)
        }
      }
    }
    expect(rows, 'the sweep saw real rows').toBeGreaterThan(100)
  })

  it('⚠⚠ INPUT-INDEPENDENCE: `sinceWeek` is identical across bonds, `knownWeek` deliberately is not', () => {
    // The whole story of the wave in one case. The DRAW is keyed on (seed, calendar), so the week
    // someone appears cannot be moved by anything the player did; the SHAVE is a pure function of the
    // relationship he built, so the week he HEARS about it can be. That split is what lets a bond
    // affect disclosure without a player choice ever re-rolling the world's dice.
    const close = careerAt('input-independence', 0, 'deep')
    const cold = careerAt('input-independence', 0, 'deep')
    close.bond = 95
    cold.bond = 10
    const start = weekAtAge(close, 18)
    const since: number[][] = [[], []]
    const known: number[][] = [[], []]
    let moved = 0
    // ⚠ A LONG SWEEP BECAUSE `deep` IS THE RAREST GIRL IN THE TABLE (×0.5, so ~1.25%/wk as an
    // adult) and she is the one this case needs: her register is `private`, whose raw lags run
    // 2..12, and a shave has to have something to bite on.
    for (let w = start; w < start + 1500; w++) {
      const a = rollFresh(close, w)
      const b = rollFresh(cold, w)
      if (a === null || b === null) {
        expect(a === null, `week ${w}: the two runs agree on WHETHER`).toBe(b === null)
        continue
      }
      since[0].push(a.sinceWeek)
      since[1].push(b.sinceWeek)
      known[0].push(a.knownWeek!)
      known[1].push(b.knownWeek!)
      if (a.knownWeek !== b.knownWeek) moved++
      expect(a.wants, 'her own preference is hers, not his').toBe(b.wants)
      expect(a.knownWeek!, 'a close home never hears LATER').toBeLessThanOrEqual(b.knownWeek!)
    }
    expect(since[0].length, 'there were arrivals to compare').toBeGreaterThan(8)
    expect(since[1], '⚠ the week someone appears cannot be moved by a player').toEqual(since[0])
    expect(moved, '⚠ ...and the week he HEARS about it can be, which is the design').toBeGreaterThan(0)
  })
})
