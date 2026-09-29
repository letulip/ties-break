// =================================================================================================
// B-08 · THE PRESENCE AXIS IS ONLY HONEST WHERE A ROOF WEEK EXISTS – THE REACHABILITY SWEEP
// (T3.11 of docs/plans/principles-fix-builder-2026-09.md, the owner's ruling 19; the finding is
//  B-08 in docs/review-principles-2026-09-26/02-engine-core.md, Lead 3's own sweep table)
// =================================================================================================
//
// WHAT WAS WRONG. Three of the life layer's voiced pools carried a presence axis – a `roof` line and
// an `away` line per temperament – on cards that only a girl of 23 or over can ever be shown:
// `'engaged'` (gated `ECONOMY.wedding.ageGate`), `'expecting'` (which needs the wedding LATCH, so
// later still) and `'bereavement'` (`ECONOMY.weight.bereavement.fromAgeYears`). Presence is derived
// from the life stage and from nothing else, and at 23 there is no roof stage left to be in: school
// is over by 18.92 for every girl the game can generate, and `diaryLifeStageFor` sends everyone past
// 22 to `independent` unless they are at `college`, which is away too. So twelve player-facing
// strings were carried, reviewed and pinned, and no career could ever show one of them.
//
// ⚠⚠ AND THE HAZARD RUNS THE OTHER WAY TOO, WHICH IS WHY THIS FILE IS A LAW AND NOT A CLEAN-UP.
// B-08's own words: «a completeness pin that demanded both columns would enforce writing more of
// them». The next pool keyed on presence behind a gate at 22 or over would be twelve more dead
// lines for the owner to read, and nothing in the tree could object. §C is the objection.
//
// ⚠ WHAT THIS DOES **NOT** LICENCE. Invariant 4: no string is reworded here. Twelve strings are
// REMOVED because no career can reach them, and every surviving line – the four `away` cells of each
// pool, both dry cards, both headings – is byte-identical. A removal that took a string a career CAN
// reach would be a wording change wearing a deletion, so §A measures the claim over the WHOLE profile
// space rather than arguing it, and §D asks the engine's own gate rather than my arithmetic.
//
// ⚠ NO RNG KEY AND NO DRAW COUNT MOVES. These pools are indexed by `[voice]` – a temperament, not a
// draw – so a pool that loses a presence axis is read by the same index on the same week from the same
// stream. `tests/life-beat-keys.test.ts` (B-07's inventory, landed first for exactly this reason)
// holds all twenty of `lifeBeat.ts`' keys character for character and did not move. The frozen MAIN
// capture (41550 / `e6b0c709`) is untouched.
//
// HOW EACH PART CAN FAIL, because a sweep that cannot fail is the family this repo has met twenty
// times:
//   §A  the arithmetic sweep, over every profile the clamp can hold × every week a career can reach ×
//       both college states. Its POSITIVE CONTROL is the same sweep at the arrival gate (16), where
//       roof weeks must be found in their thousands – a zero there would mean the loop is broken
//       rather than that the roof is unreachable.
//   §B  the collapsed pools answer the SAME line at all four stages. This is the half that was RED
//       before the fix, and the mutation arm (a `presenceLine(…)` read put back on one kind) is what
//       it is aimed at.
//   §C  the law, both directions: a pool that IS presence-sensitive must have a reachable roof, and a
//       pool that was collapsed must stay collapsed while its gate stays above the roof. The set of
//       presence-sensitive kinds is MEASURED and compared with a registry, so a fourteenth kind or a
//       new presence-keyed pool goes red here with «name your age gate».
//   §D  the engine's own predicates, not mine: on every roof week `weddingEligible` and
//       `bereavementEligible` refuse, and there is an away week where each says yes.
//
// MUTATION-VERIFIED: `presenceLine(BEREAVEMENT_HER_LINE[voice], presence)` restored (the pool typed
// back to `PresenceCell` with its roof cell) – §B and §C name it. Both outputs are in the wave's
// report.
import { describe, expect, it } from 'vitest'
import {
  bereavementEligible,
  createWorld,
  kidAgeExact,
  lifeBeatSaid,
  pregnancyEligible,
  weddingEligible,
  FORK_STOP_DRIVERS,
  FORK_WANTS,
  LEGACY_SMALL_TALK_SUBJECTS,
  SPOUSE_VIEW_OCCASIONS,
  setWeightEnabled,
  type WorldState,
} from '../src/engine/world'
import { schoolIsOver } from '../src/engine/kidLife'
import { diaryLifeStageFor } from '../src/engine/diary'
// ⚠ THE SINGLE COPY OF THE ROOF/AWAY RULE, ASKED DIRECTLY (`diary/words.ts:79`). R2-18 / ARCH-07's
// whole finding was that this rule had been written out three times; a sweep that re-typed
// `stage === 'college' || stage === 'independent'` would be the fourth copy and would agree with
// itself for ever.
import { awayVoice } from '../src/engine/diary/words'
import { ECONOMY } from '../src/engine/economy'
import { TEMPERAMENTS } from '../src/engine/spirit'
import type { BondBand, DiaryLifeStage, LifeBeatKind } from '../src/shared/protocol'

// =================================================================================================
// THE STAGE TABLE – exhaustive by the TYPE, so a fifth stage cannot slip past this file
// =================================================================================================
//
// ⚠ A `Record<DiaryLifeStage, …>` and not an array of four names: the day the diary gains a stage,
// `vue-tsc` refuses this file before any test runs, which is the cheapest possible tripwire. The
// values are checked against `awayVoice` below, so this table cannot drift from the rule either.
const STAGE_IS: Record<DiaryLifeStage, 'roof' | 'away'> = {
  school: 'roof',
  'after-school': 'roof',
  college: 'away',
  independent: 'away',
}
const STAGES = Object.keys(STAGE_IS) as readonly DiaryLifeStage[]
const ROOF_STAGES = STAGES.filter((s) => STAGE_IS[s] === 'roof')
const AWAY_STAGES = STAGES.filter((s) => STAGE_IS[s] === 'away')

/** Her own voice reaches the card on these two bands; the other two collapse to the flat dry card,
 *  which has no presence axis on any kind and so proves nothing either way. */
const OWN_VOICE_BANDS: readonly BondBand[] = ['close', 'steady']

// =================================================================================================
// EVERY KIND'S LEGAL DETAILS – exhaustive by the TYPE for the same reason as the stage table
// =================================================================================================
//
// ⚠ A LIST PER KIND AND NOT ONE VALUE. Four kinds read their `detail` and pick a pool with it
// (`'fork-opinion'`, `'small-talk'`, `'fork-counsel'`, `'fork-psy'`, `'spouse-view'`), and a
// presence axis could live in one column and not another – so §C measures over all of them. The
// values come from the engine's own exported vocabularies wherever one exists, never re-typed.
const DETAILS: Record<LifeBeatKind, readonly string[]> = {
  'fork-opinion': FORK_WANTS,
  met: ['p:900'],
  'small-talk': LEGACY_SMALL_TALK_SUBJECTS,
  'fork-counsel': FORK_STOP_DRIVERS,
  ended: ['p:900'],
  // ⚠ `'plain'` is the register `raiseLifeBeat`'s own call site defaults to when no shock is live
  // (`lifeBeat.ts:4904`), so this is the shipped reading rather than a hand-picked column.
  'fork-psy': FORK_STOP_DRIVERS.map((d) => `plain:${d}`),
  engaged: ['p:900'],
  'spouse-view': SPOUSE_VIEW_OCCASIONS,
  'own-key': ['own-key'],
  expecting: ['p:900'],
  'return-plan': ['return-plan'],
  bereavement: ['900'],
  divorced: ['p:900'],
}

// =================================================================================================
// THE REGISTRY – which pools keep a presence axis, and the age gate each one is judged against
// =================================================================================================
//
// ⚠⚠ THE GATES ARE READ OFF `ECONOMY`, NEVER TRANSCRIBED. H-19's lens from this review's own intake:
// «a fixture reads the constant it depends on and never restates it». A hard-coded 23 here would go
// on passing the day somebody lowers the wedding gate to 21 – which is precisely the day these pools
// need their roof column BACK, and §C is the only thing that would say so.
const PRESENCE_KEYED: Partial<Record<LifeBeatKind, { gate: number; why: string }>> = {
  met: { gate: ECONOMY.life.ageGate, why: 'the arrival gate – she is at school or after it at 16' },
  ended: { gate: ECONOMY.life.ageGate, why: 'an open episode, so never before the arrival gate' },
  // ⚠ NO AGE GATE AT ALL, AND IT IS A RULING RATHER THAN AN OMISSION: «she talks at any age»
  // (`rollSmallTalk`'s own note – `smallTalkEligible` must not acquire the arrival's gate).
  'small-talk': { gate: 0, why: 'no age gate by ruling – a child may bring a parent a worry' },
}

/** The four pools whose presence axis is GONE because no career can stand under a roof at their gate.
 *  `'divorced'` collapsed on 23.09 (his strings review, must-fix 1) and gains its first pin here; the
 *  other three are this task. */
const PRESENCE_COLLAPSED: Partial<Record<LifeBeatKind, { gate: number; why: string }>> = {
  engaged: { gate: ECONOMY.wedding.ageGate, why: 'weddingEligible refuses below it' },
  expecting: { gate: ECONOMY.wedding.ageGate, why: 'the latch needs an ANSWERED engaged row, so later still' },
  divorced: { gate: ECONOMY.wedding.ageGate, why: 'a latched episode, so never earlier than the wedding' },
  bereavement: { gate: ECONOMY.weight.bereavement.fromAgeYears, why: 'bereavementEligible refuses below it' },
}

// =================================================================================================
// §A – THE SWEEP: is there ANY week at or after an age gate that a roof stage can hold?
// =================================================================================================

/** Past every career: she starts at 14 (`START_AGE_YEARS`) and the tour has no rung left decades
 *  before this. The bound is deliberately absurd, because a bound that only just covers a career is
 *  a bound somebody has to re-measure. */
const LAST_WEEK = 2600

interface Reach {
  /** (profile, week, college-state) triples where her age was at or past the gate. */
  points: number
  /** The ones that landed on a ROOF stage, as readable rows – the first few only. */
  roof: string[]
  roofCount: number
}

const reachMemo = new Map<number, Reach>()

/** Every profile the clamp can hold (12 months x 31 days – `birthDate` clamps a day past the month's
 *  length, so this is the whole domain), every week to `LAST_WEEK`, and BOTH college states: a
 *  stronger sweep than a career, which holds one of them per week. */
function roofReach(minAgeYears: number): Reach {
  const hit = reachMemo.get(minAgeYears)
  if (hit !== undefined) return hit
  const out: Reach = { points: 0, roof: [], roofCount: 0 }
  for (let birthMonth = 1; birthMonth <= 12; birthMonth++) {
    for (let birthDay = 1; birthDay <= 31; birthDay++) {
      for (let week = 0; week <= LAST_WEEK; week++) {
        const age = kidAgeExact(week, birthMonth, birthDay)
        if (age < minAgeYears) continue
        const over = schoolIsOver(week, birthMonth)
        for (const inCollege of [false, true]) {
          out.points++
          const stage = diaryLifeStageFor(age, over, inCollege)
          if (awayVoice({ lifeStage: stage })) continue
          out.roofCount++
          if (out.roof.length < 5) {
            out.roof.push(`${birthMonth}/${birthDay} week ${week} age ${age.toFixed(2)} -> ${stage}`)
          }
        }
      }
    }
  }
  reachMemo.set(minAgeYears, out)
  return out
}

describe('B-08 §A – the reachability sweep over every stage an eligible week can hold', () => {
  it('⚠ the stage table agrees with the ONE copy of the roof/away rule', () => {
    // Without this the table above is a second reading of `awayVoice` and could drift from it.
    for (const stage of STAGES) {
      expect(awayVoice({ lifeStage: stage }), `${stage}`).toBe(STAGE_IS[stage] === 'away')
    }
    expect(ROOF_STAGES, 'two roof stages').toHaveLength(2)
    expect(AWAY_STAGES, 'two away stages').toHaveLength(2)
  })

  it('⭐⭐⭐ THE POSITIVE CONTROL FIRST: the sweep really finds roof weeks at the arrival gate', () => {
    // ⚠⚠ THIS CASE IS WHY THE ZERO BELOW IS A MEASUREMENT. A loop with an inverted condition, a
    // clamped profile domain or a bound that never reaches school would report «no roof week» for
    // every gate there is, and the collapse would rest on a broken sweep.
    const at16 = roofReach(ECONOMY.life.ageGate)
    expect(at16.points, 'the sweep visited weeks at the arrival gate').toBeGreaterThan(100_000)
    expect(at16.roofCount, 'roof weeks exist at 16 – `met` and `ended` keep their axis honestly')
      .toBeGreaterThan(1_000)
  })

  it('⭐⭐⭐ and NOT ONE roof week exists at the wedding gate, for any profile, in or out of college', () => {
    const gate = ECONOMY.wedding.ageGate
    const reach = roofReach(gate)
    expect(reach.points, 'the sweep visited weeks at this gate at all').toBeGreaterThan(100_000)
    expect(reach.roof, `a roof week exists at ${gate} – the roof cells are NOT dead copy`).toEqual([])
    expect(reach.roofCount, 'roof weeks at or past the wedding gate').toBe(0)
  })

  it('⭐⭐⭐ ...and none at the bereavement rung either', () => {
    const gate = ECONOMY.weight.bereavement.fromAgeYears
    const reach = roofReach(gate)
    expect(reach.points, 'the sweep visited weeks at this gate at all').toBeGreaterThan(100_000)
    expect(reach.roof, `a roof week exists at ${gate} – the roof cells are NOT dead copy`).toEqual([])
  })

  it('the roof closes at 22 and that is the rung the sweep is actually reading', () => {
    // ⚠ THE EDGE, NAMED. `diaryLifeStageFor` sends her to `independent` at 22, and school is over
    // long before – so 22 is the first whole year with no roof week. 21 must still have some, or the
    // two assertions above are measuring a cliff somewhere else entirely.
    expect(roofReach(21).roofCount, 'roof weeks at 21').toBeGreaterThan(0)
    expect(roofReach(22).roofCount, 'roof weeks at 22').toBe(0)
  })
})

// =================================================================================================
// §B – THE COLLAPSED POOLS SAY THE SAME THING AT EVERY STAGE
// =================================================================================================

/** Every line a kind can produce in HER OWN VOICE at one stage, over every voice and legal detail. */
function saidAt(kind: LifeBeatKind, stage: DiaryLifeStage): Map<string, string> {
  const out = new Map<string, string>()
  for (const voice of TEMPERAMENTS) {
    for (const detail of DETAILS[kind]) {
      for (const bond of OWN_VOICE_BANDS) {
        out.set(`${voice}/${detail}/${bond}`, lifeBeatSaid(kind, detail, voice, 'level', bond, 'open', stage))
      }
    }
  }
  return out
}

/** MEASURED, never read off the source: does this kind's line move when only the stage moves? */
function presenceSensitive(kind: LifeBeatKind): boolean {
  const base = saidAt(kind, ROOF_STAGES[0])
  for (const stage of STAGES.slice(1)) {
    const other = saidAt(kind, stage)
    for (const [key, line] of base) if (other.get(key) !== line) return true
  }
  return false
}

describe('B-08 §B – a pool behind a 23+ gate reads no stage at all', () => {
  for (const [kind, { gate, why }] of Object.entries(PRESENCE_COLLAPSED) as [LifeBeatKind, { gate: number; why: string }][]) {
    it(`⭐⭐⭐ '${kind}' (gate ${gate} – ${why}): one line per voice, identical at all four stages`, () => {
      // ⚠ THE MUTATION ARM POINTS HERE: put a `presenceLine(<POOL>[voice], presence)` read back on
      // this kind, with a `roof` cell that differs from the `away` one, and this case names the kind
      // and the exact cell that moved.
      const base = saidAt(kind, STAGES[0])
      expect(base.size, 'the sweep produced lines at all').toBeGreaterThan(0)
      for (const stage of STAGES.slice(1)) {
        expect(Object.fromEntries(saidAt(kind, stage)), `'${kind}' reads the stage: ${STAGES[0]} vs ${stage}`)
          .toEqual(Object.fromEntries(base))
      }
    })
  }

  it('⚠ the sweep can tell the difference – the pools that KEEP their axis still move with the stage', () => {
    // Without this, §B's four cases would pass against a `lifeBeatSaid` that ignored `stage`
    // altogether, which is a different defect wearing the same green.
    for (const kind of Object.keys(PRESENCE_KEYED) as LifeBeatKind[]) {
      expect(presenceSensitive(kind), `'${kind}' must still read presence`).toBe(true)
    }
  })
})

// =================================================================================================
// §C – THE LAW, BOTH DIRECTIONS (B-08's «engine side, either way»)
// =================================================================================================

describe('B-08 §C – a presence axis is legal exactly where a roof week is reachable', () => {
  it('⭐⭐⭐ the MEASURED set of presence-keyed kinds is the registry, no more and no fewer', () => {
    // ⚠⚠ THIS IS THE AUTHORING TRIPWIRE. A new pool keyed on presence – the fourteenth kind, or a
    // second axis added to an existing one – appears here as an unregistered kind, and whoever added
    // it has to write down the age gate it fires behind. That is the whole of what B-08 asked the
    // engine side to carry.
    const measured = (Object.keys(DETAILS) as LifeBeatKind[]).filter(presenceSensitive).sort()
    expect(measured, 'register the kind with its age gate in PRESENCE_KEYED').toEqual(
      (Object.keys(PRESENCE_KEYED) as LifeBeatKind[]).sort(),
    )
  })

  it('⭐⭐⭐ every presence-keyed pool has a reachable roof week', () => {
    for (const [kind, { gate, why }] of Object.entries(PRESENCE_KEYED) as [LifeBeatKind, { gate: number; why: string }][]) {
      expect(roofReach(gate).roofCount, `'${kind}' is keyed on presence behind a gate of ${gate} (${why}) and no career can be under a roof there – collapse the pool to its away column`)
        .toBeGreaterThan(0)
    }
  })

  it('⭐⭐⭐ and every collapsed pool still has an UNREACHABLE roof – lower a gate and this says so', () => {
    for (const [kind, { gate, why }] of Object.entries(PRESENCE_COLLAPSED) as [LifeBeatKind, { gate: number; why: string }][]) {
      expect(presenceSensitive(kind), `'${kind}' reads presence again`).toBe(false)
      expect(roofReach(gate).roofCount, `'${kind}' (gate ${gate} – ${why}) can now fire under a roof: it needs its roof column BACK, and that is copy the owner writes`)
        .toBe(0)
    }
  })

  it('the two registries are disjoint and cover every kind that reads a stage', () => {
    const keyed = new Set(Object.keys(PRESENCE_KEYED))
    for (const kind of Object.keys(PRESENCE_COLLAPSED)) {
      expect(keyed.has(kind), `${kind} is in both registries`).toBe(false)
    }
  })
})

// =================================================================================================
// §D – THE ENGINE'S OWN GATES, ASKED ON THE WEEKS THEMSELVES
// =================================================================================================
//
// §A is arithmetic over the three functions `lifeStageAt` is composed of. This part closes the loop
// with the predicates the ROLLS actually call, so the claim «no roof week is eligible» is the
// engine's own answer and not a second reading of it.

/** The roof and away weeks of one profile, by the same composition `lifeStageAt` uses. */
function weeksByPresence(birthMonth: number, birthDay: number): { roof: number[]; away: number[] } {
  const roof: number[] = []
  const away: number[] = []
  for (let week = 0; week <= LAST_WEEK; week++) {
    const stage = diaryLifeStageFor(kidAgeExact(week, birthMonth, birthDay), schoolIsOver(week, birthMonth), false)
    ;(awayVoice({ lifeStage: stage }) ? away : roof).push(week)
  }
  return { roof, away }
}

/** A career carrying an attachment old enough to marry, so the ONLY thing left for the gate to
 *  refuse is her age. */
function withLongEpisode(seed: string): WorldState {
  const world = createWorld(seed)
  world.loveEpisodes = [
    { id: 'p:1', sinceWeek: 0, endedWeek: null, knownWeek: 1, wants: 'open', partnerId: 'p:1', publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: null },
  ]
  return world
}

describe('B-08 §D – the rolls\' own gates refuse on every roof week', () => {
  const PROFILE = { birthMonth: 6, birthDay: 15 }
  const { roof, away } = weeksByPresence(PROFILE.birthMonth, PROFILE.birthDay)

  it('the fixture really has both kinds of week, or nothing below means anything', () => {
    expect(roof.length, 'roof weeks').toBeGreaterThan(100)
    expect(away.length, 'away weeks').toBeGreaterThan(100)
  })

  it('⭐⭐⭐ weddingEligible is false on EVERY roof week, and true on an away one', () => {
    const world = withLongEpisode('b08-wedding')
    world.profile = { ...world.profile, ...PROFILE }
    for (const week of roof) {
      world.week = week
      expect(weddingEligible(world), `the engagement is eligible at a roof week (${week})`).toBe(false)
    }
    // ⚠ THE POSITIVE CONTROL: a gate that is false everywhere would pass the loop above.
    const eligible = away.filter((week) => {
      world.week = week
      return weddingEligible(world)
    })
    expect(eligible.length, 'the gate does say yes on away weeks').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ bereavementEligible is false on EVERY roof week, and true on an away one', () => {
    const world = createWorld('b08-bereavement')
    world.profile = { ...world.profile, ...PROFILE }
    setWeightEnabled(world, true)
    for (const week of roof) {
      world.week = week
      expect(bereavementEligible(world), `a death is eligible at a roof week (${week})`).toBe(false)
    }
    const eligible = away.filter((week) => {
      world.week = week
      return bereavementEligible(world)
    })
    expect(eligible.length, 'the gate does say yes on away weeks').toBeGreaterThan(0)
  })

  it('⚠ the announcement and the parting inherit the wedding\'s gate through the LATCH', () => {
    // `'expecting'` is raised by `landPregnancyAnnouncement`, which needs `world.pregnancy`, which
    // needs `pregnancyEligible`, which needs a LATCHED episode; `'divorced'` needs the same latch.
    // `landWedding` writes that latch only from an `'engaged'` row whose `answer` is not null, and
    // only `ECONOMY.wedding.weeksAfterEngagement` after it – so both are strictly later than an
    // engagement the case above proves impossible under a roof. What is asserted here is the first
    // link: no latch, no pregnancy.
    const world = withLongEpisode('b08-latch')
    world.week = 1200
    expect(world.loveEpisodes[0].latchedWeek, 'the fixture is unlatched').toBe(null)
    expect(pregnancyEligible(world), 'a pregnancy without a latch').toBe(false)
    expect(ECONOMY.wedding.weeksAfterEngagement, 'the latch is strictly after the answer').toBeGreaterThan(0)
  })
})
