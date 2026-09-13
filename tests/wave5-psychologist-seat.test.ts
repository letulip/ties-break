// =================================================================================================
// WAVE 5, T2 – THE SEAT: A MAN ON A RETAINER WHO DOES NOTHING YET
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T2, the ruled shape from
// `docs/plans/the-travelling-team-2026-08.md` §2 (ruling Б – remote, salary only) and the roster
// from `docs/specs/the-psychologists-year-2026-09.md` §3.
//
// ⚠⚠ WHAT THIS STEP IS, SAID ONCE, BECAUSE EVERY SECTION BELOW IS ABOUT ITS EDGES. T2 ships a hire,
// a roster dial, a weekly bill and a stand-down pair. It ships NO EFFECT AT ALL: the focus command
// and its consent gates are T3, the recovery slope T4, the composure walk T5, the listen draw T6,
// the walls T7, the counsel beat T8. That is the wave's design and not an unfinished step – his
// effects arrive per focus – so the one thing this file can be about is whether the MONEY and the
// WEEKS are honest before anything is bought with them.
//
// ⚠ IT ASSERTS PLAYER-FACING SENTENCES ONLY WHERE THE ENGINE IS THE AUTHOR OF THEM AND A SECOND
// SURFACE HAS TO AGREE (`PSYCHOLOGIST_LOCKED_DETAIL`, the feed row's text). Every one of those is a
// DRAFT (CLAUDE.md invariant 4) and the pin asserts identity between two readers rather than the
// prose itself, so the architect's вычитка moves the string and the test with it.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ⚠ SEVEN MUTATIONS, RUN 13.09.2026, CONTROL GREEN FIRST (24 passed here, 10 in
//   tests/component/psychologist-card.test.ts) AND RE-EDITED BACK BY HAND – never `git checkout` –
//   with each touched file's md5 checked back to pristine after every arm
//   (psychologist.ts 4b26fd25…, coachMarket.ts 6c6606ae…). The counts below are MEASURED:
//
//     ARM 1  7 RED      ARM 2  3 RED      ARM 3  2 RED      ARM 4  1 RED
//     ARM 5  1 RED      ARM 6  3 RED (2 unit + 1 component) ARM 7  1 RED
//
//   ARM 1  ⚠⚠ THE ZERO-DRAW CLAIM (wave-4 §0.1 is THE LAW for this one, and the brief re-states it:
//          «a salary is a negotiated number; nothing in this leaf may touch any RNG stream»). The
//          mutation: `resolvePsychologist` prices the week from a corridor instead of the rung –
//          `medicalBillCents(world, rngFromSeed(`${world.seed}:psy:${world.week}`), [c, c])` – which
//          is the physio's own shape and therefore the most plausible wrong thing to write here.
//          ⚠⚠ **7 RED WHERE THREE WERE PREDICTED, AND THE FOUR EXTRA ARE THE SECTION SHAPE WORKING.**
//          §B's three went red as written («the whole seat, start to finish, on no stream at all:
//          expected [ 'psy-zero:psy:300' ] to deeply equal []», the 52-week case with its 52 keys,
//          and – the one worth reading – THE POSITIVE CONTROL'S OWN first assertion, which counts
//          the seat before it counts the physio). The four unpredicted reds are every place the
//          charge is asserted to be EXACTLY the retainer – §C's two suspend cases, §C's board-week
//          case and §D's ledger row («expected -21308 to be -20000») – because a jitter makes the
//          bill a number nobody can read off the card, which is the same defect measured in money
//          instead of in keys.
//          ⚠ A STREAM-ALIGNMENT COMPARISON WOULD HAVE STAYED GREEN UNDER IT, which is why there
//          isn't one: every key carries its own week, so a new per-week key shifts no other week's
//          value. §B holds the keys in an array the leaf cannot see, and its LAST case is the
//          positive control that makes «no keys» mean the gate is silent rather than the recorder
//          being broken.
//
//   ARM 2  `psychologistWorksInWeek` returns `hired` alone (both stand-downs deleted) – the shape a
//          remote seat invites, since «he never travels» is one short step from «nothing stands him
//          down». **3 RED**: the mirror table («hired=true frozen=false bookedOff=true: expected true
//          to be false») and both suspend cases' WORK half.
//
//   ARM 3  the college half only: `hired && !bookedOff`. This is the arm that matters, because a
//          seat whose retainer keeps billing through a four-year freeze is money leaving the wallet
//          for a girl the programme has. **2 RED**: the mirror table on the frozen row, and the
//          college case. ⚠ The FAMILY-WEEK case stays green under it, which is exactly why the pair
//          is pinned as a pair and not as one predicate.
//
//   ARM 4  `hirePsychologist(world, false)` nulls `psychologistFocus` – the «tidy up on the way out»
//          edit the field's own doc comment forbids, because it would make fire-and-re-hire a free
//          way round T3's once-a-season rule. **1 RED** – §A's dead-letter case, «the year he was
//          working survives the release: expected null to be 'coolhead'».
//
//   ARM 5  `setPsychologistRung` drops the roster check (`const chosen = rungs[rung]` with no
//          guard) – a stale screen buying a person the market does not have. **1 RED** – §A's
//          validation case, on the first bad index it reaches («rung -1 is not on the roster»).
//
//   ARM 6  `householdWeekly`'s `staffCents` loses the psychologist term – the household strip going
//          back to describing a payroll it is one seat short of, which is round 28 #8's original
//          defect («his masseur was $525 a week of it and was nowhere in the figure») repeated one
//          seat later. **3 RED** – §D's two arithmetic cases here («expected +0 to be 20000») and
//          §7 of tests/component/psychologist-card.test.ts, where the rendered strip does not move
//          at all. ⚠ THE COMPONENT RED IS THE ONE THAT MATTERS: it is the only arm measured on the
//          surface a parent actually reads.
//
//   ARM 7  the hire gate deleted outright – a junior career putting a specialist on the payroll.
//          **1 RED** – §A's locked case.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's and wave 4's §B apparatus, verbatim and for its
// reason. Every call is delegated to the real `rngFromSeed`, so any number this file measures is the
// engine's own; the mock exists only so §B can COUNT the keys the seat reached. Hoisted, because
// `vi.mock`'s factory is lifted above the imports.
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
  CAREER_ENDED_REFUSAL,
  COLLEGE_FREEZE_REFUSAL,
  PSYCHOLOGIST_CHANGE_KEY,
  PSYCHOLOGIST_LOCKED_DETAIL,
  createWorld,
  hirePsychologist,
  masseurWorksInWeek,
  psychologistRungOf,
  psychologistUnlocked,
  psychologistWeeklyCents,
  psychologistWorksInWeek,
  psychologistWorksThisWeek,
  resolvePhysio,
  resolvePsychologist,
  setPsychologistRung,
  toSnapshot,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

/** A junior career – the seat is locked, which is the state every career starts in. */
function junior(seed: string): WorldState {
  return createWorld(seed, DEFAULT_PROFILE)
}

/** ...and a professional one. The door is her first counting W-series result on the never-pruned
 *  mark, which is exactly what `psychologistUnlocked` reads – the same fixture the masseur's card
 *  test opens the pro arm with, so the two seats are proven to share ONE gate rather than to have
 *  two that happen to agree. */
function pro(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

/** The expense rows this week's charge wrote, by their text. */
function salaryRows(world: WorldState) {
  return world.events.filter((e) => e.type === 'expense' && e.text === 'Psychologist – weekly salary')
}

// =================================================================================================
// A. THE GATE, THE GUARDS AND THE DIAL
// =================================================================================================
describe('wave 5 T2 A – the hire, the gate and the roster dial', () => {
  it('⭐ the door is the MASSEUR`S DOOR – her first counting W-series result, and not a second gate', () => {
    expect(psychologistUnlocked(junior('psy-gate-junior'))).toBe(false)
    expect(psychologistUnlocked(pro('psy-gate-pro'))).toBe(true)
  })

  it('⭐ a junior career cannot hire, and the refusal IS the sentence the card prints', () => {
    const world = junior('psy-locked')
    expect(() => hirePsychologist(world, true)).toThrow(PSYCHOLOGIST_LOCKED_DETAIL)
    expect(world.psychologistHired, 'and the refusal left nothing behind').toBe(false)
    // The R10-16 one-story doctrine, as an identity rather than as a prose assertion: whatever the
    // вычитка makes of this draft, the thrown sentence and the exported constant are one string.
    expect(PSYCHOLOGIST_LOCKED_DETAIL.length, 'the constant is real, so the throw above is not vacuous')
      .toBeGreaterThan(0)
  })

  it('⭐ the hire writes ONE kept, tagged row – the coach`s COACH_CHANGE_KEY trick, week in the key', () => {
    const world = pro('psy-hire-row')
    world.week = 400
    hirePsychologist(world, true)
    expect(world.psychologistHired).toBe(true)
    const rows = world.events.filter((e) => e.milestoneKey === `${PSYCHOLOGIST_CHANGE_KEY}400`)
    expect(rows.length, 'exactly one row per hire').toBe(1)
    expect(rows[0].keep, 'kept, so «when did this arrangement start» stays a read over the ledger').toBe(true)
    expect(rows[0].amountCents, 'the HIRE is not a purchase – the salary is the bill').toBeUndefined()
  })

  it('the hire is idempotent in both directions – asking for the state it is in writes nothing', () => {
    const world = pro('psy-idempotent')
    const before = world.events.length
    hirePsychologist(world, false)
    expect(world.events.length, 'firing a seat nobody holds is a no-op').toBe(before)
    hirePsychologist(world, true)
    const afterHire = world.events.length
    hirePsychologist(world, true)
    expect(world.events.length, 'and so is hiring one already hired').toBe(afterHire)
  })

  it('⭐⭐ FIRING KEEPS THE FOCUS AS A DEAD LETTER – the field is not tidied up on the way out', () => {
    // The brief's own rule and `state.ts`'s note on the field: re-hiring mid-season resumes the year
    // that was already started, and T3's season guard still refuses a CHANGE. A field cleared on
    // fire would make «fire and re-hire» a free way round a once-a-season rule.
    const world = pro('psy-dead-letter')
    hirePsychologist(world, true)
    world.psychologistFocus = 'coolhead'
    world.psychologistFocusSeason = 3
    hirePsychologist(world, false)
    expect(world.psychologistHired).toBe(false)
    expect(world.psychologistFocus, 'the year he was working survives the release').toBe('coolhead')
    expect(world.psychologistFocusSeason, '...and so does the season that priced it').toBe(3)
    hirePsychologist(world, true)
    expect(world.psychologistFocus, 'and a re-hire resumes it rather than asking again').toBe('coolhead')
  })

  it('⭐ firing is ALWAYS allowed – the un-hire path asks the unlock gate nothing', () => {
    // «A family that cannot pay has to be able to stop paying» (the coach's shape through the
    // masseur's). Proven on a world whose gate reads FALSE while the seat is held – which a career
    // cannot reach forwards, and is exactly why the code must not consult the gate on the way out.
    const world = pro('psy-fire-always')
    hirePsychologist(world, true)
    world.bestFinishByTier = { ...world.bestFinishByTier, w15: undefined } as WorldState['bestFinishByTier']
    expect(psychologistUnlocked(world), 'the gate really is shut in this fixture').toBe(false)
    expect(() => hirePsychologist(world, false)).not.toThrow()
    expect(world.psychologistHired).toBe(false)
  })

  it('⚠ the college freeze refuses with the COLLEGE sentence, and the ended career with the ended one', () => {
    // `guardNotEnded` FIRST, and no second guard and no second sentence are built in this leaf – the
    // masseur's own order. The college string already exists; this wave writes no new one for it.
    const frozen = pro('psy-frozen')
    frozen.ending = { type: 'college', week: frozen.week, ageYears: 19, detail: 'on the scholarship', resumesWeek: frozen.week + 52 }
    expect(() => hirePsychologist(frozen, true)).toThrow(COLLEGE_FREEZE_REFUSAL)
    expect(() => setPsychologistRung(frozen, 2)).toThrow(COLLEGE_FREEZE_REFUSAL)

    const done = pro('psy-ended')
    done.ending = { type: 'natural', week: done.week, ageYears: 31, detail: 'the last season', resumesWeek: null }
    expect(() => hirePsychologist(done, true)).toThrow(CAREER_ENDED_REFUSAL)
    expect(() => setPsychologistRung(done, 2)).toThrow(CAREER_ENDED_REFUSAL)
  })

  it('⭐ the dial re-validates against the roster – three rungs, and nothing else is buyable', () => {
    const world = pro('psy-rung-validate')
    expect(ECONOMY.psychologist.rungs.length, 'the roster is the spec`s three').toBe(3)
    for (const bad of [-1, 3, 99, 1.5, Number.NaN]) {
      expect(() => setPsychologistRung(world, bad), `rung ${bad} is not on the roster`).toThrow()
    }
    expect(world.psychologistRung, 'and not one refusal moved the field').toBe(
      ECONOMY.psychologist.defaultRung,
    )
    setPsychologistRung(world, 2)
    expect(world.psychologistRung).toBe(2)
    expect(psychologistWeeklyCents(world)).toBe(ECONOMY.psychologist.rungs[2].salaryCents)
  })

  it('the dial is allowed AT ANY TIME – only the FOCUS is season-guarded, and that guard is T3`s', () => {
    // The masseur dial's precedent taken deliberately (O1 is about what he WORKS ON, not who he is).
    // Works with or without a live hire; only a HIRED change writes a ledger line, because only then
    // does the bill move.
    const world = pro('psy-rung-anytime')
    const beforeUnhired = world.events.length
    setPsychologistRung(world, 0)
    expect(world.psychologistRung, 'a stance recorded before the hire simply prices the card').toBe(0)
    expect(world.events.length, '...and says nothing, because no bill moved').toBe(beforeUnhired)
    hirePsychologist(world, true)
    const beforeHired = world.events.length
    setPsychologistRung(world, 2)
    expect(world.events.length, 'a HIRED change writes its line').toBe(beforeHired + 1)
    setPsychologistRung(world, 2)
    expect(world.events.length, '...and re-choosing the same rung writes nothing').toBe(beforeHired + 1)
  })

  it('⚠ a hand-built probe world with an impossible rung falls back to the default, never to a crash', () => {
    // `masseurRungOf`'s identity-element discipline, asked of an index: the field is validated at its
    // one writer, but the freeze tooling and the benches build worlds by hand.
    const world = pro('psy-rung-probe')
    ;(world as unknown as { psychologistRung: number }).psychologistRung = 7
    expect(psychologistRungOf(world)).toBe(ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung])
  })

  it('⭐ the roster prices rise strictly with the rung – the ladder the spec §3 bars are read against', () => {
    const cents = ECONOMY.psychologist.rungs.map((r) => r.salaryCents)
    expect(cents[1]).toBeGreaterThan(cents[0])
    expect(cents[2]).toBeGreaterThan(cents[1])
    // ⚠ NOT AN ACCEPTANCE BAR. Whether each rung is measurably BETTER than the one below at the
    // chosen focus is T10's 4x3 grid (the masseur §4 law, applied per focus); all this asserts is
    // that the ladder is a ladder, so a re-price cannot silently invert it.
  })

  it('⚠ ruling Б and O3, in the code rather than in a grep: no fare and no results share exist for him', () => {
    // The union stays exactly two roles – `staffResultShareBps` reads `ECONOMY.staffShare`, and a
    // third key appearing here is what «he takes a share» would look like from inside the engine.
    expect(Object.keys(ECONOMY.staffShare).sort()).toEqual(['coach', 'masseur'])
    // And the seat's own constants hold no fare of any kind.
    //
    // ⚠⚠ RE-AIMED BY T4 AND NOT WEAKENED, and the sentence it replaces is why. As T2 wrote it the
    // list was `['defaultRung', 'rungs']` – true of a seat whose four FOCUS TABLES had not landed
    // yet, and the block's own note said in as many words that they «land with the passes that READ
    // them». T4 is the first of those passes, so `recoverySlope` joins here and `coolheadPerSeason`
    // (T5), `listenClarity` (T6) and the walls' hazard scale (T7) will join it in turn.
    // ⚠ RE-AIMED AGAIN BY T5, WHICH IS THE LINE ABOVE COMING TRUE ON SCHEDULE: `coolheadPerSeason`
    // joins WITH its reader (`growWeek`'s own term, engine/development.ts) in the same commit, which
    // is the rule this block is keeping – a constant lands with the pass that reads it. Two remain.
    // ⚠ AND A THIRD TIME BY T6, on the same schedule and under the same rule: `listenClarity` joins
    // WITH its reader (`drawListenHeard`, engine/world/lifeBeat.ts §3f) in the same commit. ONE
    // remains – the walls' beyond-baseline hazard scale, T7's.
    //
    // ⚠⚠ AND A FOURTH TIME BY T7, WHICH IS THE LAST OF THEM AND THE ONE THAT ARRIVED THREE WIDE
    // RATHER THAN ONE. `wallsHazardScale` is the key the note above was waiting for; `wallsRetentionSlow`
    // (O6) and `wallsHerselfRepair` land beside it because they are the OTHER two things that are
    // genuinely the SEAT's in the walls model, and all three come with their one reader – `driftWalls`,
    // engine/spirit.ts §4 – in the same commit, which is the rule this block has been keeping all wave.
    //
    // ⚠⚠ AND WHAT DID **NOT** ARRIVE IS THE HALF WORTH PINNING, so it is pinned below rather than
    // described. The wave-5 brief's §4 gives this block as the home for every walls constant; T7
    // departed from that on purpose and the departure is now mechanical. The SEVEN universal walls
    // numbers – the rise, the repair, the growth, the two thresholds, the hazard and the cap – live in
    // `ECONOMY.life.walls`, because they are read on EVERY career including the great majority that
    // never hire anybody: walls rise from neglect itself and repair is FREE (§2a, and the wave brief's
    // own §0.3). A constant whose reader runs on a seatless career, filed under the seat's price list,
    // would read as a paywall in the one place the layer's law says there is none.
    //
    // ⭐ THE CLAIM IS UNCHANGED AND STILL EXACT: the list is still a closed set, so a fare, a stance
    // or a share landing in this block is still red on the line below – which is the whole of what
    // ruling Б and O3 need from it. What is NOT re-aimed is the `staffShare` line above: that one is
    // about a union this wave may never widen, and it stays at two roles for ever.
    expect(Object.keys(ECONOMY.psychologist).sort()).toEqual([
      'coolheadPerSeason',
      'defaultRung',
      'listenClarity',
      'recoverySlope',
      'rungs',
      'wallsHazardScale',
      'wallsHerselfRepair',
      'wallsRetentionSlow',
    ])
    // ⭐⭐ THE SPLIT, MADE MECHANICAL. Every walls key in the SEAT's block is a multiplier on something
    // the free model already does; not one of them is a rate, a threshold or a cap the model needs to
    // run. Asserted from both ends, so a later editor cannot «tidy» the universal constants in here.
    const seatWalls = Object.keys(ECONOMY.psychologist).filter((k) => k.startsWith('walls'))
    expect(seatWalls.sort(), 'the seat owns exactly its three multipliers')
      .toEqual(['wallsHazardScale', 'wallsHerselfRepair', 'wallsRetentionSlow'])
    expect(Object.keys(ECONOMY.life.walls).sort(), '...and the model\'s own seven live one block over')
      .toEqual([
        'flipArm',
        'flipHazardPerWeek',
        'flipRelease',
        'growthPerWeek',
        'leanMax',
        'repairPerWeek',
        'risePerWeek',
      ])
    // ⚠ AND THE ONE THAT MAKES «REPAIR IS FREE» A PROPERTY OF THE CONSTANTS AND NOT ONLY OF THE CODE:
    // no key of the seat's block is named for the repair or the rise themselves – it may only scale
    // them. `wallsHerselfRepair` is the acceleration and `wallsRetentionSlow` the slow-down; a
    // `repairPerWeek` or a `risePerWeek` appearing here would mean the walk home had moved indoors.
    expect(seatWalls.filter((k) => k === 'wallsRepairPerWeek' || k === 'wallsRisePerWeek'), '§0.3')
      .toEqual([])
    // ⚠ AND THE NEGATIVE SAID AS A NEGATIVE, so the growing list above cannot quietly admit the one
    // thing it exists to refuse: no key of this seat's block may name a fare, a trip or a share.
    expect(Object.keys(ECONOMY.psychologist).filter((k) => /fare|travel|share|board/i.test(k)), 'ruling Б')
      .toEqual([])
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS – ON ANY STREAM, IN EVERY ARM, WITH A POSITIVE CONTROL THAT PROVES THE COUNTER
// =================================================================================================
//
// ⚠⚠ THE SHAPE IS NOT A PREFERENCE. The wave-4 brief's §0.1 made wave 3's third-instance finding the
// law for every zero-draw claim: «prove eligibility short-circuits with a key COUNTER the code cannot
// see, plus a positive control». Here the claim is STRONGER than a short-circuit – this leaf must
// never reach a stream at all, in any arm – so the counter is unfiltered and the assertion is `[]`
// rather than «one key».
//
// ⚠ AND THE ALIGNMENT COMPARISON THE CLAIM INVITES WOULD PROVE NOTHING: a salary is not drawn from a
// per-week key, so two worlds walked side by side would agree under a mutation that added one. The
// array below lives where `psychologist.ts` cannot see it.
describe('wave 5 T2 B – the seat takes ZERO draws, on any stream', () => {
  beforeEach(() => {
    rngKeys.length = 0
  })

  it('⭐⭐ hire, fire, rung change, charge and both stand-downs – not one key between them', () => {
    const world = pro('psy-zero')
    world.week = 300
    rngKeys.length = 0 // `createWorld` legitimately derives a dozen; this section is about the seat.

    hirePsychologist(world, true)
    setPsychologistRung(world, 0)
    setPsychologistRung(world, 2)
    resolvePsychologist(world) // the charge, on a week he works
    expect(psychologistWorksThisWeek(world), 'the charge arm really ran').toBe(true)

    world.college = { fromWeek: 299, untilWeek: 500, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    resolvePsychologist(world) // suspended by the freeze
    world.college = null
    world.vacations = [{ week: 300, packageId: 'x', paidCents: 0 }]
    resolvePsychologist(world) // suspended by the booked family week
    world.vacations = []
    hirePsychologist(world, false)
    resolvePsychologist(world) // nobody on the payroll

    expect(rngKeys, 'the whole seat, start to finish, on no stream at all').toEqual([])
  })

  it('⭐⭐ ...and not over a WHOLE SEASON of billed weeks either', () => {
    // The single-week case above could pass on a leaf that draws on one particular week.
    const world = pro('psy-zero-season')
    hirePsychologist(world, true)
    rngKeys.length = 0
    for (let w = 300; w < 352; w++) {
      world.week = w
      resolvePsychologist(world)
    }
    expect(salaryRows(world).length, '52 weeks really were billed').toBe(52)
    expect(rngKeys, '...and not one of them reached a stream').toEqual([])
  })

  it('⭐⭐ THE POSITIVE CONTROL – the physio`s charge, on the same world and the same counter, DOES draw', () => {
    // ⚠⚠ WITHOUT THIS THE TWO CASES ABOVE ARE UNFALSIFIABLE. `resolvePhysio` is the neighbouring
    // staff charge in the very same weekly pass and it prices the week from a corridor
    // (`seed:physio:<week>`), so it is the instrument's own proof that a salary-charging sibling
    // WOULD have been counted. A recorder that cannot see this one cannot see anything.
    const world = pro('psy-zero-control')
    world.week = 300
    world.physioActive = true
    hirePsychologist(world, true)
    rngKeys.length = 0
    resolvePsychologist(world)
    expect(rngKeys, 'the seat, again, silent').toEqual([])
    resolvePhysio(world)
    expect(rngKeys, 'and the physio beside it, counted').toEqual([`${world.seed}:physio:300`])
  })
})

// =================================================================================================
// C. ⚠⚠ THE SUSPEND PAIR – SUSPENDS, DOES NOT CANCEL, IN BOTH HALVES
// =================================================================================================
//
// The brief: «read `masseurWorksThisWeek` AND `resolveMasseur` together before you write it:
// suspends, does not cancel». There are therefore TWO halves and a test that pins one of them is
// half a test: the WORK half (the seat stands down) and the BILLING half (the week charges nothing),
// and across both of them the HIRE survives untouched and comes back by itself.
describe('wave 5 T2 C – the stand-down pair, mirrored and not re-derived', () => {
  it('⭐⭐ the primitive form agrees with `masseurWorksInWeek` on all EIGHT inputs', () => {
    // «MIRRORED byte-for-byte in shape» as a measurement rather than as a claim about the source: if
    // one seat's rule is ever edited without the other's, this is the case that says so – which is
    // the whole reason the two are deliberately two predicates and not one.
    for (const hired of [false, true]) {
      for (const frozen of [false, true]) {
        for (const bookedOff of [false, true]) {
          expect(
            psychologistWorksInWeek(hired, frozen, bookedOff),
            `hired=${hired} frozen=${frozen} bookedOff=${bookedOff}`,
          ).toBe(masseurWorksInWeek(hired, frozen, bookedOff))
        }
      }
    }
    expect(psychologistWorksInWeek(true, false, false), 'and the table is not uniformly false').toBe(true)
  })

  it('⭐⭐ A COLLEGE WEEK stands the seat down, charges nothing, and the hire SURVIVES the freeze', () => {
    const world = pro('psy-college')
    hirePsychologist(world, true)
    world.week = 300
    world.college = { fromWeek: 250, untilWeek: 500, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    const fundsBefore = world.fundsCents

    expect(psychologistWorksThisWeek(world), 'the WORK half – he is stood down').toBe(false)
    resolvePsychologist(world)
    expect(world.fundsCents, 'the BILLING half – nothing left the wallet').toBe(fundsBefore)
    expect(salaryRows(world).length, '...and nothing was said about it').toBe(0)
    expect(world.psychologistHired, '⭐ SUSPENDED, NOT CANCELLED – the flag survives').toBe(true)

    // ...and it comes back by itself the week the freeze ends. That is the other half of «suspends».
    world.week = 500
    expect(psychologistWorksThisWeek(world)).toBe(true)
    resolvePsychologist(world)
    expect(fundsBefore - world.fundsCents).toBe(psychologistWeeklyCents(world))
    expect(salaryRows(world).length).toBe(1)
  })

  it('⭐⭐ A BOOKED FAMILY WEEK does the same, and the hire survives that too', () => {
    const world = pro('psy-vacation')
    hirePsychologist(world, true)
    world.week = 300
    world.vacations = [{ week: 300, packageId: 'beach', paidCents: 50_00 }]
    const fundsBefore = world.fundsCents

    expect(psychologistWorksThisWeek(world), 'the WORK half').toBe(false)
    resolvePsychologist(world)
    expect(world.fundsCents, 'the BILLING half').toBe(fundsBefore)
    expect(salaryRows(world).length).toBe(0)
    expect(world.psychologistHired, 'SUSPENDED, NOT CANCELLED').toBe(true)

    world.week = 301
    expect(psychologistWorksThisWeek(world), 'the week after the holiday he is back').toBe(true)
    resolvePsychologist(world)
    expect(fundsBefore - world.fundsCents).toBe(psychologistWeeklyCents(world))
  })

  it('⚠ THERE IS NO THIRD STAND-DOWN, and the two the masseur has that he does not are the point', () => {
    const world = pro('psy-no-third')
    hirePsychologist(world, true)
    world.week = 300
    // ⚠ HE WORKS THROUGH A LAYOFF – an injury is when the head needs the call most, so it is
    // deliberately not a stand-down (the masseur's reason in its own key).
    world.injury = { sinceWeek: 298, weeksRemaining: 8, totalWeeks: 10, severity: 'moderate', kind: 'knee', weeksSaved: 0 } as WorldState['injury']
    expect(psychologistWorksThisWeek(world), 'a layoff does not stand him down').toBe(true)
    world.injury = null

    // ⚠⚠ AND HE DOES NOT BOARD, SO THE MASSEUR'S BOARD-WEEK STAND-DOWN HAS NO TWIN. `resolveMasseur`
    // steps aside when `pendingTournament.masseurThere` is set, because the fare replaced the weekly
    // bill that week. Ruling Б means this seat has no such week: the retainer runs on a tournament
    // week exactly as the coach's does.
    const fundsBefore = world.fundsCents
    world.pendingTournament = { finished: false, masseurThere: true } as WorldState['pendingTournament']
    resolvePsychologist(world)
    expect(fundsBefore - world.fundsCents, 'a travel week bills him in full').toBe(
      psychologistWeeklyCents(world),
    )
  })

  it('nobody on the payroll is billed nothing, which is the arm every other case leans on', () => {
    const world = pro('psy-unhired')
    world.week = 300
    const fundsBefore = world.fundsCents
    expect(psychologistWorksThisWeek(world)).toBe(false)
    resolvePsychologist(world)
    expect(world.fundsCents).toBe(fundsBefore)
    expect(salaryRows(world).length).toBe(0)
  })
})

// =================================================================================================
// D. ⭐⭐ THE SNAPSHOT SEAM – the strip's OUT figure moves by EXACTLY the salary
// =================================================================================================
//
// `shared/protocol/snapshot.ts` promises at the head of `HouseholdView` that a seat added later
// «joins `outgoingCents` and NOTHING else has to move». ⚠ MEASURED RATHER THAN QUOTED, and the
// measurement corrected it: the promise cost ONE TERM in `householdWeekly`'s `staffCents`, because
// that figure NAMES its seats instead of totalling the week's `category: 'staff'` rows. Everything
// downstream – the type, `HouseholdStrip`, both tabs that mount it – did follow by itself. This
// section is what makes the corrected sentence a fact.
describe('wave 5 T2 D – the household strip follows the payroll', () => {
  it('⭐⭐ hiring moves `outgoingCents` by exactly the weekly retainer, and moves nothing else', () => {
    const world = pro('psy-household')
    const before = toSnapshot(world).coachBilling.household
    hirePsychologist(world, true)
    const after = toSnapshot(world).coachBilling.household

    expect(after.outgoingCents - before.outgoingCents, 'exactly the salary, to the cent').toBe(
      psychologistWeeklyCents(world),
    )
    expect(after.incomeCents, 'the IN figure is untouched').toBe(before.incomeCents)
    expect(after.upkeepCents).toBe(before.upkeepCents)
    expect(after.shelfCents).toBe(before.shelfCents)
    expect(after.netCents - before.netCents, '...so the net moves the other way by the same amount').toBe(
      -psychologistWeeklyCents(world),
    )
  })

  it('⭐ and a DEARER RUNG moves it by exactly the difference between the two', () => {
    const world = pro('psy-household-rung')
    hirePsychologist(world, true)
    setPsychologistRung(world, 0)
    const cheap = toSnapshot(world).coachBilling.household.outgoingCents
    setPsychologistRung(world, 2)
    const dear = toSnapshot(world).coachBilling.household.outgoingCents
    expect(dear - cheap).toBe(
      ECONOMY.psychologist.rungs[2].salaryCents - ECONOMY.psychologist.rungs[0].salaryCents,
    )
  })

  it('the SEAT`s card facts are the ENGINE`s and follow the world', () => {
    // ⚠⚠ THIS CASE SHIPPED AS «the FOUR card facts» AND T3 RE-AIMED IT – NOT WEAKENED, AND THE STORY
    // IS WORTH THE LINES. `psychologistFocus` was on the wire in T2's first draft, exactly as the
    // brief lists it, and `tests/snapshot-contract.test.ts` (E-07: «a Snapshot member with no reader
    // is a promise to the UI that nothing collects») named it, alone, as unread. So T2 shipped four
    // facts and this case pinned the absence with `'psychologistFocus' in idle === false`, saying in
    // its own words that «T3 brings it with its reader». T3 did: the chosen year, the set of years
    // the engine would accept this week and the sentence for whatever is closed, all read by the
    // focus row on the staff card. The negative is therefore RETIRED – it was a pin on a commit
    // boundary, and the boundary has been crossed – and what replaces it is the positive claim it
    // was standing in for: the seat's facts are the ENGINE's.
    //
    // ⚠ AND THE TITLE LOST ITS NUMBER ON THE HOUSE RULE (CLAUDE.md: «Count it, do not quote it»).
    // A count typed into a test name rots the moment a fact joins, which is exactly what happened
    // here one commit later – the same lesson round 24's own table wrote down at v76.
    const world = pro('psy-snapshot-facts')
    const idle = toSnapshot(world)
    expect(idle.psychologistHired).toBe(false)
    expect(idle.psychologistUnlocked).toBe(true)
    expect(idle.psychologistRung).toBe(ECONOMY.psychologist.defaultRung)
    expect(idle.psychologistSalaryCents).toBe(
      ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung].salaryCents,
    )
    // The year-focus and its two derived companions, arriving in T3 with the row that reads them.
    // What they DO is pinned in tests/wave5-psychologist-focus.test.ts §E; what matters here is that
    // an unhired seat carries an empty year, which is the state this file's whole world is in.
    expect(idle.psychologistFocus, 'nobody has been asked what the year is for').toBeNull()
    expect(idle.psychologistFocusOpen, 'and nothing is on offer without a hire').toEqual([])
    expect(idle.psychologistFocusDetail, '...so the row has nothing to explain').toBe('')
    expect(toSnapshot(junior('psy-snapshot-junior')).psychologistUnlocked, 'and the gate reaches the wire').toBe(false)

    hirePsychologist(world, true)
    setPsychologistRung(world, 2)
    const live = toSnapshot(world)
    expect(live.psychologistHired).toBe(true)
    expect(live.psychologistRung).toBe(2)
    expect(live.psychologistSalaryCents).toBe(ECONOMY.psychologist.rungs[2].salaryCents)
  })

  it('⭐ the weekly row is an EXPENSE in the `staff` category – which is what puts it in the OUT figure', () => {
    const world = pro('psy-row')
    hirePsychologist(world, true)
    world.week = 300
    resolvePsychologist(world)
    const rows = salaryRows(world)
    expect(rows.length).toBe(1)
    expect(rows[0].category).toBe('staff')
    expect(rows[0].amountCents).toBe(-psychologistWeeklyCents(world))
    expect(rows[0].week).toBe(300)
  })
})
