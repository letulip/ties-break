// =================================================================================================
// WAVE 6, T1 – THE SPOTLIGHT: THE v77 SCHEMA MOVE, ITS FIVE FIELDS, AND THE ZERO-DIFF PIN
// =================================================================================================
//
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T1; the model is `docs/specs/who-she-is-2026-09.md`
// §3c and §3c-bis, the booth's boundary `docs/plans/the-way-she-sounds-2026-09.md` C4. T1 ships FIVE
// seats and deliberately no reader for any of them: `world/spotlight.ts` and `newsStandingOf` are T2,
// the pressure term inside `accrueSpirit` is T3, habituation's growth T4, the fifth focus T5, the
// leak that could set `publicWeek` T6, and the booth stamps that could set the aired weeks T7.
//
// ⚠⚠ THIS VERSION IS NOT THE SAME SHAPE AS THE THIRTEEN BEFORE IT, WHICH IS THE FIRST THING TO SAY.
// v73 added `lifeLog`, v74 `loveEpisodes`, v75 `spiritShock`, v76 seven world keys – every one a key
// on `WorldState`, back-filled by a top-level `??=` and peeled by a top-level object rest. FOUR of
// v77's five fields are on `LoveEpisode` ENTRIES inside `world.loveEpisodes`. So the migration WALKS
// THE LIST, and `careerHashAtSchema` gained the protocol's first NESTED peel (its own note, and the
// header of tests/coachTravelEdgeFixtures.ts). Both are easy; both are exactly what thirteen flat
// versions of muscle memory skips.
//
// ⚠⚠ AND §B EXISTS BECAUSE THE GOLDEN CORPUS CANNOT WITNESS THE WALK. Measured 14.09 by the
// architect and re-asserted here as a case of its own: **every one of the 77 golden saves carries
// zero love episodes** – v74, v75 and v76 each hold `loveEpisodes: []`, and everything below v74
// predates the field. So a per-entry back-fill proven by a green fixture regeneration is the receipt
// for work nothing did: the loop would never have executed. §B therefore CRAFTS a v76 payload
// carrying two episodes – one live, one ended – and asserts all four fields arrive on BOTH.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4/5 duty kept verbatim – a net
// nobody watched fail proves nothing. Control GREEN first; every arm applied by a scripted string
// edit and UNDONE by the inverse edit, never `git checkout`, with the file's md5 checked back to
// pristine after each one. **No arm came in at 0 RED, so there is no null arm to declare.** The scope
// each count was measured over is named, because a red count without its scope is a number and not a
// measurement.
//
//   ARM 1  the per-entry loop made to SKIP THE FIRST ROW          3 RED  §B's two-row case, §B's
//          (`save.loveEpisodes` -> `….slice(1)`)                          ordering case and §B's
//                                                                        exactly-four case – ruling
//                                                                        B's own arm, and the whole
//                                                                        reason §B is crafted
//   ARM 2  the v76 -> v77 step gated off (`if (false)`)         115 RED  over three files: 10 here,
//                                                                        28 in migrations.test.ts and
//                                                                        77 in goldenSaves.test.ts –
//                                                                        every case that walks the
//                                                                        chain throws «Save schema 76
//                                                                        is newer than supported 77»
//   ARM 3  `spotlightHabituation` back-filled `1` instead of 0    2 RED  §A's back-fill case and §A's
//                                                                        every-older-fixture case
//   ARM 4  `publicWrong` back-filled `true`                       1 RED  §B's two-row case
//   ARM 5  the golden fixture hand-edited                         2 RED  §A's shape case and §A's
//          (`spotlightHabituation` 0 -> 5)                                «the migration's own output»
//                                                                        equality
//   ARM 6  the NESTED peel neutered in `careerHashAtSchema`       3 RED  in coach-travel-edge.test.ts:
//          (the `.map` returns each row unchanged)                        the v77, v76 AND v75 rungs,
//                                                                        every one of them through
//                                                                        `eliteGrinder`
//   ARM 7  the `schemaVersion < 77 ? preSpotlight` branch removed 1 RED  the v77 case ALONE, every
//                                                                        older rung still green
//   ARM 8  a reader of the WORLD key planted at the head of       2 RED  §D's first walk and §E's
//          `accrueSpirit` (`world.spirit += …Habituation`)                world-key census
//   ARM 9  a reader of a ROW field planted in the same place      2 RED  §D's ATTACHMENTS walk and
//          (`…some((e) => e.publicWeek === null)` -> a counter)           §E's row-field census
//
// ⚠ ARM 1 IS THE ENTRY WORTH READING, and it is the arm the architect's ruling B asked for by name.
// It leaves the migration correct on every fixture in the corpus and correct on any save with one
// episode; it is wrong only on a save with two, and the golden corpus has none with even one. Run
// against the fixtures alone it is INVISIBLE. §B is the only thing in the tree that sees it.
//
// ⚠⚠ ARM 6 CAME IN HIGHER THAN PREDICTED AND THE EXTRA REDS ARE THE MEASUREMENT, not noise. The
// nested peel was expected to be load-bearing at ONE rung (v77's own) and it is load-bearing at
// THREE – v77, v76 and v75 – because every rung from 74 upward KEEPS `loveEpisodes` in the shape it
// rolls back to, so a row carrying four fields no shipped version wrote breaks all three. `PRE_V74`
// and everything below it held, because rung 73 drops the key entirely. All three reds are
// `eliteGrinder`: she is the only cell of five that holds a row at all.
//
// ⚠⚠ AND ARM 9's FIRST VERSION WAS AN ARM THAT COULD NOT FAIL, which is recorded rather than quietly
// replaced, because it is the same family this repo keeps catching. It planted
// `world.spirit += 1` behind the row read – and §D's attachments walk stayed GREEN, while only §E's
// census went red. The reason is that `accrueSpirit` CLAMPS and RETURNS TOWARD A BASELINE, so a
// constant weekly addition drives both arms to the same fixed point: the mutation collapsed into the
// identity over 156 weeks. Re-armed against `world.nextEventId` – monotone, never clamped, never
// re-derived – it reddens §D exactly as it should. A behaviour arm has to move a quantity the system
// is not actively pulling back.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, tickWeek, skipTournament, closeTournament, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { migrateSave } from '../src/engine/migrations'
import type { LoveEpisode } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** A fresh deep copy of the v76 golden save every time – `migrateSave` mutates in place, so a shared
 *  payload would let one case decide what the next one sees. Wave 5's own helper, one rung up. */
const v76 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v76.json`, 'utf8'))

/** The ONE world key v77 appends, and the FOUR fields it puts on every `LoveEpisode` row. Written
 *  out once here and read by six cases, so a sixth field arriving in some later wave cannot quietly
 *  slip past one of them. ⚠ The two lists are separate ON PURPOSE – they are back-filled by two
 *  different mechanisms (a top-level `??=` and a walk over a list) and peeled by two different halves
 *  of `careerHashAtSchema`, and a single flat list would have hidden exactly that distinction. */
const V77_WORLD_KEYS = ['spotlightHabituation'] as const
const V77_ROW_FIELDS = ['publicWeek', 'publicWrong', 'airedMetWeek', 'airedEndedWeek'] as const

/** The v74 shape of a row, with nothing v77 added – what every save written before this version
 *  holds, and what the migration is handed. Built by hand rather than by `Omit<LoveEpisode, …>` off a
 *  live row, because a historical payload is JSON and not an instance of today's type. */
function preV77Row(sinceWeek: number, endedWeek: number | null, knownWeek: number | null): Record<string, unknown> {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}` }
}

/** A plain deterministic walk – wave 5's helper verbatim, and `resumeMain` for its reason: it is what
 *  the WORKER threads through the tick (v35) and it mutates `world.rngMain` in place, so the
 *  persisted MAIN position advances with the walk and lands INSIDE §D's key-for-key comparison. With
 *  a fresh stream `rngMain` never moves and «the two arms agree on `rngMain`» would be the agreement
 *  of two untouched initial values. */
function walk(world: WorldState, weeks: number): WorldState {
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** Source with every comment removed – `tests/spirit.test.ts`'s own helper verbatim, for §E: a pin
 *  that reads prose is a pin the next writer repairs by deleting a sentence. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – for §E's whole-tree census. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v77's own rung
// =================================================================================================
describe('wave 6 T1 A – v77, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    // ⚠ RE-AIMED BY ROUND 42's v78 BUNDLE (#35 + round 41 #22 + #45's sparring keys), NOT WEAKENED.
    // This read `toBe(77)` and the claim it was making is «v77 took a number of its own and shipped
    // the fixture that number owes» – which is still exactly what is asserted, one rung down the
    // ladder. What a bare equality could not survive is the very thing it is here to allow: the next
    // version. `toBeGreaterThanOrEqual` is the converging form the line below it already uses for
    // the same reason.
    expect(SAVE_SCHEMA_VERSION, 'v77 shipped, and the ladder has only grown since').toBeGreaterThanOrEqual(77)
    const v77 = JSON.parse(readFileSync(`${SAVES}/v77.json`, 'utf8'))
    expect(v77.schemaVersion).toBe(77)
    // ⚠ `in` FIRST AND THE VALUE SECOND, and the difference is the whole shape: a key must be
    // PRESENT, because an absent key is the v76 shape and would migrate again on every load. The
    // world key's back-fill is `0`, which an absent key also reads as under `??`, so a value check
    // alone would pass on a key that is not there.
    for (const key of V77_WORLD_KEYS) {
      expect(key in v77, `the fixture carries ${key}, the key this version added`).toBe(true)
    }
    expect(v77.spotlightHabituation, '⭐ zero is the IDENTITY – she has never lived a week known').toBe(0)
    // ⚠⚠ AND THE FIXTURE CARRIES NO EPISODE, WHICH IS STATED HERE RATHER THAN LEFT AS A GAP. It is
    // the real migration's own output on `v76.json` (the recipe every fixture since v25 uses) and
    // `v76.json` holds `loveEpisodes: []`, so the four ROW fields are witnessed by §B's crafted
    // payload and by `FROZEN.eliteGrinder` in the frozen corpus – not by this file. See §B.
    expect(v77.loveEpisodes, 'the corpus has no attachment to back-fill, and that is §B\'s whole subject').toEqual([])
  })

  it('⭐⭐ back-fills five values, every one of them exactly true rather than a bargain with a pruned log', () => {
    const before = v76()
    for (const key of V77_WORLD_KEYS) {
      expect(before[key], `the older shape genuinely has no ${key}`).toBeUndefined()
    }
    const migrated = migrateSave(v76())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠⚠ ZERO IS THE TRUE VALUE AND NOT A PLACEHOLDER FOR ONE. `spotlightHabituation` counts «known
    // weeks» she has actually lived toward `habituationFullWeeks`, and a career that predates the
    // spotlight has lived none of them – nothing was counting, and there was no pressure to
    // acclimate to. The migration is not «the girl acquires a public life»; it is «she has never
    // lived a week known», written down for the first time.
    expect(migrated.spotlightHabituation).toBe(0)
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here
    // (ARM 5). ⚠ This line is the one the NEXT wave will have to re-aim, exactly as this wave re-aimed
    // v76's and wave 5 re-aimed v75's: `migrateSave` always walks to the LADDER'S HEAD, so the direct
    // equality holds only while 77 IS the head. The re-aim is the converging form, not a deletion.
    // ⚠⚠ RE-AIMED BY ROUND 42's v78 BUNDLE, AND THIS IS THE RE-AIM ITS OWN NOTE PREDICTED ONE LINE
    // UP, word for word. `migrateSave` always walks to the LADDER'S HEAD, so `v77.json` stopped
    // being its output the moment 78 became the head – and the CONVERGING form, which is what that
    // note asked for, is to compare against the fixture the head owes instead of deleting the claim.
    // The v77 half is kept and sharpened: migrating `v76.json` and then reading `v77.json` and
    // migrating THAT must land on the same world, which says the ladder has no shortcut through 77.
    // ⚠⚠ RE-AIMED A SECOND TIME BY WAVE 7's v83 (18.09), AND THIS TIME THE HEAD LEFT THE LINEAGE
    // RATHER THAN MERELY MOVING: v83.json is deliberately NOT the migration's output on v82.json –
    // it is a PROBE career that HOLDS a love episode, the corpus's first, so the per-row walks
    // finally execute on a golden save (its README row records the departure, and
    // tests/wave7-wedding-schema.test.ts asserts the row is really there). A head-equality against a
    // different career cannot hold and is not owed; what this rung still owes – and keeps – is the
    // no-shortcut claim along ITS OWN lineage: migrating `v76.json`, `v77.json` and `v82.json` (the
    // last fixture the v25 recipe produced) must all land on the same world.
    expect(migrateSave(JSON.parse(readFileSync(`${SAVES}/v82.json`, 'utf8'))), 'the lineage converges at the head')
      .toEqual(migrated)
    expect(migrateSave(JSON.parse(readFileSync(`${SAVES}/v77.json`, 'utf8'))), 'and v77 is on the path')
      .toEqual(migrated)
  })

  it('is idempotent, and never overwrites a habituation or a publicity a save already has', () => {
    // ⚠ RE-ARMED RATHER THAN RE-DISCOVERED – wave 3's, 4's and 5's own trap, fourth instance.
    // `migrateSave` MUTATES ITS PAYLOAD IN PLACE, so an idempotency line that compares the result
    // with the very field the step just wrote compares a thing with itself and stays green under the
    // mutation. The expected values are frozen in a separate object BEFORE the call.
    const once = migrateSave(v76())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // ⚠⚠ `??=` AND NEVER `||=`, ASSERTED WHERE IT COULD BE BROKEN CHEAPEST. A save that already
    // carries a habituation and a leaked, wrongly-told, already-aired episode keeps every one of
    // them whole – which is what every wave-6 career will look like the moment T4, T6 and T7 land.
    // The sentinels are chosen to be the values `||=` would clobber: `0` reads falsy, `false` reads
    // falsy, and a `publicWeek` of `0` is a real week.
    const kept = {
      spotlightHabituation: 0,
      loveEpisodes: [
        { ...preV77Row(0, null, 2), publicWeek: 0, publicWrong: false, airedMetWeek: 0, airedEndedWeek: null },
        { ...preV77Row(300, 380, 305), publicWeek: 310, publicWrong: true, airedMetWeek: 311, airedEndedWeek: 381 },
      ],
    }
    const lived = { ...v76(), schemaVersion: 76, ...JSON.parse(JSON.stringify(kept)) }
    const out = migrateSave(lived) as unknown as Record<string, unknown>
    expect(out.spotlightHabituation, 'a habituation already on the record is kept whole').toBe(0)
    // ⚠ RE-AIMED BY WAVE 7's v83 (18.09): the ladder now holds a SECOND per-row step, so a v76 row
    // walked to the head also gains `latchedWeek`/`partnerName`, both null. The claim of THIS case
    // is untouched – every v77 sentinel survives whole – and the v83 step's own `??=` sentinels are
    // asserted where they belong, in tests/wave7-wedding-schema.test.ts.
    expect(out.loveEpisodes, 'and so is every field of every row').toEqual(
      kept.loveEpisodes.map((row) => ({ ...row, latchedWeek: null, partnerName: null })),
    )
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes five literals and reaches no sub-stream at all,
    // so the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched by construction
    // rather than by measurement. This asserts the construction.
    const before = JSON.stringify(v76().rngMain)
    expect(JSON.stringify(migrateSave(v76()).rngMain)).toBe(before)
  })

  it('every older fixture reaches v77 carrying the world key', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this
    // asks the one question that is about THIS step – the key is PRESENT on all of them, however old,
    // so no reader downstream needs an `undefined` branch beside its own.
    for (const v of [0, 25, 35, 60, 70, 72, 73, 74, 75, 76]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8'))) as unknown as Record<string, unknown>
      for (const key of V77_WORLD_KEYS) expect(key in migrated, `v${v}.json / ${key}`).toBe(true)
      expect(migrated.spotlightHabituation, `v${v}.json`).toBe(0)
    }
  }, 30_000)
})

// =================================================================================================
// B. ⭐⭐⭐ THE PER-ENTRY BACK-FILL – CRAFTED, BECAUSE THE CORPUS CANNOT WITNESS IT
// =================================================================================================
//
// ⚠⚠ THE ARCHITECT'S RULING B OF 14.09, MADE MECHANICAL. «A back-fill loop proven only by the
// goldens is a loop that has never executed, and a v77 fixture regenerating green would be the
// receipt for work nothing did.» Every case here builds its own v76 payload.
describe('wave 6 T1 B – the walk over `loveEpisodes`, on a payload built for it', () => {
  it('⚠ the golden corpus really does carry ZERO love episodes – the measurement §B exists for', () => {
    // ⚠ ASSERTED RATHER THAN QUOTED, so the claim above cannot rot into a sentence nobody re-checks.
    // Measured 14.09: v74, v75 and v76 each hold `loveEpisodes: []` and everything below v74 predates
    // the field entirely.
    //
    // ⚠⚠ AND IF THIS EVER GOES RED, THAT IS A WELCOME CHANGE AND NOT A REGRESSION – said here so the
    // next reader does not repair it by deleting a row. A later wave that ships a fixture carrying a
    // real attachment gives this corpus its first row-level witness: re-aim the count, keep the
    // sentence, and KEEP §B's crafted cases anyway. A crafted two-row payload is strictly stronger
    // than a borrowed one-row fixture, because ARM 1 – a loop that skips the first entry – is
    // invisible to any corpus with fewer than two rows in one save.
    const files = readdirSync(SAVES).filter((f) => /^v\d+\.json$/.test(f))
    expect(files.length, 'the corpus is the whole ladder, v0 to the head').toBe(SAVE_SCHEMA_VERSION + 1)
    const carrying = files.filter((f) => {
      const rows = JSON.parse(readFileSync(`${SAVES}/${f}`, 'utf8')).loveEpisodes
      return Array.isArray(rows) && rows.length > 0
    })
    // ⚠ RE-AIMED 18.09 BY WAVE 7's v83, AND IT IS THE WELCOME RED THE NOTE ABOVE PREDICTED, answered
    // exactly as it asked: the count re-aimed, the sentence kept, §B's crafted cases kept. v83.json
    // is the corpus's FIRST fixture holding a real attachment – a probe career, so the per-row walks
    // finally execute on a golden save – and it is still the ONLY one, which is what this now pins:
    // every fixture BELOW v83 runs the v77 and v83 walks zero times, so the crafted payloads here
    // and in tests/wave7-wedding-schema.test.ts remain the only witnesses with two rows in one save.
    // ⚠ RE-AIMED 19.09 BY v84 (the album's `prologueTrace`), the same welcome red one version on:
    // v84.json is the SAME probe career walked up by the v25 recipe (`migrateSave(v83.json)` – its
    // README row records the choice), so it carries the same two episode rows. The claim is
    // unchanged – every fixture BELOW v83 still runs the per-row walks zero times.
    // ⚠ RE-AIMED 20.09 BY v85 (wave 8 T1 – the pregnancy and the return), the same welcome red one
    // version on: v85.json is that SAME probe career walked up by the v25 recipe once more
    // (`migrateSave(v84.json)` – its README row records it), so it carries the same two episode rows.
    // The claim is unchanged – every fixture BELOW v83 still runs the per-row walks zero times – and
    // §B's crafted two-row cases stay, because ARM 1 remains invisible to a corpus of borrowed rows.
    // ⚠ RE-AIMED 22.09 BY v86 (wave 10 – the dynasty), the same welcome red one version on: v86.json
    // is that SAME probe career walked up by the v25 recipe once more (`migrateSave(v85.json)` – its
    // README row records it), so it carries the same two episode rows. The claim is unchanged – every
    // fixture BELOW v83 still runs the per-row walks zero times.
    // ⚠ RE-AIMED 22.09 BY v87 (wave 11 – the weight), the same welcome red one version on: v87.json
    // is that SAME probe career walked up by the v25 recipe once more (`migrateSave(v86.json)` – its
    // README row records it), so it carries the same two episode rows. The claim is unchanged – every
    // fixture BELOW v83 still runs the per-row walks zero times.
    // ⚠ RE-AIMED 23.09 BY v88 (wave 12 – the parting), the same welcome red one version on, and
    // this one is the plainest of the five: v88 appends NO KEY AT ALL (three union widenings), so
    // v88.json is `migrateSave(v87.json)` with `schemaVersion` the only line that moved – the same
    // probe career, the same two episode rows. The claim is unchanged: every fixture BELOW v83 still
    // runs the per-row walks zero times.
    expect(carrying, 'exactly the wave-7 probe and its migrated heads hold an attachment, and no older golden ever has').toEqual(['v83.json', 'v84.json', 'v85.json', 'v86.json', 'v87.json', 'v88.json'])
  })

  it('⭐⭐⭐ back-fills all four fields on EVERY row – a live one and an ended one, in one payload', () => {
    // ⚠⚠ TWO ROWS AND NOT ONE, WHICH IS THE WHOLE DESIGN OF THIS CASE. A loop that touches only the
    // last entry, or only the first, or breaks after one, is correct on a one-row save and wrong on
    // every real career – and the corpus above cannot tell the difference. ⚠ The two rows are
    // deliberately DIFFERENT KINDS: one still going (`endedWeek === null`, the active attachment the
    // derivation reads) and one long over, because «the world never learned» has to be back-filled
    // onto a finished romance exactly as onto a live one.
    const rows = [preV77Row(200, 260, 205), preV77Row(300, null, null)]
    const lived = { ...v76(), schemaVersion: 76, loveEpisodes: JSON.parse(JSON.stringify(rows)) }
    for (const row of lived.loveEpisodes as Record<string, unknown>[]) {
      for (const field of V77_ROW_FIELDS) {
        expect(field in row, `the control row genuinely has no ${field}`).toBe(false)
      }
    }

    const out = migrateSave(lived) as unknown as { loveEpisodes: LoveEpisode[] }
    expect(out.loveEpisodes, 'both rows are still there – the list is append-only and never pruned').toHaveLength(2)
    for (const [i, row] of out.loveEpisodes.entries()) {
      expect(row.publicWeek, `row ${i}: the world never learned, and null is that rather than week 0`).toBeNull()
      expect(row.publicWrong, `row ${i}: no story ran, so no story ran wrong`).toBe(false)
      expect(row.airedMetWeek, `row ${i}: the booth never voiced it – there was no channel`).toBeNull()
      expect(row.airedEndedWeek, `row ${i}: nor the other half of it`).toBeNull()
    }
    // ⚠ AND THE ROWS ARE STILL THE ROWS THEY WERE: the step ADDS four fields and rewrites nothing.
    // An ending stays ended, a live row stays live, and what the parent was told is a fact about the
    // past that a schema move does not get to revise.
    expect(out.loveEpisodes[0].endedWeek, 'the ended row is still ended').toBe(260)
    expect(out.loveEpisodes[0].knownWeek, 'and he was still told in 205').toBe(205)
    expect(out.loveEpisodes[1].endedWeek, 'the live row is still live').toBeNull()
    expect(out.loveEpisodes[1].knownWeek, 'and he was never told about this one').toBeNull()
  })

  it('⭐⭐ the rows keep their ORDER and their identity – row 0 is still row 0 after the walk', () => {
    // ⚠ THE ORDERING HALF, and it is a second claim rather than a restatement. `loveEpisodes` is
    // append-only and the ACTIVE attachment is DERIVED as «the last row with `endedWeek === null`»
    // (world/loveEpisodes.ts), so a step that rebuilt the list – mapped it, filtered it, sorted it –
    // could back-fill all four fields correctly on every row and still hand the engine a different
    // career. ARM 1 is caught twice for this reason: once by the case above and once here.
    const rows = [preV77Row(100, 150, 101), preV77Row(200, 260, 205), preV77Row(300, null, 302)]
    const lived = { ...v76(), schemaVersion: 76, loveEpisodes: JSON.parse(JSON.stringify(rows)) }
    const out = migrateSave(lived) as unknown as { loveEpisodes: LoveEpisode[] }
    expect(out.loveEpisodes.map((r) => r.id), 'three rows, in the order the career lived them')
      .toEqual(['p:100', 'p:200', 'p:300'])
    for (const [i, row] of out.loveEpisodes.entries()) {
      expect(row.sinceWeek, `row ${i} is the row it was`).toBe(rows[i].sinceWeek)
      expect(row.publicWeek, `row ${i} was reached by the loop`).toBeNull()
      expect('publicWrong' in row, `row ${i} was reached by the loop`).toBe(true)
    }
  })

  it('⚠ adds EXACTLY four fields to a row and touches no field that was already there', () => {
    // The whole-row form of §C's whole-payload claim: a migration is free to back-fill correctly and
    // stamp something else on the way past, and the only assertion that notices is one that looks at
    // every OTHER field.
    const row = preV77Row(300, null, 302)
    const lived = { ...v76(), schemaVersion: 76, loveEpisodes: [JSON.parse(JSON.stringify(row))] }
    const out = migrateSave(lived) as unknown as { loveEpisodes: Record<string, unknown>[] }
    const after = out.loveEpisodes[0]
    // ⚠ RE-AIMED AT v83 (18.09, the wedding – wave 7 T1), NOT WEAKENED. This case walks a v76
    // payload to the CURRENT schema, and the ladder now holds a SECOND per-row step: v83 appends
    // `latchedWeek` and `partnerName` (both null) after v77's four. «Exactly its own fields and
    // nothing else» is still the claim – the list is just two versions long now, and a seventh
    // field arriving is still a red line here.
    expect(Object.keys(after).filter((k) => !(k in row)).sort(), 'exactly six fields arrive, and they are these six')
      .toEqual([...V77_ROW_FIELDS, 'latchedWeek', 'partnerName'].sort())
    for (const key of Object.keys(row)) {
      expect(JSON.stringify(after[key]), `${key} survives the step untouched`).toBe(JSON.stringify(row[key]))
    }
    // ⚠ AND THE FOUR ARE APPENDED AFTER THE SIX, which is not decoration: `careerHashAtSchema`'s
    // nested peel restores the v76 serialisation by RESTING each row, and object rest preserves the
    // relative order of what it keeps – so a back-fill that inserted a field in the middle would
    // still peel correctly, but a row written by `rollArrival` and a row written by this migration
    // would serialise differently and two careers with the same history would hash apart.
    // ⚠ RE-AIMED AT v83 FOR THE SAME SERIALISATION-PARITY REASON: the v82 -> v83 walk `??=`s
    // `latchedWeek` then `partnerName`, in `rollArrival`'s own literal order, so a migrated row and
    // a born row still serialise identically – which is what the order pin below now also proves.
    expect(Object.keys(after), 'the six v74 fields first, then v77\'s four, then v83\'s two')
      .toEqual(['id', 'sinceWeek', 'endedWeek', 'knownWeek', 'wants', 'partnerId', ...V77_ROW_FIELDS, 'latchedWeek', 'partnerName'])
  })

  it('⚠ an empty list and an absent list are both handled, and neither throws', () => {
    // The two shapes the loop meets in the wild besides a real list. `[]` is what every golden save
    // carries; ABSENT is what a hand-built probe world carries (`rollArrival`'s own `??=` courtesy
    // has the same reason), and a migration that walked `undefined` would throw on a save nobody
    // could then load.
    expect((migrateSave({ ...v76(), schemaVersion: 76, loveEpisodes: [] }) as unknown as Record<string, unknown>).loveEpisodes).toEqual([])
    const noList = { ...v76(), schemaVersion: 76 } as Record<string, unknown>
    delete noList.loveEpisodes
    expect(() => migrateSave(noList), 'a payload with no list at all migrates rather than throwing').not.toThrow()
  })
})

// =================================================================================================
// C. THE MIGRATION PIN – ONE WORLD KEY ADDED AND NOT ONE PRE-EXISTING KEY TOUCHED
// =================================================================================================
describe('wave 6 T1 C – what the step adds, and everything it leaves alone', () => {
  it('⭐⭐ adds EXACTLY the one world key and moves no key that was already there', () => {
    // ⚠⚠ THE WHOLE-PAYLOAD FORM, because «the back-fill is right» and «nothing else moved» are two
    // different claims and §A only makes the first. A migration is free to back-fill correctly and
    // stamp something else on the way past – v70's refused draw back-fill is the shape of the mistake
    // – and the only assertion that notices is one that looks at every OTHER key.
    const before = v76()
    const after = migrateSave(v76()) as unknown as Record<string, unknown>

    // ⚠⚠ RE-AIMED BY ROUND 42's v78 BUNDLE (#35 + round 41 #22 + #45), NOT WEAKENED, AND THE RE-AIM IS
    // THE WHOLE POINT OF THE CASE RATHER THAN A CONCESSION TO IT. `migrateSave` always walks to the
    // LADDER'S HEAD, so from the day a v78 exists this comparison stops measuring «what the v77 step
    // did» and starts measuring «what the whole tail of the ladder did» – which is a different claim
    // and one this file has no business making. Left alone it would have gone red on v78's three world
    // keys and on `assets` (whose rows gain `entries`), for a reason that has nothing to do with the
    // spotlight.
    //
    // ⭐ THE FIX IS A SECOND WALK, NOT AN EXCLUSION LIST. What every version ABOVE 77 does is measured
    // by migrating `v77.json` – the same career, one rung up – and the two effects are then subtracted.
    // So this case goes on saying exactly what it always said, it needs no maintenance when v79 lands,
    // and a v78 that broke something of v77's would still redden it.
    const v77Payload = JSON.parse(readFileSync(`${SAVES}/v77.json`, 'utf8')) as Record<string, unknown>
    const fromV77 = migrateSave(JSON.parse(JSON.stringify(v77Payload))) as unknown as Record<string, unknown>
    const addedAbove77 = Object.keys(fromV77).filter((k) => !(k in v77Payload))
    const movedAbove77 = Object.keys(v77Payload).filter(
      (k) => JSON.stringify(v77Payload[k]) !== JSON.stringify(fromV77[k]),
    )

    const added = Object.keys(after).filter((k) => !(k in before) && !addedAbove77.includes(k))
    expect(added.sort(), 'exactly one key arrives, and it is this one').toEqual([...V77_WORLD_KEYS].sort())
    expect(Object.keys(before).every((k) => k in after), 'and not one key is dropped').toBe(true)

    // ⚠ EVERY OTHER KEY BYTE-IDENTICAL, compared through `JSON.stringify` per key rather than through
    // one whole-object equality, so a failure NAMES the key instead of printing a 570 kB diff.
    // ⚠ `movedAbove77` is skipped for the reason above and it is MEASURED, never listed: today it is
    // `schemaVersion` and `assets`, and whatever a later version moves joins it without an edit here.
    for (const key of Object.keys(before)) {
      if (key === 'schemaVersion' || movedAbove77.includes(key)) continue
      expect(JSON.stringify(after[key]), `${key} survives the step untouched`).toBe(JSON.stringify(before[key]))
    }
    expect(before.schemaVersion, 'the control really was a v76 payload').toBe(76)
    expect(v77Payload.schemaVersion, '...and the rung this case is about is genuinely v77').toBe(77)
    expect(after.schemaVersion, '...and the version key moved, to the head of the ladder').toBe(SAVE_SCHEMA_VERSION)
  })

  it('⚠ leaves `temperament` and the walls exactly where it found them', () => {
    // who-she-is §2a's own sentence, carried one version on: identity is IMMUTABLE and the walls are
    // expression over it. A schema move that had quietly re-derived either would be the gravest
    // finding this wave could produce, and it would be invisible to every other case in this file
    // because a temperament is just a string that is always some valid string.
    const before = v76()
    const after = migrateSave(v76()) as unknown as Record<string, unknown>
    expect(typeof before.temperament, 'the control really carries a temperament').toBe('string')
    expect(after.temperament, 'she was born this way and the step does not touch it').toBe(before.temperament)
    expect(after.wallsLean, 'and her expression is where v76 left it').toEqual(before.wallsLean)
    expect(after.wallsFlipped, 'flips included').toEqual(before.wallsFlipped)
  })
})

// =================================================================================================
// D. ⭐⭐⭐ THE ZERO-DIFF PIN – A WALK, WITH THE CONTROL NEUTRALISED IN PLACE
// =================================================================================================
describe('wave 6 T1 D – a career walks the same weeks it walked before', () => {
  it('⭐⭐⭐ 156 weeks with `spotlightHabituation` and 156 weeks WITHOUT it produce the same world, key for key', () => {
    // ⚠⚠ THE CONTROL IS THE CHANGE NEUTRALISED IN PLACE AND NEVER A SECOND COMMIT, which is
    // CLAUDE.md's own rule for a shared checkout: the B arm is this tree, the A arm is this tree with
    // the key DELETED off a live world – which is precisely the v76 shape, since v76 is «this world
    // without this key». Two code versions cannot run in one process; a world stripped of the field
    // is the honest equivalent, and it is stronger than a version comparison in one respect: if any
    // line of the engine had learned to read it, the A arm would diverge or throw rather than quietly
    // agreeing (ARM 8).
    //
    // ⚠ WHAT IT PROVES AND WHAT IT DOES NOT. It proves that nothing in the weekly tick consults
    // `spotlightHabituation` over 156 weeks of a real career including its matches, its money and its
    // draws. It says nothing yet about T4's growth pass, which is exactly the wave that will move
    // these worlds on purpose – and when it does, this case goes red and is RE-AIMED with the pass's
    // own output asserted on both arms, which is what wave 5's T7 did to its twin one version down.
    //
    // ⚠⚠ T4 LANDED (14.09) AND THIS CASE DID **NOT** GO RED – measured, and the prediction above was
    // wrong for a reason worth keeping rather than deleting. `growHabituation` is gated on
    // the news standing (`newsStandingOf`, D1's rank bands), and ruling D measured the frozen corpus's peak fame at 0.00–3.43 against a bar
    // of 30: this career is never news at any of its 156 weeks, so the pass runs every week and
    // counts nothing, and BOTH arms end without the key ever moving. The assertions are therefore
    // untouched – re-aiming a pin that did not move would be a diff with no claim behind it (T3b's
    // own lesson) – and what IS re-aimed is this note, because a green case under a comment that
    // predicts red is how a pin stops being read. ⚠ The day a fixture in this file becomes news, the
    // prediction above comes back into force exactly as written.
    const withKey = walk(createWorld('wave6-walk'), 156)

    const stripped = createWorld('wave6-walk') as unknown as Record<string, unknown>
    for (const key of V77_WORLD_KEYS) delete stripped[key]
    for (const key of V77_WORLD_KEYS) {
      expect(key in stripped, `the A arm really has no ${key}`).toBe(false)
    }
    const withoutKey = walk(stripped as unknown as WorldState, 156) as unknown as Record<string, unknown>

    const b = JSON.parse(JSON.stringify(withKey)) as Record<string, unknown>
    for (const key of V77_WORLD_KEYS) {
      expect(b[key], `the B arm carries ${key} through the walk`).toBeDefined()
      delete b[key]
    }
    expect(Object.keys(withoutKey).sort(), 'the two arms end with the same key set once the v77 key is off')
      .toEqual(Object.keys(b).sort())
    for (const key of Object.keys(b)) {
      expect(JSON.stringify(withoutKey[key]), `${key} is byte-identical across the two arms`)
        .toBe(JSON.stringify(b[key]))
    }
    // ⚠ AND THE WALK REALLY WALKED, so the identity above is not the identity of two empty worlds –
    // the null-arm check CLAUDE.md demands of every null result, run in the cheapest direction there
    // is. 156 weeks, a career lived, a MAIN position that has advanced.
    expect(withKey.week, 'the arms really walked 156 weeks').toBe(156)
    expect(withKey.rngMain.n, '...and really spent MAIN draws doing it').toBeGreaterThan(0)
    expect(withKey.events.length, '...and really lived a career').toBeGreaterThan(10)
  }, 120_000)

  it('⭐⭐⭐ and a career CARRYING ATTACHMENTS walks the same weeks with the four row fields and without them', () => {
    // ⚠⚠ THE ROW-LEVEL HALF OF THE SAME CLAIM, and it needs its own case because the walk above can
    // never reach one: `createWorld` opens at week 0 with the kid at eight and the arrival hazard is
    // gated on `kidAgeExact >= 16`, so a 156-week no-action walk from birth is not guaranteed an
    // attachment. Both arms are therefore HANDED the same two rows – one ended, one live – and the A
    // arm has v77's four fields stripped from each of them, which is precisely the v76 row shape.
    //
    // ⚠ The rows are planted at week 0 on a world that will walk past them, so the beats, the diary
    // bands, the bond reads and the spirit lift that read `loveEpisodes` are all exercised on both
    // arms. If any of them had learned to read one of the four fields, the A arm would diverge.
    const rows = (): LoveEpisode[] => [
      { ...preV77Row(20, 60, 25), publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null } as LoveEpisode,
      { ...preV77Row(80, null, 85), publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null } as LoveEpisode,
    ]
    const withFields = createWorld('wave6-rows')
    withFields.loveEpisodes = rows()

    const stripped = createWorld('wave6-rows')
    stripped.loveEpisodes = rows().map((row) => {
      const bare = { ...row } as unknown as Record<string, unknown>
      for (const field of V77_ROW_FIELDS) delete bare[field]
      return bare as unknown as LoveEpisode
    })
    for (const row of stripped.loveEpisodes as unknown as Record<string, unknown>[]) {
      for (const field of V77_ROW_FIELDS) expect(field in row, `the A arm's row really has no ${field}`).toBe(false)
    }

    const a = walk(stripped, 156) as unknown as Record<string, unknown>
    const bWorld = walk(withFields, 156)
    const b = JSON.parse(JSON.stringify(bWorld)) as Record<string, unknown>

    // The two lists are the one key that is EXPECTED to differ – by exactly the four fields – so it is
    // compared after the strip and every other key is compared whole.
    const strip = (list: unknown): unknown =>
      (list as Record<string, unknown>[]).map((row) => {
        const bare = { ...row }
        for (const field of V77_ROW_FIELDS) delete bare[field]
        return bare
      })
    expect(JSON.stringify(strip(a.loveEpisodes)), 'the rows themselves are the same rows, four fields aside')
      .toBe(JSON.stringify(strip(b.loveEpisodes)))
    for (const key of Object.keys(b)) {
      if (key === 'loveEpisodes') continue
      expect(JSON.stringify(a[key]), `${key} is byte-identical across the two arms`).toBe(JSON.stringify(b[key]))
    }
    // ⚠ THE NULL-ARM CHECK, and on this case it has a second half worth having: the rows must still be
    // there at the end, or the two arms agreed about a career that threw its attachments away.
    expect(bWorld.week, 'the arms really walked 156 weeks').toBe(156)
    expect(bWorld.loveEpisodes.length, 'and the attachments are still on the record').toBeGreaterThanOrEqual(2)
    expect(bWorld.lifeLog.length, '...and the beats they raise really were lived').toBeGreaterThan(0)
  }, 120_000)

  it('⚠ and the five fields come out of a walked career exactly as they went in – T1 ships no reader', () => {
    // The other direction of the same claim, and the one that would catch a tick that WROTE one of
    // them: the growth pass is T4, the leak T6 and the booth stamps T7, so after 156 weeks the world
    // key and every row field must still read its birth value.
    //
    // ⚠⚠ RE-AIMED IN ITS PROSE AND NOT IN ITS ASSERTIONS BY T4 (14.09) – wave 5's own practice, for
    // wave 5's reason: «a green line with a lying comment is worse than a red one». The growth pass
    // EXISTS now and runs on every week of this walk; what keeps the counter at 0 is that this career
    // is never news (ruling D: the corpus peaks at 3.43 against a bar of 30), so the pass counts
    // nothing. The line below therefore still reads 0 – but not because «nothing on this tree grows
    // it», which stopped being true the moment `growHabituation` landed.
    const world = walk(createWorld('wave6-no-writer'), 156)
    expect(world.spotlightHabituation, '⚠ the pass ran every week and she was never news').toBe(0)
    for (const row of world.loveEpisodes) {
      expect(row.publicWeek, `${row.id}: no leak exists to make her news`).toBeNull()
      expect(row.publicWrong).toBe(false)
      expect(row.airedMetWeek, `${row.id}: no booth exists to voice it`).toBeNull()
      expect(row.airedEndedWeek).toBeNull()
    }
  }, 120_000)
})

// =================================================================================================
// E. THE READER CENSUS – WHAT MAY NAME THE FIVE FIELDS, EXHAUSTIVELY
// =================================================================================================
describe('wave 6 T1 E – nothing reads them yet, and that is pinned rather than promised', () => {
  it('⭐⭐ `spotlightHabituation` is named in `src/` by exactly four files – three that WRITE or DECLARE it, and T4\'s pass, which does BOTH', () => {
    // ⚠ THE WHOLE-TREE FORM AND NOT A GREP OVER A FOLDER: «no reader» is a claim about `src/`, and a
    // census scoped to `src/engine/` would be silent about a component that reached for it. Comments
    // are stripped first – a pin that reads prose is a pin the next writer repairs by deleting a
    // sentence.
    //
    // ⚠⚠ RE-AIMED BY WAVE 6's T4 (habituation), NOT WEAKENED, AND IT IS THE PIN DOING ITS JOB – the
    // twin of what T2 did to the row-fields case below. `engine/spirit.ts` is the FIRST and ONLY
    // reader-and-writer: `growHabituation` counts the weeks she lived known onto the field and
    // `accrueSpirit` reads it back through `habituationScale`. ⚠ `world/phaseHerWeek.ts` is NOT on
    // this list and that is the line worth reading: the call site hands down a BOOLEAN and names the
    // field nowhere, which is §0.1's dependency inversion visible as an absence. ⚠ The claim stays
    // TOTAL (a full `toEqual`, never a `toContain`), so a fifth file reaching for the field still
    // reddens here; only the list grew, by exactly one name, in the commit that earned it. ⚠ And the
    // case's TITLE moved with it – «every one of them WRITES or DECLARES it» stopped being the whole
    // truth the moment a reader existed, and a title that lies is how a pin stops being read.
    const named = srcFiles()
      .filter(([, source]) => codeOnly(source).includes('spotlightHabituation'))
      .map(([path]) => path)
    expect(named.sort(), 'the declaration, the birth value, the migration – and T4\'s growth and read').toEqual([
      'engine/migrations.ts',
      'engine/spirit.ts',
      'engine/world.ts',
      'engine/world/state.ts',
    ])
  })

  it('⭐⭐ the four row fields are named in `src/` by exactly four files – three that WRITE or DECLARE them, and T2\'s ledger, which READS', () => {
    // ⚠ `lifeBeat.ts` IS ON THIS LIST AND `loveEpisodes.ts` IS NOT, which is the line worth reading.
    // The one place a row is ever born is `rollArrival`'s push (world/lifeBeat.ts), so that file
    // states the four birth values out loud; the file that READS the list – `loveEpisodesOf`,
    // `activeEpisode`, `knownPartner` – does not name them at all, because nothing derives from them
    // yet. T6's leak joins the first list and T7's booth joins the second.
    //
    // ⚠⚠ RE-AIMED BY T2 (the exposure ledger), NOT WEAKENED, AND IT IS THE PIN DOING ITS JOB.
    // `world/spotlight.ts` is the FIRST READER of all four fields: `exposureEventsOf` derives
    // `'aired'` from the two booth stamps and `'wrongStory'` from `publicWeek` + `publicWrong`.
    // T1's own sentence above predicted the shape of this day and named the wrong task – it said the
    // booth (T7) would join, and what actually joined first is the DERIVATION that reads the stamps
    // T7 will write. The claim stays TOTAL (a full `toEqual`, not a `toContain`), so a fifth file
    // reaching for these fields still reddens here; only the list grew, by exactly one name, in the
    // commit that earned it. ⚠ The case's TITLE moved with it: «every one of them WRITES or DECLARES»
    // stopped being true the moment a reader existed, and a title that lies is how a pin stops being
    // read.
    for (const field of V77_ROW_FIELDS) {
      const named = srcFiles()
        .filter(([, source]) => codeOnly(source).includes(field))
        .map(([path]) => path)
      expect(named.sort(), `${field}: the protocol declaration, the one writer, the migration, and T2's ledger`).toEqual([
        'engine/migrations.ts',
        'engine/world/lifeBeat.ts',
        'engine/world/spotlight.ts',
        'shared/protocol/narrative.ts',
      ])
    }
  })

  it('⚠ and nothing in `src/viz` names any of the five – the wave\'s gravest finding, pinned from T1', () => {
    // The brief's §8: no draw and no world import in `src/viz`, and the booth's channel arrives in T7
    // as a nullable packet rather than as a reach into the world. Pinned here, on the version that
    // creates the fields, so the boundary exists before there is anything to put through it.
    const reaching = srcFiles()
      .filter(([path]) => path.startsWith('viz/'))
      .filter(([, source]) => [...V77_WORLD_KEYS, ...V77_ROW_FIELDS].some((f) => codeOnly(source).includes(f)))
      .map(([path]) => path)
    expect(reaching, 'the viz layer renders what it is handed and reads no world field').toEqual([])
  })
})
