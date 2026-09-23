// =================================================================================================
// WAVE 11, T1 – THE WEIGHT: THE v87 SCHEMA MOVE, THE SWITCH, AND THE CREATION ASK'S ANSWER
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §1, the plan `docs/plans/life-wave-11-builder-2026-09.md` §T1.
// Three world keys, one field inside a nullable record, and the ONE toggle the game has.
//
// ⚠⚠ THIS FILE EXISTS FOR THE SAME HOLE WAVE 8's §B DUG ITS CRAFTED PAYLOAD FOR: every fixture in
// the golden corpus back-fills, so a step that ignored an existing value would look perfect against
// all 87 of them. The keep-branch never executes. §B therefore CRAFTS a v86 payload that already
// holds the three keys AND a live pregnancy, and asserts every one survives whole. The pregnancy
// arm is the sharper half – `conceivedWeek` is this ladder's first back-fill INSIDE a nullable
// record, and the corpus literally cannot witness it, because every fixture carries `pregnancy:
// null`.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED – the standing duty: a net nobody watched
// fail proves nothing. Control GREEN first; every arm applied by a scripted string edit and UNDONE
// by the inverse edit, never `git checkout`. The scope each count was measured over is named.
//
//   ARM 1  `save.weightEnabled ??= false` -> `save.weightEnabled = false`   2 RED  §B's keep-the-switch
//          (the `??=` arm the corpus cannot see – and the one                      case and §B's
//          version in this ladder where the arm is REAL rather than                holds-EVERYTHING
//          indistinguishable, because the key is a BOOLEAN and `false`             case. ⚠ §A STAYED
//          is the commonest value it holds)                                        ENTIRELY GREEN, and
//                                                                                  that is what this
//                                                                                  file exists for:
//                                                                                  the whole 88-fixture
//                                                                                  corpus cannot tell
//                                                                                  `=` from `??=` here
//   ARM 2  `pregnancy.conceivedWeek ??= pregnancy.announcedWeek` deleted    2 RED  §B's keep-the-week
//          outright                                                                case and §B's
//                                                                                  holds-EVERYTHING
//                                                                                  case
//   ARM 3  the v86 -> v87 step gated off (`if (false)`)                   148 RED  over six files –
//                                                                                  goldenSaves,
//                                                                                  migrations, plan,
//                                                                                  wave6-spotlight-
//                                                                                  schema, wave8-
//                                                                                  pregnancy-schema
//                                                                                  and this one, 197
//                                                                                  cases in all: every
//                                                                                  case that walks the
//                                                                                  chain throws «Save
//                                                                                  schema 86 is newer
//                                                                                  than supported 87»
//   ARM 4  `weightEnabled: weightEnabled ?? false` -> `?? true` in          1 RED  §C's absent-means-off
//          `createWorld`                                                           case ALONE – and the
//                                                                                  1 is the measurement
//                                                                                  rather than the
//                                                                                  prediction (3 was
//                                                                                  predicted): every
//                                                                                  other case passes
//                                                                                  the argument
//                                                                                  EXPLICITLY, so only
//                                                                                  the case about the
//                                                                                  default can see a
//                                                                                  default move. That
//                                                                                  is the shape a
//                                                                                  ruling-bearing
//                                                                                  default needs – one
//                                                                                  witness, and it is
//                                                                                  the right one
//   ARM 5  `setWeightEnabled` also clears the two lists                     1 RED  §D's «it never
//                                                                                  deletes lived state»
//                                                                                  case, which is the
//                                                                                  half of the ruling
//                                                                                  no reader of that
//                                                                                  one-line function
//                                                                                  can see
//
// =================================================================================================

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, SAVE_SCHEMA_VERSION, setWeightEnabled, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** The keys v87 puts on the WORLD, in the order `createWorld` appends them – which is the order the
 *  peel in tests/coachTravelEdgeFixtures.ts reverses, and the reason this is a list and not a set. */
const V87_WORLD_KEYS = ['weightEnabled', 'pregnancyLossWeeks', 'bereavementWeeks'] as const

const v86 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v86.json`, 'utf8'))
const rec = (w: unknown): Record<string, unknown> => w as unknown as Record<string, unknown>

/** A pregnancy as the engine writes one, built by hand because no fixture in the corpus holds one –
 *  the whole reason this file has a §B. ⚠ IT IS THE **PRE-WINDOW** SHAPE, which is the only shape a
 *  v86 save can honestly be in: `conceivedWeek` does not exist on it, and the migration has to
 *  decide what that absence means. The other five fields are chosen to be the ones a careless step
 *  would clobber – real weeks, a set `support`, a real `rankAtPause`. */
function craftedPregnancy(): Record<string, unknown> {
  return {
    episodeId: 'p:812',
    announcedWeek: 830,
    pausesWeek: 838,
    dueWeek: 869,
    support: 'warm',
    rankAtPause: 41,
  }
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v87's own rung
// =================================================================================================

describe('wave 11 T1 A – v87, the move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    expect(SAVE_SCHEMA_VERSION, 'v87 shipped, and the ladder has only grown since').toBeGreaterThanOrEqual(87)
    const fixture = JSON.parse(readFileSync(`${SAVES}/v87.json`, 'utf8'))
    expect(fixture.schemaVersion).toBe(87)
    // ⚠ `in` FIRST AND THE VALUE SECOND, wave 8 §A's own distinction: a key must be PRESENT, because
    // an absent key is the v86 shape and would migrate again on every load. `false` and `[]` both
    // read as their own absence under `??`, so a value check alone passes on a key that is not there.
    for (const key of V87_WORLD_KEYS) {
      expect(key in fixture, `the fixture carries ${key}, a key this version added`).toBe(true)
    }
    expect(fixture.weightEnabled, '⭐ nobody asked this save at creation – the 22.09 ruling').toBe(false)
    expect(fixture.pregnancyLossWeeks, '⭐ and nothing was lost, because there was nothing to lose').toEqual([])
    expect(fixture.bereavementWeeks, '⭐ and nobody died, for the same plainest reason').toEqual([])
    // ⚠⚠ AND THE THREE KEYS ARE LAST, IN THIS ORDER, WHICH IS AN ASSERTION AND NOT A COINCIDENCE:
    // the peel in tests/coachTravelEdgeFixtures.ts depends on this serialisation order. If a later
    // step writes them earlier, this line goes red BEFORE the hashes do and names the reason, where
    // a red hash names nothing.
    expect(Object.keys(fixture).slice(-V87_WORLD_KEYS.length), 'the new keys are LAST and in append order')
      .toEqual([...V87_WORLD_KEYS])
  })

  it('⭐⭐ back-fills the switch OFF – a RULING, not the mechanic’s identity', () => {
    const before = v86()
    for (const key of V87_WORLD_KEYS) {
      expect(before[key], `the older shape genuinely has no ${key}`).toBeUndefined()
    }
    const migrated = rec(migrateSave(v86()))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠⚠ THIS IS THE ONE BACK-FILL IN THE LADDER THAT IS NOT THE MECHANIC'S OWN IDENTITY. Every rung
    // below says some version of «the same literal `createWorld` writes, and for the same reason
    // rather than by coincidence». Here the two answer DIFFERENT questions – `createWorld` writes
    // what the creation ask answered, this writes what nobody was asked – and the agreement between
    // the two `false`s is the coincidence. His words, 22.09: «nobody asked a migrated save at
    // creation, and the weight does not arrive uninvited in a career's middle».
    expect(migrated.weightEnabled).toBe(false)
    expect(migrated.pregnancyLossWeeks).toEqual([])
    expect(migrated.bereavementWeeks).toEqual([])
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses, asserted so a hand edit to either goes red here.
    expect(rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v87.json`, 'utf8')))), 'the fixture is already at the head')
      .toEqual(migrated)
  })

  it('is idempotent – running it twice changes nothing', () => {
    // ⚠ RE-ARMED RATHER THAN RE-DISCOVERED – waves 3..8's own trap. `migrateSave` MUTATES ITS PAYLOAD
    // IN PLACE, so an idempotency line that compares the result with the field the step just wrote
    // compares a thing with itself. The second walk is handed a DEEP COPY of the first's output.
    const once = migrateSave(v86())
    const twice = migrateSave(structuredClone(once))
    expect(twice).toEqual(once)
  })
})

// =================================================================================================
// B. THE `??=` ARM – the payload the corpus cannot hold
// =================================================================================================

describe('wave 11 T1 B – a save that already holds the three keys keeps them', () => {
  it('⭐⭐ keeps a switch that is ON – the arm `||=` would destroy and the corpus cannot see', () => {
    // ⚠⚠ THIS IS THE FIRST STEP IN THE LADDER WHERE `??=` VS `||=` IS A **REAL** DIFFERENCE RATHER
    // THAN A RULE KEPT FOR THE DAY IT MATTERS. Every rung below writes `null` or `[]`, where the two
    // operators agree on the only falsy value the key can legitimately hold. `weightEnabled` is a
    // BOOLEAN whose commonest legitimate value is `false`, so `||=` would overwrite a stored answer
    // with the default every time a save loaded – silently, for exactly the players who turned it
    // off on purpose.
    const payload = { ...v86(), weightEnabled: true, pregnancyLossWeeks: [412], bereavementWeeks: [980, 1140] }
    const out = rec(migrateSave(payload))
    expect(out.weightEnabled, 'a save that answered ON stays ON').toBe(true)
    expect(out.pregnancyLossWeeks, 'and a week it lived is not tidied away').toEqual([412])
    expect(out.bereavementWeeks).toEqual([980, 1140])
  })

  it('⭐⭐⭐ back-fills `conceivedWeek` onto a LIVE pregnancy as the pre-window truth', () => {
    const pregnancy = craftedPregnancy()
    expect('conceivedWeek' in pregnancy, 'the v86 shape genuinely has no conception week').toBe(false)
    const out = rec(migrateSave({ ...v86(), pregnancy: structuredClone(pregnancy) }))
    const after = out.pregnancy as Record<string, unknown>
    // ⚠⚠ IT IS THE **PRE-WINDOW TRUTH** AND NOT A RECONSTRUCTION. Before this version the
    // announcement WAS the conception – the research's own finding about `termWeeks: 31`, written at
    // the constant – so this line states what such a save has always meant. `loveEpisodes`'s v72
    // argument and emphatically not `prologueTrace`'s v84 one.
    expect(after.conceivedWeek, 'the announcement WAS the conception before this version').toBe(830)
    // ⚠ AND IT MOVES NO DATE. `dueWeek` and `pausesWeek` are persisted (`PregnancyState`'s own law),
    // so a career already carrying a pregnancy is paused and due on exactly the weeks it was – the
    // migration may not re-time a life in flight.
    expect(after.dueWeek, 'the birth does not move').toBe(869)
    expect(after.pausesWeek, 'and neither does the pause').toBe(838)
    expect(after.support, 'nor is the answer he gave forgotten').toBe('warm')
    expect(after.rankAtPause).toBe(41)
  })

  it('holds EVERYTHING at once – the switch, both lists and a live pregnancy', () => {
    const out = rec(
      migrateSave({
        ...v86(),
        weightEnabled: true,
        pregnancyLossWeeks: [412],
        bereavementWeeks: [980],
        pregnancy: craftedPregnancy(),
      }),
    )
    expect(out.weightEnabled).toBe(true)
    expect(out.pregnancyLossWeeks).toEqual([412])
    expect(out.bereavementWeeks).toEqual([980])
    expect((out.pregnancy as Record<string, unknown>).conceivedWeek).toBe(830)
    expect((out.pregnancy as Record<string, unknown>).announcedWeek).toBe(830)
  })

  it('a save with NO pregnancy is untouched by the record arm', () => {
    // ⚠ THE NO-OP ARM, and it is worth a case rather than an assumption: the step reaches inside a
    // NULLABLE record, so the null branch is the one every fixture in the corpus takes and the one a
    // careless `pregnancy.conceivedWeek ??= …` without the guard would throw on.
    const out = rec(migrateSave({ ...v86(), pregnancy: null }))
    expect(out.pregnancy).toBe(null)
  })
})

// =================================================================================================
// C. THE CREATION ASK – the sixth argument, and what its absence means
// =================================================================================================

describe('wave 11 T1 C – `createWorld`’s sixth argument', () => {
  it('⭐⭐⭐ absent means OFF, never silently on', () => {
    // ⚠⚠ THIS IS WHAT MAKES THE WHOLE WAVE MEASURABLE. Every bench, probe, fixture, sim career and
    // test helper in the repo calls `createWorld` without this argument, and both hazards return on
    // the flag BEFORE their stream is derived – so «the switch-off arm is byte-identical to a
    // pre-wave career» (§8 row 6) is a property of this line rather than of a policy.
    const world = createWorld('weight-absent', DEFAULT_PROFILE)
    expect(world.weightEnabled).toBe(false)
    expect(world.pregnancyLossWeeks).toEqual([])
    expect(world.bereavementWeeks).toEqual([])
  })

  it('the ask is obeyed in both directions', () => {
    const on = createWorld('weight-on', DEFAULT_PROFILE, 'c-on', undefined, undefined, true)
    const off = createWorld('weight-off', DEFAULT_PROFILE, 'c-off', undefined, undefined, false)
    expect(on.weightEnabled, 'a player who included them gets them').toBe(true)
    expect(off.weightEnabled, 'and a player who left them out does not').toBe(false)
  })

  it('the three keys follow `dynasty`, consecutively and in append order', () => {
    // ⚠ THE LIVE HALF of §A's fixture assertion, and it is asked RELATIVELY rather than off the end
    // – which is a correction made while writing this case, not a weakening. `createWorld` does not
    // return its literal: `ensureSeason` and `recomputeKidRank` run after it and add keys of their
    // own (`kidRankWta` among them), so «the last three» is true of the FIXTURE (§A asserts exactly
    // that) and false of a live world. What the peel actually depends on is that object rest
    // preserves the RELATIVE order of everything it keeps, so the relative claim is the true one:
    // these three sit together, in this order, immediately after the key the version below appended.
    const world = createWorld('weight-order', DEFAULT_PROFILE)
    const keys = Object.keys(world)
    const at = keys.indexOf(V87_WORLD_KEYS[0])
    expect(at, 'the switch is in the literal at all').toBeGreaterThan(0)
    expect(keys.slice(at, at + V87_WORLD_KEYS.length), 'consecutive, in append order').toEqual([...V87_WORLD_KEYS])
    expect(keys[at - 1], 'and they follow v86\'s own key, which is what the peel order means').toBe('dynasty')
  })
})

// =================================================================================================
// D. THE SWITCH, MID-CAREER – both directions, and the half the one-line setter cannot show
// =================================================================================================

describe('wave 11 T1 D – the settings door', () => {
  function lived(): WorldState {
    const world = createWorld('weight-lived', DEFAULT_PROFILE, 'c-lived', undefined, undefined, true)
    // A career that HAS lived some of it: two weeks on the record, and a mark still on her.
    world.pregnancyLossWeeks.push(412)
    world.bereavementWeeks.push(980)
    world.spiritShock = { week: world.week, kind: 'bereavement' }
    return world
  }

  it('turns both ways, and takes effect on the week it is pressed', () => {
    const world = lived()
    expect(world.weightEnabled).toBe(true)
    setWeightEnabled(world, false)
    expect(world.weightEnabled, 'off means off, now').toBe(false)
    setWeightEnabled(world, true)
    expect(world.weightEnabled, 'and a player may change his mind back').toBe(true)
  })

  it('⭐⭐⭐ NEVER deletes lived state – the half of the ruling the setter cannot show', () => {
    // ⚠⚠ THE RULING HAS TWO HALVES AND ONLY ONE OF THEM IS VISIBLE IN `setWeightEnabled`: «turning it
    // off stops NEW weight events and never deletes lived state». A switch that tidied its own
    // history away would be rewriting a life rather than stopping one, and the one-line setter is
    // exactly the kind of function a later author would «helpfully» extend. This case is what stops
    // that.
    const world = lived()
    setWeightEnabled(world, false)
    expect(world.pregnancyLossWeeks, 'a week she lived is still a week she lived').toEqual([412])
    expect(world.bereavementWeeks, 'and so is the other one').toEqual([980])
    expect(world.spiritShock, 'and the mark on her does not lift because a switch moved').not.toBe(null)
    expect(world.spiritShock?.kind).toBe('bereavement')
  })
})
