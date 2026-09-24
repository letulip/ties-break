// =================================================================================================
// WAVE 12, T1 – THE PARTING: v88, AND THE FIRST MIGRATION STEP IN THIS LADDER THAT WRITES NOTHING
// =================================================================================================
//
// `docs/specs/the-parting-2026-09.md` §8, the plan `docs/plans/life-wave-12-builder-2026-09.md` §T1.
// Three UNION widenings and not one new key: `SpiritShockKind` + `'divorce'`, `MilestoneType` +
// `'divorce'`, `LifeBeatKind` + `'divorced'`.
//
// ⚠⚠ SO THIS FILE'S JOB IS THE OPPOSITE OF WAVE 11's §B, AND THAT IS WORTH SAYING PLAINLY. There the
// crafted payload existed because the corpus could not WITNESS a back-fill. Here the crafted payload
// exists because there is no back-fill to witness AND THE ABSENCE IS THE CLAIM: a v87 save can be
// carrying a marriage that ended – the hazard has run since v83 – and what it carries for it is
// `spiritShock.kind === 'breakup'`, an `'ended'` row in the `lifeLog`, an `'ended'` feed row and no
// album line. A step that "helpfully" re-labelled any of the four would rewrite a career's history
// to match a wave that was not running when it was lived. §B is the payload that would catch it; no
// fixture in the corpus can, because none of them holds a latched episode at all.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED – the standing duty: a net nobody watched
// fail proves nothing. Control GREEN first; every arm applied by a scripted string edit and UNDONE
// by the inverse edit, never `git checkout`. The scope each count was measured over is named.
//
// The scope is FIVE files – this one, goldenSaves, migrations, coach-travel-edge-recent-schemas and
// e2e-fixtures – 220 cases, CONTROL GREEN before the first arm and GREEN AGAIN after the last
// revert (both runs read from their own log).
//
//   ARM 1  the v87 -> v88 step gated off                       123 RED   over 3 of the 5 files.
//          (`if (v === 87)` -> `if (false as boolean)`)                  Every case that walks the
//                                                                       chain throws «Save schema
//                                                                       87 is newer than supported
//                                                                       88». ⚠ THE EMPTY STEP IS
//                                                                       LOAD-BEARING, which is the
//                                                                       one thing a reader is
//                                                                       likeliest to doubt about a
//                                                                       body that writes nothing:
//                                                                       delete it and 123 cases
//                                                                       stop.
//   ARM 2  the step made a RE-LABELLER – a loop that rewrites    2 RED   §B's shock case and §B's
//          a `'breakup'` shock to `'divorce'` where a latched              holds-EVERYTHING case,
//          row ended on the shock's own week                               and NOTHING else in the
//                                                                          220. ⭐⭐ THAT IS THE
//                                                                          MEASUREMENT THIS FILE
//                                                                          EXISTS FOR: the whole
//                                                                          88-fixture corpus cannot
//                                                                          tell an honest step from
//                                                                          a history-editing one,
//                                                                          because not one fixture
//                                                                          holds a latched episode.
//   ARM 3  `SAVE_SCHEMA_VERSION` left at 87 with the step in    183 RED   over 4 of the 5 files –
//          place                                                          the constant and the
//                                                                         ladder disagreeing takes
//                                                                         the golden corpus, the
//                                                                         e2e manifest and the
//                                                                         migration walk down
//                                                                         together.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import type { LifeBeatKind, MilestoneType } from '../src/shared/protocol'
import type { SpiritShockKind } from '../src/engine/world/state'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const read = (v: number): Record<string, unknown> =>
  JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8')) as Record<string, unknown>
const rec = (w: unknown): Record<string, unknown> => w as unknown as Record<string, unknown>

/** ⭐⭐⭐ A v87 CAREER THAT HAS ALREADY LIVED A DIVORCE – the payload the corpus cannot hold, and the
 *  whole reason §B exists. Every field below is what the ENGINE wrote on the week it happened, under
 *  the rules that were running then:
 *
 *   · the episode is LATCHED (`latchedWeek`) and ENDED (`endedWeek`) – `rollEnds` ×
 *     `ECONOMY.wedding.latchEndFactor`, the door the wedding's schema pre-paid at v83;
 *   · the shock says `'breakup'`, because that is the only kind the union had;
 *   · the `lifeLog` row says `'ended'`, because that is the only card there was;
 *   · the feed row is stamped `lifeKind: 'ended'` for the same reason;
 *   · and `milestones` holds the WEDDING and no divorce, because no divorce line existed to capture.
 *
 *  ⚠ THE FIVE TOGETHER ARE THE TEST. Any one of them re-written by the step is a career's history
 *  edited after the fact, and each is asserted BY NAME below rather than through a whole-object
 *  compare alone, so a red says which of the five moved. */
function craftedLivedDivorce(): Record<string, unknown> {
  const base = read(87)
  base.loveEpisodes = [
    {
      id: 'ep:604',
      sinceWeek: 604,
      endedWeek: 923,
      knownWeek: 612,
      wants: 'open',
      partnerId: 'pp:604',
      publicWeek: 700,
      publicWrong: false,
      airedMetWeek: 702,
      airedEndedWeek: null,
      latchedWeek: 760,
      partnerName: 'Mateo',
    },
  ]
  base.spiritShock = { week: 923, kind: 'breakup' }
  base.lifeLog = [{ week: 923, kind: 'ended', detail: 'ep:604', answer: 'space' }]
  base.events = [{ id: 9001, week: 923, type: 'life', keep: true, text: 'It ended this week, and there is nobody in her life now.', lifeKind: 'ended' }]
  base.milestones = [{ type: 'wedding', week: 760, kind: 'ep:604' }]
  return base
}

// =================================================================================================
// A. THE MOVE (CLAUDE.md invariant 3) – v88's own rung, and what makes it unlike every rung above it
// =================================================================================================

describe('wave 12 T1 A – v88, the move that appends nothing', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    expect(SAVE_SCHEMA_VERSION, 'v88 shipped, and the ladder has only grown since').toBeGreaterThanOrEqual(88)
    const fixture = read(88)
    expect(fixture.schemaVersion).toBe(88)
  })

  it('⭐⭐⭐ appends NO KEY – the golden pair differs on `schemaVersion` alone, order included', () => {
    const before = read(87)
    const after = read(88)
    const ka = Object.keys(before)
    const kb = Object.keys(after)
    // ⚠ THE ORDER AND NOT ONLY THE SET, because the frozen-career peel in
    // tests/coachTravelEdgeFixtures.ts is a statement about SERIALISATION order: a key that moved
    // position without appearing or disappearing would leave this test green on a set comparison
    // and take every hash in that file red with no line able to say why.
    expect(kb, 'not one key added, not one removed, and not one moved').toEqual(ka)
    const moved = ka.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    expect(moved, '⭐ exactly ONE line moves, and it is the version number itself').toEqual(['schemaVersion'])
  })

  it('the step is a no-op on the corpus: migrating v87 IS the v88 fixture, byte for byte', () => {
    // ⚠ THE RECIPE, ASSERTED RATHER THAN DESCRIBED (the v25 one, README's own words): the fixture is
    // `migrateSave(v87.json)` and not a hand edit, so a reader can regenerate it and a drifting step
    // cannot hide behind a fixture somebody typed.
    //
    // ⚠ RE-AIMED 24.09 AT v89 (the college scene, T4), NOT WEAKENED, AND THE SHAPE IS THE POINT.
    // `migrateSave` always walks to the LADDER'S HEAD, so the moment a version landed above v88 the
    // left arm stopped being «the v88 fixture» and this line compared 89 with 88. Walking BOTH arms
    // to the head asserts exactly the claim this case was written for – «the v88 step changes no byte
    // of the corpus» – and it cannot rot again, because every future rung is applied to both sides.
    expect(migrateSave(read(87))).toEqual(migrateSave(read(88)))
  })

  it('is idempotent – running it twice changes nothing', () => {
    const once = migrateSave(read(87))
    expect(migrateSave(JSON.parse(JSON.stringify(once)))).toEqual(once)
  })

  it('⭐⭐ the three widened unions accept their new member, and the members are the ones the spec names', () => {
    // ⚠⚠ A TYPE-LEVEL CLAIM NEEDS A VALUE TO STAND ON, which is the whole of what these four lines
    // are: `satisfies` on a literal is checked at build time and erased at run time, so the
    // assertions underneath exist to keep the case from passing vacuously if somebody deletes the
    // annotations. ⚠ AND THE SHOCK KIND AND THE BEAT KIND ARE SPELLED DIFFERENTLY ON PURPOSE –
    // `'divorce'` is the THING and `'divorced'` is what happened to her, which is `'ended'`'s own
    // grammar (`SpiritShockKind` has `'breakup'`, `LifeBeatKind` has `'ended'`) rather than a slip.
    const shock = 'divorce' satisfies SpiritShockKind
    const beat = 'divorced' satisfies LifeBeatKind
    const milestone = 'divorce' satisfies MilestoneType
    expect([shock, beat, milestone]).toEqual(['divorce', 'divorced', 'divorce'])
  })
})

// =================================================================================================
// B. THE PAYLOAD THE CORPUS CANNOT HOLD – a v87 career that already lived a divorce
// =================================================================================================

describe('wave 12 T1 B – a marriage that ended BEFORE the wave keeps every word it was given', () => {
  it('⭐⭐⭐ does not re-label the shock: a v87 divorce stays `breakup`', () => {
    const out = rec(migrateSave(craftedLivedDivorce()))
    // ⚠ THE FORWARD-ONLY LAW, AND IT IS THE ONE CLAIM IN THIS FILE THAT COSTS SOMETHING TO KEEP.
    // Re-labelling here is a one-line change that would look like a kindness and would silently
    // deepen a shock the player already lived through at a different price (−22/−34 became −27/−42),
    // months after the week it landed. `prologueTrace`'s v84 refusal applied to a fact the save held
    // DIFFERENTLY rather than not at all.
    expect(out.spiritShock).toEqual({ week: 923, kind: 'breakup' })
  })

  it('⭐⭐ does not re-label the card, the feed row, or reach for an album line that was never captured', () => {
    const out = rec(migrateSave(craftedLivedDivorce()))
    expect(out.lifeLog, 'the `lifeLog` row is the one the parent actually answered').toEqual([
      { week: 923, kind: 'ended', detail: 'ep:604', answer: 'space' },
    ])
    expect((out.events as Record<string, unknown>[])[0].lifeKind, 'the kept feed row keeps its stamp').toBe('ended')
    expect(out.milestones, 'the wedding is there and no divorce was invented behind it').toEqual([
      { type: 'wedding', week: 760, kind: 'ep:604' },
    ])
  })

  it('leaves the episode itself untouched – the latch and the ending are both still on the row', () => {
    const out = rec(migrateSave(craftedLivedDivorce()))
    const ep = (out.loveEpisodes as Record<string, unknown>[])[0]
    expect(ep.latchedWeek, 'she was married').toBe(760)
    expect(ep.endedWeek, '...and it ended').toBe(923)
    expect(ep.partnerName, '...and he still has the name v83 drew for him').toBe('Mateo')
  })

  it('⭐⭐⭐ holds EVERYTHING at once: the whole payload survives with `schemaVersion` the only difference', () => {
    // The strongest form of §B: not five fields checked by name but the entire crafted world
    // compared against itself. A step that touched ANY byte for any reason fails here, and the four
    // cases above are what say WHICH byte when it does.
    const before = craftedLivedDivorce()
    const after = rec(migrateSave(craftedLivedDivorce()))
    const moved = Object.keys(before).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    expect(moved).toEqual(['schemaVersion'])
    // ⚠ RE-AIMED 24.09 AT v89 (the college scene, T4), NOT WEAKENED: the claim is «the whole payload
    // survives and the version is the only difference», and the version is the LADDER'S HEAD rather
    // than 88 now. ⭐ The `moved` line above is untouched and is the half that matters – v89 appends
    // `dynasty.motherCareer.collegeTitles` and this payload's `dynasty` is `null`, so the new step
    // writes nothing here and «one key» is still exactly true.
    expect(after.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
  })
})

// =================================================================================================
// C. THE LADDER STILL WALKS FROM BELOW – the step is empty, not missing
// =================================================================================================

describe('wave 12 T1 C – the chain', () => {
  it('⭐⭐ an OLD save still arrives at v88, so the empty step is on the chain rather than beside it', () => {
    // ⚠ v72 IS CHOSEN BECAUSE IT PREDATES THE WHOLE PRIVATE-LIFE LAYER: it walks sixteen steps to
    // get here, and if v88's rung were missing from the ladder the throw would be «Save schema 87 is
    // newer than supported 88» rather than a silent pass. The corpus sweep in goldenSaves.test.ts
    // covers all 88 versions; this case is here so a reader of THIS wave can see the chain close.
    // ⚠ RE-AIMED 24.09 AT v89 (the college scene, T4), NOT WEAKENED, and the mechanism is unchanged:
    // `migrateSave` THROWS when the walk stops below the head, so a missing v88 rung still fails here
    // – it would stop at 87 and throw «Save schema 87 is newer than supported 89». Reading the head
    // rather than the literal is what keeps the sentence above checkable as the ladder grows.
    const out = rec(migrateSave(read(72)))
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
  })

  it('refuses a save from the future, with the version in the message', () => {
    // ⚠ RE-AIMED 24.09 AT v89 (the college scene, T4), NOT WEAKENED: 89 IS a supported version now, so
    // the literal had stopped describing a save from the future. `SAVE_SCHEMA_VERSION + 1` is the one
    // spelling of «one past the head» and cannot go stale on the next bump.
    const fromTheFuture = SAVE_SCHEMA_VERSION + 1
    expect(() => migrateSave({ ...read(88), schemaVersion: fromTheFuture })).toThrow(new RegExp(String(fromTheFuture)))
  })
})
