// =================================================================================================
// WAVE 5, T1 – THE PSYCHOLOGIST'S YEAR: THE v76 SCHEMA MOVE, ITS SIX KEYS, AND THE ZERO-DIFF PIN
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T1; the walls model is
// `docs/specs/who-she-is-2026-09.md` §2a verbatim (identity IMMUTABLE · repair free, growth work ·
// mechanics read expression, voices read birth). T1 ships SIX seats and deliberately no writer for
// any of them: `hirePsychologist` / `setPsychologistRung` are T2, `setPsychologistFocus` is T3, and
// the weekly leaning pass with its flip hazard is T7. So §A and §B are about a SHAPE and about what
// the migration does and does not do to an old save; §C-§F are about `expressedTemperamentOf`, which
// lands here with ZERO call sites in `src/` outside its own module so that T7's swaps have a floor.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence, because this step raises none
// (invariant 4) – the strings are T9's and land through the architect's read. It asserts nothing
// about a salary, a rung price, a focus effect or a flip hazard: those are T2/T4-T7's and not one of
// them exists on this tree.
//
// ⚠⚠ THE ZERO-DIFF PIN IS THREE ARMS AND THE OBVIOUS SHAPE OF IT CANNOT FAIL, which is said first
// because it is the whole reason this file is laid out the way it is. «A migrated world with
// leanings 0 and nothing flipped behaves exactly as v75 did» written as
// `expect(expressedTemperamentOf(w)).toBe(w.temperament)` on an unflipped world is TRUE BY
// CONSTRUCTION – the function returns birth on that branch and no mutation to the inversion can make
// the line fail. So:
//
//   §C  THE POSITIVE CONTROL, and it is what makes §D mean anything. Hand-set a flip and the bucket
//       must MOVE, to the specific right one – all four births × each axis × both axes at once,
//       enumerated through `TEMPERAMENTS` rather than spot-checked, with the twelve expected buckets
//       written out as LITERALS so a mutation cannot move both sides of the comparison together.
//   §D  THE ZERO ARM, labelled as the by-construction claim it is and admissible only beside §C.
//   §E  THE BEHAVIOUR PIN – the walk, with the control NEUTRALISED IN PLACE (the six keys deleted
//       from a live world, which is the v75 shape exactly) rather than built at another commit.
//   §F  THE READER CENSUS – what may name the six keys and the function, exhaustively.
//
// The fourth arm is not in this file and is named here so this ledger is not read as the whole of
// what was proved: the FROZEN CAREERS. `careerHashAtSchema(…, 75)` walks 156 weeks of five real
// careers on this tree and returns the v75 hashes character for character (`PRE_V76`,
// tests/coachTravelEdgeFixtures.ts, asserted in tests/coach-travel-edge.test.ts). That is the
// repo's own instrument for «the same save walked N weeks on the pre-bump code path», and what it
// actually proves is stated there: the whole serialisation returns once the six keys are peeled –
// `rngMain`, `results`, `events`, the wallet, the body, `temperament` – so no week of those careers
// went differently.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4 duty kept verbatim – a net
// nobody watched fail proves nothing, so what was broken and what went red is written down here
// rather than in a commit message nobody re-reads. Control GREEN first (19 cases here, 401 across the
// eleven affected files); every arm applied by a scripted string edit and UNDONE by the inverse edit,
// never `git checkout`, with the file's md5 checked back to pristine after each one. **No arm came in
// at 0 RED, so there is no null arm to declare.** The scope each count was measured over is named,
// because a red count without its scope is a number and not a measurement.
//
//   ARM 1  the step's six `??=` written as `=`                 1 RED  §A's idempotency case
//   ARM 2  the v75 -> v76 step deleted entirely              112 RED  over §A-§F + migrations.test.ts
//                                                                     + goldenSaves.test.ts: 8 here,
//                                                                     28 and 76 there – every case
//                                                                     that walks the ladder throws
//                                                                     «Save schema 75 is newer than
//                                                                     supported 76»
//   ARM 3  the step back-fills `psychologistRung` with `0`      1 RED  §A's back-fill case
//   ARM 4  the step back-fills `wallsLean` `{open: 1, reg: 0}`  1 RED  §A's back-fill case
//   ARM 5  `wallsFlipped` hand-edited in the golden fixture     2 RED  §A's SHAPE case and §A's
//          from `{open: false…}` to `{open: true…}`                    back-fill/equality case
//   ARM 6  `expressedTemperamentOf` ignores `wallsFlipped.open` 3 RED  §C's openness and both-axes
//          (the openness branch returns birth unconditionally)         cases, and §D's MIGRATED case
//   ARM 7  `temperamentFromAxes` maps `private + steady` to     9 RED  8 here across §C and §D, plus
//          `'deep'` instead of `'quiet'`                               tests/spirit.test.ts's own
//                                                                     uniformity case
//   ARM 8  `accrueSpirit` made to read `world.wallsLean`        2 RED  §E's neutralised-control walk
//                                                                     (the A arm THROWS) and §F's
//                                                                     six-key census
//   ARM 9  a call to `expressedTemperamentOf` planted in        2 RED  §F's call-site census and §E's
//          `src/engine/world/lifeBeat.ts`                              walk, again by the throw
//
// ⚠ AND TWO MORE ARMS LIVE IN ANOTHER FILE, named here so this ledger is not read as the whole of
// what was watched. **ARM 10: the six-key destructure in `careerHashAtSchema` replaced by
// `const preWalls = world`** – 24 RED across all three ladder files (6 in
// tests/coach-travel-edge.test.ts, 8 in the mid-schemas file, 10 in the older-schemas one), because
// every shape any rung rolls back to would then carry six keys no shipped version ever wrote.
// **ARM 11: the destructure kept but the `schemaVersion < 76 ? preWalls` branch removed from the
// chain** – 1 RED, the new v76 case ALONE, every older rung still green, which is what a rung that
// guards only its own version looks like. Both records are in that file's own header block, where the
// constants they guard are.
//
// ⚠⚠ ARM 6 IS THE ENTRY WORTH READING AND IS WHY THIS FILE IS SHAPED THE WAY IT IS. It breaks the
// openness inversion outright – exactly the defect the zero-diff claim is supposed to be insured
// against – and **§D's ZERO ARM DID NOT NOTICE**, because that world has nothing flipped and the
// broken branch is never reached. The three reds are §C's two enumerations and §D's SECOND case, the
// migrated one, which catches it only because that case carries a positive control of its own. A file
// with §D's first case alone would have shipped the mutation green, which is the named failure family
// this pin was built to stay out of.
//
// ⚠ ARM 6 ALSO SAYS SOMETHING ABOUT §C's SET-LEVEL CASES, recorded rather than glossed: the
// PERMUTATION arm and the INVOLUTION arm both stayed GREEN under it, because the collapse it produces
// is the IDENTITY map – which is a permutation and is its own involution. They catch a table that
// maps two births onto one bucket, not a branch that quietly does nothing. The per-birth
// `.not.toBe(birth)` lines are what catch that, and they are why they are there.
//
// ⚠⚠ AND T7 RE-AIMED THREE CASES IN THIS FILE, 13.09 – RECORDED HERE BECAUSE THE LEDGER ABOVE IS T1's
// AND MUST NOT BE REWRITTEN TO LOOK LIKE IT ALWAYS SAID THIS. `driftWalls` is the pass T1 promised
// would come, and it WRITES two of the six keys, so three cases that were exactly right on T1's tree
// went red on T7's. Each is re-aimed at its site with its own ⚠⚠ note:
//
//   · §F's CALL-SITE CENSUS – one file to two, and STRENGTHENED: it now counts ruling A's 3/2 split
//     inside `lifeBeat.ts` per spelling, so the one-line «tidy-up» that re-points `temperamentOf`'s
//     body goes red on 3 -> 5 and 2 -> 0 while leaving the file list untouched.
//   · §E's NEUTRALISED-CONTROL WALK – the two walls keys are stripped off BOTH ends, and what
//     replaces the deleted assertion asserts the pass's own output on that career, so «the A arm grew
//     them back» cannot hide «and put something in them». The four SEAT keys carry the original
//     claim whole.
//   · §F's WALLS-KEY CENSUS – `wallsLean` gained its writer and its only reader in one commit, both
//     `engine/spirit.ts`, so the two lists are now identical and both are still EXACT.
//
// ⚠ A FOURTH CASE STAYED GREEN AND HAD ITS **PROSE** RE-AIMED, which is the one worth naming: §E's
// «no writer» case said «NO LEANING PASS EXISTS YET» and went on passing after the pass landed,
// because that career's bond never leaves the caring band. A green line with a lying comment is worse
// than a red one, so the condition it really holds under is now asserted beside it.
//
// ⚠ ARM 1 IS RE-ARMED RATHER THAN RE-DISCOVERED – wave 3's and wave 4's own trap, third instance.
// `migrateSave` MUTATES ITS PAYLOAD IN PLACE, so an idempotency line that compares the result with
// the very field the step just replaced compares a thing with itself and stays green under the
// mutation. The expected values are therefore frozen in separate objects BEFORE the call and the
// payload handed over is a deep copy.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  expressedTemperamentOf,
  temperamentFromAxes,
  TEMPERAMENTS,
  type Temperament,
} from '../src/engine/spirit'
import { createWorld, tickWeek, skipTournament, closeTournament, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { migrateSave } from '../src/engine/migrations'
// ⚠ T7: `ECONOMY.bond.band` is read by §E's re-aimed second case, which now states the CONDITION its
// two walls assertions hold under instead of asserting them into a comment that stopped being true.
import { ECONOMY } from '../src/engine/economy'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** A fresh deep copy of the v75 golden save every time – `migrateSave` mutates in place, so a shared
 *  payload would let one case decide what the next one sees. Wave 4's own helper, one rung up. */
const v75 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v75.json`, 'utf8'))

/** ⚠ ADDED 14.09 BY WAVE 6's T1, for §B's re-aim and nothing else: the rungs ABOVE v76 are measured
 *  rather than named, and «what they add» is what they add to a v76 payload. Same deep-copy rule as
 *  `v75` above – `migrateSave` mutates in place. */
const v76 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v76.json`, 'utf8'))

/** The six keys v76 appends, in `createWorld`'s literal order – which is also the order
 *  `careerHashAtSchema` peels them in reverse. Written out ONCE here and read by four cases, so a
 *  seventh key arriving in some later wave cannot quietly slip past one of them. */
const V76_KEYS = [
  'psychologistHired',
  'psychologistRung',
  'psychologistFocus',
  'psychologistFocusSeason',
  'wallsLean',
  'wallsFlipped',
  // ⚠ THE SEVENTH, added to the SAME unshipped step pre-merge (14.09, the owner's elite-gate
  // ruling – state.ts's amendment note carries why no v77 is owed). Unlike the six it has a
  // WRITER from birth (`recomputeKidRank` banks the high-water), so §E treats it like the walls
  // pair – re-grown by the walk and asserted on both arms – and the no-writer case asserts it
  // MOVED, as the banker's own positive control.
  'peakDomesticPoints',
] as const

/** Source with every comment removed – `tests/spirit.test.ts`'s own helper verbatim, for §F: a pin
 *  that reads prose is a pin the next writer repairs by deleting a sentence. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – for §F's whole-tree census. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** A plain deterministic walk: `tickWeek` from week 0, tournaments resolved the way every walking
 *  test in this suite resolves them. No event is entered and no command is issued, so the walk is
 *  the WORLD's own arithmetic – which is exactly what «a migrated career plays byte-identical
 *  tennis» is a claim about.
 *
 *  ⚠ `resumeMain(world.rngMain)` AND NOT `rngFromSeed(world.seed)`, which several walking tests in
 *  this suite use and which would have cost this file its best assertion. `resumeMain` is what the
 *  WORKER threads through the tick (v35), and it mutates `world.rngMain` in place – so the persisted
 *  MAIN position advances with the walk and lands INSIDE the key-for-key comparison in §E. With a
 *  fresh stream `rngMain` never moves, and «the two arms agree on `rngMain`» would have been the
 *  agreement of two untouched initial values. Caught by this file's own null-arm check, which is
 *  what that check is for. */
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

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v76's own rung
// =================================================================================================
describe('wave 5 T1 A – v76, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    // ⚠ RE-AIMED AT v77 (14.09, the spotlight took the next rung – `spotlightHabituation` and the four
    // publicity fields on `LoveEpisode`), NOT LOOSENED, and on `tests/wave4-spirit-shock.test.ts`'s
    // own precedent one version down, verbatim – which took it from `tests/wave3-love-episodes.test.ts`,
    // which took it from `tests/wave2-life-beat.test.ts`, which took it from `tests/spirit.test.ts`
    // below that. This case is about v76's OWN RUNG – that the move happened and left a fixture of ITS
    // OWN SHAPE behind – and never about the ladder's head, which moves with every wave. So the head is
    // asserted as a FLOOR and the two claims that actually belong to this rung (the fixture says 76,
    // and it carries the six keys 76 added) are asserted exactly as before. The head's own guard – «a
    // bump forces a new golden save» – lives in tests/goldenSaves.test.ts and is the only place that
    // should ever name a number that changes.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(76)
    const v76 = JSON.parse(readFileSync(`${SAVES}/v76.json`, 'utf8'))
    expect(v76.schemaVersion).toBe(76)
    // ⚠ `in` FIRST AND THE VALUE SECOND, and the difference is the whole shape: a key must be
    // PRESENT, because an absent key is the v75 shape and would migrate again on every load. Two of
    // the six are `null` and one is `false`, so a value check alone would pass on an absent key.
    for (const key of V76_KEYS) {
      expect(key in v76, `the fixture carries ${key}, the key this version added`).toBe(true)
    }
    expect(v76.psychologistHired, 'nobody was ever hired into a seat that did not exist').toBe(false)
    expect(v76.psychologistRung, 'the MIDDLE rung, meaningless until hired – v59\'s masseur dial verbatim').toBe(1)
    expect(v76.psychologistFocus, 'nobody was ever asked what to work on').toBeNull()
    expect(v76.psychologistFocusSeason, '...so no season holds a pick, and that is null and not 0').toBeNull()
    expect(v76.wallsLean, '⭐ zero is the IDENTITY – expression equals nature').toEqual({ open: 0, reg: 0 })
    expect(v76.wallsFlipped, 'nothing has flipped, because nothing could have').toEqual({ open: false, reg: false })
  })

  it('⭐⭐ back-fills six literals, every one of them exactly true rather than a bargain with a pruned log', () => {
    const before = v75()
    for (const key of V76_KEYS) {
      expect(before[key], `the older shape genuinely has no ${key}`).toBeUndefined()
    }
    const migrated = migrateSave(v75())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ THE SEAT: a career that predates the layer was never hired into it, was never asked what to
    // work on, and holds no season's pick – v73's / v74's / v75's own claim, six times over. The rung
    // is the one that is NOT a null, and it is the only one of the six that could have been argued:
    // a dial has to read something, and the shipped default is the only answer that invents no
    // decision the player never made (v59 back-filled `4` sessions onto careers that had never met a
    // masseur, for this reason and in this shape).
    expect(migrated.psychologistHired).toBe(false)
    expect(migrated.psychologistRung).toBe(1)
    expect(migrated.psychologistFocus).toBeNull()
    expect(migrated.psychologistFocusSeason).toBeNull()
    // ⚠⚠ THE WALLS: ZERO IS THE TRUE VALUE AND NOT A PLACEHOLDER FOR ONE. A leaning of 0 means
    // «expression equals nature» (who-she-is §2a), which is what a career that predates the walls has
    // ALWAYS been – there is no pattern in its past to have displaced her, because nothing was
    // reading one. The migration is not «the girl acquires walls»; it is «the girl has always been
    // exactly herself», written down for the first time.
    expect(migrated.wallsLean).toEqual({ open: 0, reg: 0 })
    expect(migrated.wallsFlipped).toEqual({ open: false, reg: false })
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here
    // (ARM 5). ⚠ This line is the one the NEXT wave will have to re-aim, exactly as this wave re-aimed
    // v75's and wave 4 re-aimed v74's: `migrateSave` always walks to the LADDER'S HEAD, so the direct
    // equality holds only while 76 IS the head. The re-aim is the converging form, not a deletion.
    //
    // ⚠⚠ AND IT CAME DUE AT v77 (14.09, the spotlight), EXACTLY AS THE LINE ABOVE PREDICTED IT WOULD –
    // the move wave 5 made to wave 4's line, wave 4 to wave 3's and wave 3 to wave 2's, verbatim and
    // for the identical reason. `migrateSave` walks to the head, so the moment the head moved past 76
    // the migrated payload stopped being a v76 save and the direct equality could never hold again.
    // The claim is unchanged and is made where it stays true: the v76 FIXTURE and the migrated v75
    // payload CONVERGE at the head, byte for byte, which is «the fixture is the migration's own
    // output» carried one rung forward. A hand edit to either file still goes red here (ARM 5), which
    // is the whole point of the line; v76's own shape is pinned by the case above (`schemaVersion` 76,
    // the six keys present at their identity values), and v77's own «produced by the real migration»
    // equality lives at its own rung, in tests/wave6-spotlight-schema.test.ts.
    expect(migrateSave(JSON.parse(readFileSync(`${SAVES}/v76.json`, 'utf8')))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a seat or a leaning a save already has', () => {
    const once = migrateSave(v75())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // The `??=` said out loud, on all six. T2 and T7 will produce exactly these shapes on a live
    // career, and a second load must not fire a psychologist, reset his rung, forget the year he is
    // working on or walk a girl's walls back to nature.
    //
    // ⚠⚠ THE EXPECTED VALUES ARE SEPARATE OBJECTS, AND THAT IS THE WHOLE ASSERTION RATHER THAN A
    // TIDINESS – wave 3's ARM 4 and wave 4's ARM 1, re-armed here rather than re-discovered.
    // `migrateSave` MUTATES THE PAYLOAD IN PLACE, so `expect(migrateSave(lived).wallsLean)
    // .toEqual(lived.wallsLean)` compares the result with ITSELF: a step written `=` instead of `??=`
    // replaces the value on `lived` and both sides move together, green.
    //
    // ⚠ AND `??=` RATHER THAN `||=` IS LOAD-BEARING ON THREE OF THE SIX, which is why the kept world
    // below carries a `false` hire beside a `true` flip and a rung of `0`. `||=` would replace every
    // falsy value on every load – a fired psychologist re-hired, the cheap rung silently promoted to
    // the middle one, a zero leaning rebuilt as a fresh object.
    const kept = {
      psychologistHired: false,
      psychologistRung: 0,
      psychologistFocus: 'recovery',
      psychologistFocusSeason: 0,
      wallsLean: { open: -42.5, reg: 0 },
      wallsFlipped: { open: true, reg: false },
      // 14.09 – the seventh key's sentinel: a banked peak must survive a re-load untouched, and 0
      // is exactly the value `||=` would clobber, which is this case's whole subject.
      peakDomesticPoints: 0,
    }
    const lived = { ...v75(), schemaVersion: 75, ...JSON.parse(JSON.stringify(kept)) }
    const out = migrateSave(lived) as unknown as Record<string, unknown>
    for (const key of V76_KEYS) {
      expect(out[key], `${key} already on the record is kept whole`).toEqual(kept[key as keyof typeof kept])
    }
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes six literals and reaches no sub-stream at all, so
    // the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched by construction
    // rather than by measurement. This asserts the construction.
    const before = JSON.stringify(v75().rngMain)
    expect(JSON.stringify(migrateSave(v75()).rngMain)).toBe(before)
  })

  it('every older fixture reaches v76 carrying all six keys', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this asks
    // the one question that is about THIS step – the keys are PRESENT on all of them, however old, so
    // no reader downstream needs an `undefined` branch beside its own. ⚠ `in` rather than a value
    // check, deliberately: two of the six back-fill to `null`, which an absent key also reads as.
    for (const v of [0, 25, 35, 60, 70, 72, 73, 74, 75]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8'))) as unknown as Record<string, unknown>
      for (const key of V76_KEYS) expect(key in migrated, `v${v}.json / ${key}`).toBe(true)
      expect(migrated.wallsFlipped, `v${v}.json`).toEqual({ open: false, reg: false })
    }
  }, 30_000)
})

// =================================================================================================
// B. THE MIGRATION PIN – SIX KEYS ADDED AND NOT ONE PRE-EXISTING KEY TOUCHED
// =================================================================================================
describe('wave 5 T1 B – what the step adds, and everything it leaves alone', () => {
  it('⭐⭐ adds EXACTLY the six and moves no key that was already there', () => {
    // ⚠⚠ THE WHOLE-PAYLOAD FORM, because «the six are right» and «nothing else moved» are two
    // different claims and the cases in §A only make the first. A migration is free to back-fill
    // correctly and stamp something else on the way past – v70's refused draw back-fill is the shape
    // of the mistake – and the only assertion that notices is one that looks at every OTHER key.
    const before = v75()
    const after = migrateSave(v75()) as unknown as Record<string, unknown>

    // ⚠⚠ RE-AIMED AT v77 (14.09, the spotlight), NOT WEAKENED, AND THE RE-AIM WAS PREDICTED BY THE
    // SIBLING LINE THIS FILE ALREADY CARRIES: `migrateSave` walks to the LADDER'S HEAD, so the keys a
    // v75 payload gains are v76's seven PLUS everything every rung above v76 adds. The alternative –
    // hard-coding `spotlightHabituation` into this list – would have made a case about v76's OWN RUNG
    // carry a maintenance debt for every future wave, and would have said nothing about which rung
    // added what. So the later rungs are MEASURED rather than named: what the chain above v76 adds is
    // exactly what it adds to a v76 payload, and v76's own seven stay asserted BY NAME beside it.
    // The claim is unchanged, it is still EXACT (a `toEqual` over a total set, not a `toContain`), and
    // a v78 that quietly added an eighth key to v76's shipped step would still go red here.
    const laterRungs = Object.keys(migrateSave(v76()) as unknown as Record<string, unknown>)
      .filter((k) => !(k in v76()))

    const added = Object.keys(after).filter((k) => !(k in before))
    expect(added.sort(), 'exactly v76\'s seven plus whatever the rungs above it add, and nothing else')
      .toEqual([...V76_KEYS, ...laterRungs].sort())
    expect(laterRungs.sort(), 'and the rungs above v76 are the ones this wave knows about')
      .toEqual(['spotlightHabituation'])
    expect(Object.keys(before).every((k) => k in after), 'and not one key is dropped').toBe(true)

    // ⚠ EVERY OTHER KEY BYTE-IDENTICAL, compared through `JSON.stringify` per key rather than through
    // one whole-object equality, so a failure NAMES the key instead of printing a 570 kB diff.
    // `schemaVersion` is the one key that is expected to move and is asserted separately, in §A.
    // ⚠ This loop covers the WHOLE chain from 75 to the head rather than v76's step alone, and that is
    // deliberate: a later rung that MOVED a pre-existing key would go red here, which is exactly what
    // this case should do. v77 moves none – its own per-row walk touches `loveEpisodes`, and this
    // fixture carries `[]`.
    for (const key of Object.keys(before)) {
      if (key === 'schemaVersion') continue
      expect(JSON.stringify(after[key]), `${key} survives the step untouched`).toBe(JSON.stringify(before[key]))
    }
    expect(before.schemaVersion, 'the control really was a v75 payload').toBe(75)
    expect(after.schemaVersion, '...and the chain ran to the head').toBe(SAVE_SCHEMA_VERSION)
  })

  it('⚠ leaves `temperament` exactly where it found it – identity is IMMUTABLE (who-she-is §2a)', () => {
    // ⚠⚠ THE ONE SENTENCE OF §2a THAT THE WHOLE WAVE RESTS ON, asserted where it could be broken
    // cheapest. The walls are DISPLACEMENT OF EXPRESSION over an unchanging nature: «therapy and
    // years never turn a quiet girl into a sunny one». A migration that had helpfully re-derived her
    // temperament, or nudged it to match a zero leaning, would be the gravest finding this wave could
    // produce – and it would be invisible to every other case in this file, because a temperament is
    // just a string that is always some valid string.
    const before = v75().temperament
    expect(typeof before, 'the control really carries a temperament (v72 back-filled it)').toBe('string')
    expect(migrateSave(v75()).temperament, 'she was born this way and the step does not touch it').toBe(before)
  })
})

// =================================================================================================
// C. ⭐⭐⭐ THE POSITIVE CONTROL – `expressedTemperamentOf` MOVES, AND TO THE RIGHT BUCKET
// =================================================================================================
//
// ⚠⚠ THIS SECTION IS WHAT MAKES §D ADMISSIBLE. See the file header: the zero arm is true by
// construction and proves nothing on its own. Here the flags are set BY HAND – T7 has no writer on
// this tree – and the expected bucket is written out as a LITERAL for every one of the twelve
// combinations, never derived from `temperamentOpenness` / `temperamentIntensity`, because an
// expectation built out of the projections would move with a mutation to them and stay green (the
// «an equality comparing two arms to each other is invisible to a mutation that moves both» family,
// recorded three times in this layer already).
describe('wave 5 T1 C – the walls, expressed', () => {
  /** The §2a table, written out. Rows are BIRTH; columns are which axis is flipped.
   *  Flipping `open` swaps sunny<->quiet and fiery<->deep; flipping `reg` swaps sunny<->fiery and
   *  quiet<->deep; flipping both is the diagonal. */
  const EXPRESSED: Record<Temperament, { open: Temperament; reg: Temperament; both: Temperament }> = {
    sunny: { open: 'quiet', reg: 'fiery', both: 'deep' },
    fiery: { open: 'deep', reg: 'sunny', both: 'quiet' },
    quiet: { open: 'sunny', reg: 'deep', both: 'fiery' },
    deep: { open: 'fiery', reg: 'quiet', both: 'sunny' },
  }

  /** A world that is nothing but a birth temperament and a flip pair – the two fields the function
   *  reads, and nothing else, so the case cannot be passing for some other reason. */
  function poked(birth: Temperament, open: boolean, reg: boolean): WorldState {
    return { temperament: birth, wallsFlipped: { open, reg } } as unknown as WorldState
  }

  it('⭐⭐⭐ a FLIPPED openness axis moves her to the other openness pole, keeping her intensity', () => {
    for (const birth of TEMPERAMENTS) {
      const got = expressedTemperamentOf(poked(birth, true, false))
      expect(got, `${birth} with her openness axis flipped`).toBe(EXPRESSED[birth].open)
      expect(got, `...and it really MOVED – ${birth} is not its own flip`).not.toBe(birth)
    }
  })

  it('⭐⭐⭐ a FLIPPED regulation axis moves her to the other intensity pole, keeping her openness', () => {
    for (const birth of TEMPERAMENTS) {
      const got = expressedTemperamentOf(poked(birth, false, true))
      expect(got, `${birth} with her regulation axis flipped`).toBe(EXPRESSED[birth].reg)
      expect(got, `...and it really MOVED – ${birth} is not its own flip`).not.toBe(birth)
    }
  })

  it('⭐⭐⭐ BOTH axes flipped is the diagonal – the one bucket that shares neither pole with birth', () => {
    for (const birth of TEMPERAMENTS) {
      const got = expressedTemperamentOf(poked(birth, true, true))
      expect(got, `${birth} with both axes flipped`).toBe(EXPRESSED[birth].both)
      expect(got, `...and it really MOVED`).not.toBe(birth)
      // ⚠ THE DIAGONAL IS ALSO THE ONE THAT DIFFERS FROM BOTH SINGLE FLIPS, which is the property
      // that would survive a table typed out wrong in a way the two cases above could not see.
      expect([EXPRESSED[birth].open, EXPRESSED[birth].reg], `${birth}: the diagonal is its own bucket`)
        .not.toContain(got)
    }
  })

  it('⚠ the four flips out of the four births are a PERMUTATION on each axis – no bucket is a sink', () => {
    // The set-level claim behind the three cases above, and it is the one that catches a table where
    // two births happen to map to the same expressed bucket: an inversion is a bijection, so each
    // axis's four outputs must be the four temperaments exactly once. A `wallsFlipped` read that
    // collapsed (say, always returning `'private'`) would satisfy a spot-check and fail here.
    for (const axis of [{ open: true, reg: false }, { open: false, reg: true }, { open: true, reg: true }]) {
      const out = TEMPERAMENTS.map((t) => expressedTemperamentOf(poked(t, axis.open, axis.reg)))
      expect([...out].sort(), `flip ${JSON.stringify(axis)} permutes the four`).toEqual([...TEMPERAMENTS].sort())
    }
  })

  it('⚠ it is an INVOLUTION – flipping the same axis twice is birth again', () => {
    // The other half of «a flip is an inversion and never a drift»: expression of expression, under
    // the same flags, returns her. This is what makes a round trip in T7 (walls up, then a career of
    // care walking them back down) land on the girl who was born, not on a third bucket.
    for (const birth of TEMPERAMENTS) {
      for (const axis of [{ open: true, reg: false }, { open: false, reg: true }, { open: true, reg: true }]) {
        const once = expressedTemperamentOf(poked(birth, axis.open, axis.reg))
        expect(expressedTemperamentOf(poked(once, axis.open, axis.reg)), `${birth} there and back`).toBe(birth)
      }
    }
  })

  it('⚠ the composition itself is the section header\'s own table, written out', () => {
    // `temperamentFromAxes` is the ONE spelling of the pole-to-bucket mapping (the extraction v76 made), so
    // it gets its own literal pin rather than being covered only through its callers.
    expect(temperamentFromAxes('open', 'steady')).toBe('sunny')
    expect(temperamentFromAxes('open', 'intense')).toBe('fiery')
    expect(temperamentFromAxes('private', 'steady')).toBe('quiet')
    expect(temperamentFromAxes('private', 'intense')).toBe('deep')
  })
})

// =================================================================================================
// D. THE ZERO ARM – birth, while nothing is flipped
// =================================================================================================
describe('wave 5 T1 D – the zero-diff read', () => {
  it('⚠ with nothing flipped the expressed girl IS the born girl – true by construction, and §C is why it counts', () => {
    // ⚠⚠ LABELLED AS THE BY-CONSTRUCTION CLAIM IT IS, rather than dressed up as evidence. Both flags
    // false means the two projections round-trip, so no mutation to the INVERSION can make this line
    // fail – ARM 6 broke the openness inversion outright and this section stayed green. It is here
    // because the claim is the wave's floor and has to be written down somewhere; what gives it
    // teeth is §C above, which watches the same function MOVE.
    for (const birth of TEMPERAMENTS) {
      const world = createWorld(`wave5-zero-${birth}`)
      world.temperament = birth
      expect(world.wallsFlipped, 'a fresh career opens unflipped').toEqual({ open: false, reg: false })
      expect(world.wallsLean, '...and at her own nature').toEqual({ open: 0, reg: 0 })
      expect(expressedTemperamentOf(world), `${birth} expresses ${birth}`).toBe(birth)
    }
  })

  it('⚠ and a MIGRATED career reads birth too – which is the claim about old saves, not about new ones', () => {
    // The same read, asked of the shape the migration actually produces, because that is the career
    // the zero-diff promise is made to: somebody's live save, loaded after the update.
    const migrated = migrateSave(v75()) as unknown as WorldState
    expect(migrated.wallsFlipped).toEqual({ open: false, reg: false })
    expect(expressedTemperamentOf(migrated), 'she turns out to have always been exactly herself')
      .toBe(migrated.temperament)
    // ...and the positive control for that negative, so the line above is about a shape and not about
    // a world that happens to agree: flip her by hand and the same call moves.
    const flipped = { ...migrated, wallsFlipped: { open: true, reg: false } } as WorldState
    expect(expressedTemperamentOf(flipped), 'the reader is live on a migrated world too')
      .not.toBe(migrated.temperament)
  })
})

// =================================================================================================
// E. THE BEHAVIOUR PIN – A WALK, WITH THE CONTROL NEUTRALISED IN PLACE
// =================================================================================================
describe('wave 5 T1 E – a career walks the same weeks it walked before', () => {
  it('⭐⭐⭐ 156 weeks with the six keys and 156 weeks WITHOUT them produce the same world, key for key', () => {
    // ⚠⚠ THE CONTROL IS THE CHANGE NEUTRALISED IN PLACE AND NEVER A SECOND COMMIT, which is
    // CLAUDE.md's own rule for a shared checkout: the B arm is this tree, the A arm is this tree with
    // the six keys DELETED off a live world – which is precisely the v75 shape, since v75 is «this
    // world without these six keys». Two code versions cannot run in one process; a world stripped of
    // the fields is the honest equivalent, and it is stronger than a version comparison in one
    // respect: if any line of the engine had learned to read one of the six, the A arm would diverge
    // or throw rather than quietly agreeing.
    //
    // ⚠ WHAT IT PROVES AND WHAT IT DOES NOT. It proves that nothing in the weekly tick consults the
    // six keys or `expressedTemperamentOf`, over 156 weeks of a real career including its matches,
    // its money and its draws.
    //
    // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T7, AND THE RE-AIM IS THIS PIN DOING ITS JOB RATHER THAN BEING
    // REPAIRED AROUND IT. It went RED – «the two arms end with the same key set once the six are off:
    // expected […76] to deeply equal […74]» – the moment `driftWalls` landed, because that pass
    // WRITES two of the six and an A arm that starts without them ends carrying them. The note above
    // predicted exactly this («that pass will move these worlds on purpose»). WHAT CHANGES: the two
    // WALLS keys are stripped off both ends, and what replaces the deleted assertion is STRONGER
    // than a smaller key list – the pass's own output on this career is asserted, so «the A arm grew
    // them back» cannot hide «and put something in them».
    //
    // ⚠ THE FOUR SEAT KEYS ARE UNTOUCHED BY THE RE-AIM and carry the original claim whole: nothing in
    // 156 weeks of tick consults `psychologistHired`, the rung, the focus or the focus season on a
    // career that never hired. That was always the larger half of what this case was for.
    const withKeys = walk(createWorld('wave5-walk'), 156)

    const stripped = createWorld('wave5-walk') as unknown as Record<string, unknown>
    for (const key of V76_KEYS) delete stripped[key]
    for (const key of V76_KEYS) {
      expect(key in stripped, `the A arm really has no ${key}`).toBe(false)
    }
    const withoutKeys = walk(stripped as unknown as WorldState, 156) as unknown as Record<string, unknown>

    // ⭐⭐ WHAT T7's PASS PUT BACK, AND WHAT IS IN IT. `driftWalls` reads both keys defensively and
    // writes them, so the A arm ends carrying them – and on a career whose bond never leaves the
    // caring band the content is her own nature, which is the wave's expected diff on this world
    // being exactly nil. Asserted on BOTH arms, so the strip below cannot launder a difference.
    const WALLS = ['wallsLean', 'wallsFlipped'] as const
    for (const [name, arm] of [['B', withKeys as unknown as Record<string, unknown>], ['A', withoutKeys]] as const) {
      expect(arm.wallsLean, `${name}: the leaning pass ran and left her at her nature`).toEqual({ open: 0, reg: 0 })
      expect(arm.wallsFlipped, `${name}: and nothing armed, so nothing flipped`).toEqual({ open: false, reg: false })
    }
    // ⚠ 14.09 – the seventh key re-grows the same way the walls pair does: `recomputeKidRank`
    // banks the high-water on every fold, so BOTH arms carry it after the walk, with the same
    // value (this career's real best), and it is stripped off both below exactly as the walls
    // are. Asserted equal-and-positive here so «the A arm grew it back» cannot hide «and put a
    // different number in it» – the same reasoning the walls re-aim wrote one screen up.
    expect((withoutKeys as Record<string, unknown>).peakDomesticPoints, 'A: the banker ran on the stripped arm too')
      .toEqual((withKeys as unknown as Record<string, unknown>).peakDomesticPoints)
    // ⚠ EQUALITY AND NOT `> 0`, measured before assumed: a NO-ACTION walk enters no tournaments
    // (entries are the parent's), so this career earns nothing and its honest peak is 0 on both
    // arms. The banker's positive control – a peak banked, held through decay, opening the gate –
    // lives on a career with results: `tests/wave5-elite-gate.test.ts` §A2.

    const b = JSON.parse(JSON.stringify(withKeys)) as Record<string, unknown>
    for (const key of V76_KEYS) {
      expect(b[key], `the B arm carries ${key} through the walk`).toBeDefined()
      delete b[key]
    }
    const REGROWN = [...WALLS, 'peakDomesticPoints'] as const
    for (const key of REGROWN) delete withoutKeys[key]
    expect(Object.keys(withoutKeys).sort(), 'the two arms end with the same key set once the v76 keys are off')
      .toEqual(Object.keys(b).sort())
    for (const key of Object.keys(b)) {
      expect(JSON.stringify(withoutKeys[key]), `${key} is byte-identical across the two arms`)
        .toBe(JSON.stringify(b[key]))
    }
    // ⚠ AND THE WALK REALLY WALKED, so the identity above is not the identity of two empty worlds –
    // the null-arm check CLAUDE.md demands of every null result, run in the cheapest direction there
    // is. 156 weeks, a moved rank, a moved wallet, a MAIN position that has advanced.
    expect(withKeys.week, 'the arms really walked 156 weeks').toBe(156)
    expect(withKeys.rngMain.n, '...and really spent MAIN draws doing it').toBeGreaterThan(0)
    expect(withKeys.events.length, '...and really lived a career').toBeGreaterThan(10)
  }, 120_000)

  it('⚠ and the six keys come out of a walked career exactly as they went in – T1 ships no writer', () => {
    // The other direction of the same claim, and the one that would catch a tick that WROTE one of
    // them: `hirePsychologist` is T2, the focus command T3, the leaning pass and the flip hazard T7,
    // so after 156 weeks every one of the six must still read its week-0 identity value.
    //
    // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T7 IN ITS PROSE AND NOT IN ITS ASSERTIONS, WHICH IS WORTH SAYING
    // OUT LOUD: the two walls lines stayed GREEN when `driftWalls` landed, and a green line with a
    // lying comment is worse than a red one. They used to say «NO LEANING PASS EXISTS YET». The pass
    // exists; what keeps these two at their identity values is that this career's bond never leaves
    // the CARING band, where a lean already at 0 has nothing to repair and no focus is held to buy
    // growth with. That is the anti-«hugged into an extravert» dam (§2a) observed from the outside,
    // and it is why the frozen corpus's own diff for this wave is small rather than universal.
    const world = walk(createWorld('wave5-no-writer'), 156)
    expect(world.psychologistHired, 'nobody hired him').toBe(false)
    expect(world.psychologistRung, 'the dial did not move').toBe(1)
    expect(world.psychologistFocus, 'no year was chosen').toBeNull()
    expect(world.psychologistFocusSeason, 'so no season holds a pick').toBeNull()
    expect(world.wallsLean, '⚠ the pass ran every week and she never left her nature').toEqual({ open: 0, reg: 0 })
    expect(world.wallsFlipped, '⚠ so nothing ever armed, and nothing flipped').toEqual({ open: false, reg: false })
    // ⚠ 14.09 – the seventh key is the DELIBERATE exception to this case's title: it ships WITH a
    // writer (`recomputeKidRank` banks the domestic high-water). On THIS career the identity value
    // survives for the honest reason that a no-action walk enters nothing and earns nothing – so
    // the assertion documents the boundary rather than the banker; the banker's own control (a
    // peak banked, held through decay, opening the gate) is wave5-elite-gate §A2's.
    expect(world.peakDomesticPoints, '⚠ a no-action career banks nothing – 0 is its true peak').toBe(0)
    // ⚠ AND THE BOND IS WHY, stated rather than implied – the claim above is about a caring career and
    // would be false of a grinding one, which is T7's own test file's business.
    expect(world.bond, 'her bond never left the caring band').toBeGreaterThanOrEqual(ECONOMY.bond.band.steady)
  }, 120_000)
})

// =================================================================================================
// F. THE CENSUS – who may name the six keys, and who may call the function
// =================================================================================================
describe('wave 5 T1 F – the readers, exhaustively', () => {
  it('⭐⭐⭐ `expressedTemperamentOf` is named in exactly TWO files, and ruling A\'s 3/2 split is exact', () => {
    // ⚠⚠ THE BRIEF'S OWN CONDITION FOR LANDING THIS FUNCTION IN T1, MADE MECHANICAL (§0.2 and the T1
    // block: «In T1 it has ZERO call sites in `src/` outside its own module – the mechanics are
    // re-pointed in T7»). This is the pin that makes the zero-diff claim airtight: it is not merely
    // that the function returns birth today, it is that NOTHING ASKS IT. A reader added before T7
    // would be a re-point nobody reviewed, and the cheapest way to notice one is to pin the set.
    //
    // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T7, AND STRENGTHENED RATHER THAN RENUMBERED – which is this
    // file's own duty and the thing the paragraph below already promised would happen («When T7
    // re-points its sites this list grows»). WHAT MOVED: the census is now TWO files, because T7 is
    // the commit that re-points the mechanics. WHY BUMPING THE LIST FROM ONE ENTRY TO TWO AND
    // STOPPING THERE WOULD HAVE BEEN A WEAKENING: the old pin's real claim was «the set of readers is
    // known and reviewed», and a two-element file list says nothing about WHICH of `lifeBeat.ts`'s
    // five temperament reads moved. RULING A's whole content is the 3/2 SPLIT inside that one file –
    // three mechanics to expression, two re-derived prices to birth – so the split itself is what
    // this pin now asserts, per call site, by counting both spellings. A future editor who
    // «tidies up» by re-pointing `temperamentOf`'s body (one line, and the exact mistake ruling A
    // exists to forbid) leaves the FILE list untouched and goes red here on 3 → 5 and 2 → 0.
    //
    // ⚠ `codeOnly`, because `state.ts` and this wave's own prose NAME the function in comments, and a
    // pin that tripped on an explanation would be repaired by deleting the explanation.
    const named = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('expressedTemperamentOf'))
      .map(([path]) => path)
    expect(named, 'the reader set is exactly the two modules T7 re-pointed')
      .toEqual(['engine/spirit.ts', 'engine/world/lifeBeat.ts'])
    // ⭐⭐ RULING A, COUNTED. `lifeBeat.ts` held FIVE `temperamentOf(world)` calls before T7. Three are
    // evaluated-now mechanics (`rollArrival`'s hazard/wants/lag, `arrivalEligible`'s cooldown,
    // `rollEnds`'s hazard) and read EXPRESSION; two re-derive the `'ended'` card's PRICE
    // (`beatEndsRead`, and the told-late kept row) and must read BIRTH, because `answerLifeBeat`
    // re-validates the chosen option against a set that has to be reconstructible from persisted
    // facts – and expression is a fact about the current week, not about the episode.
    const beats = codeOnly(readFileSync(`${SRC}engine/world/lifeBeat.ts`, 'utf8'))
    expect(beats.split('expressedTemperamentOf(world)').length - 1, '⚠ ruling A: THREE mechanics read expression')
      .toBe(3)
    // ⚠ THE TWO COUNTS DO NOT OVERLAP, WHICH WAS MEASURED RATHER THAN ASSUMED (the first drafting of
    // this line subtracted 3 for the expected overlap and went red at −1). `expressedTemperamentOf`
    // spells the shared tail with a CAPITAL T – `…TemperamentOf(world)` – so a search for
    // `temperamentOf(world)` cannot see it, and neither can the declaration
    // `temperamentOf(world: WorldState)`, whose next character is a colon. Two independent counts.
    expect(beats.split('temperamentOf(world)').length - 1, '⚠ ruling A: TWO re-derived prices read birth')
      .toBe(2)
    // ...and the private birth reader still EXISTS, so the count above cannot go green by the
    // function having been deleted and its two callers inlined.
    expect(beats, 'the birth reading is still a function of its own').toContain('function temperamentOf(world: WorldState)')
    // ⭐ AND `accrueSpirit`'s OWN read is the fifth swap, in the other file – ruling A's tail («the
    // intensity read is evaluated now ⇒ expressed»). Pinned by its neighbours rather than by a line
    // number: the birth spelling it replaced must be gone from the weekly pass.
    const spirit = codeOnly(readFileSync(`${SRC}engine/spirit.ts`, 'utf8'))
    expect(spirit, '⚠ the weekly pass reads the EXPRESSED intensity')
      .toContain('temperamentIntensity(expressedTemperamentOf(world))')
    expect(spirit, '⚠ ...and the birth spelling it replaced is not still standing beside it')
      .not.toContain('temperamentIntensity(world.temperament ?? temperamentFor(world.seed))')
    // ⚠⚠ AND THE FENCE, WHICH IS THE HALF T7 MUST NOT BREAK EITHER (who-she-is §3, wave-5 brief §0.2).
    // The MECHANICS may read expression; the VOICES read BIRTH and only birth – the bibles, the
    // tier-0/1 pools, the prompt registers and the birthday-ask weighting. A voice file appearing
    // here is a finding, not a tuning miss.
    expect(named.some((p) => p.includes('diary') || p.includes('voice') || p.startsWith('components/')))
      .toBe(false)
    // ⭐ THE NAMED HALF OF THE SAME FENCE, because «no diary and no voice FILE» is weaker than the
    // rule: `birthday.ts`'s ask weighting is §0.2's own worked example of a read that stays on birth
    // and lives in a file that is not called «voice» anything.
    expect(named, '⚠ the birthday ask weighting reads BIRTH – §0.2\'s named fence')
      .not.toContain('engine/world/birthday.ts')
  })

  it('⭐⭐ the WALLS keys are named in three files in src/ – the seat, the back-fill and the literal, plus ONE reader', () => {
    // The T1 brief's «inert by construction», made mechanical the way wave 4's §E did for
    // `spiritShock`. Three files per key: the declaration, the migration step and `createWorld`'s
    // literal. Anything else is a reader.
    //
    // ⚠⚠ RE-AIMED BY T2 AT THE TWO WALLS KEYS ALONE, AND THE PARAGRAPH THIS PIN ENDED WITH IS WHY.
    // It read «the six keys» and finished: «T2 puts the seat's read-only face on `Snapshot` when it
    // ships the card that needs it; the WALLS never go on the wire at all (§2a: no reader and no
    // line ever sees the leaning), and that is a rule rather than an omission.» T2 is that commit.
    // The four SEAT keys acquired their readers exactly as predicted – the leaf, the household
    // figure, the snapshot and the staff card – so holding them to a three-file census now would
    // assert that T2 never happened. The WALLS half is untouched and is the half that was ever
    // load-bearing: it is the pin that says T7 has not started early, and it is STRICTER for being
    // said about the keys it is really about.
    //
    // ⚠ THE ORDER IS THE WALK'S, NOT AN ALPHABET'S: `srcFiles` recurses a directory where it meets
    // it, so `engine/world/` is exhausted before `engine/world.ts` («world» sorts before «world.ts»).
    const WRITERS = [
      'engine/migrations.ts', // the v75 -> v76 back-fill
      'engine/world/state.ts', // the seat itself
      'engine/world.ts', // `createWorld`'s literal
    ]
    const WALLS_KEYS = ['wallsLean', 'wallsFlipped'] as const
    for (const key of WALLS_KEYS) {
      const named = srcFiles()
        .filter(([, text]) => codeOnly(text).includes(key))
        .map(([path]) => path)
      // ⭐⭐ `wallsFlipped` IS THE ONE KEY WITH A READER, AND THE ASYMMETRY IS THE SHAPE OF THE WAVE
      // RATHER THAN AN UNTIDINESS. `expressedTemperamentOf` (engine/spirit.ts) reads the FLIP and
      // nothing else: the leaning is T7's slow accumulator, the flip is the state a mechanic asks
      // about, and putting the threshold in the reader as well as in the hazard would be the flicker
      // the hysteresis exists to abolish. So the leaning has no reader at all on this tree and the
      // flip has exactly one – which is a stronger statement than «three files each» and is why the
      // two lists are written out separately instead of averaged into one.
      //
      // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T7, AND THE ASYMMETRY THE PARAGRAPH ABOVE DESCRIBES HAS CLOSED
      // BY DESIGN. It went RED – «wallsLean: expected [4 entries] to deeply equal [3]» – the week
      // `driftWalls` landed, because the LEANING acquired its writer and its only reader in the same
      // commit, and both are `engine/spirit.ts`. So the two lists are now identical: three writers
      // plus exactly one module that touches either wall. ⚠ WHAT IS NOT WEAKENED: the list is still
      // EXACT and still ordered, so a second module learning to name either key is red, and the
      // no-surface sweep below is untouched. What the old text said about the flip having a reader
      // and the leaning having none was a statement about the WAVE's order, not about the design –
      // §2a's rule is «no reader and no line ever SEES the leaning», and a pass that maintains it is
      // not a surface.
      expect(named, `${key}`).toEqual([WRITERS[0], 'engine/spirit.ts', WRITERS[1], WRITERS[2]])
    }
    // ...and neither wall is on the wire, which is the other half of the same claim: no component,
    // store or composable can be reading a field the snapshot does not carry. §2a is explicit that
    // this is a RULE and not an omission – «no reader and no line ever sees the leaning» – so unlike
    // the seat's four keys these two never become a T-something's snapshot field.
    const anySurface = srcFiles()
      .filter(([, text]) => WALLS_KEYS.some((k) => codeOnly(text).includes(k)))
      .map(([path]) => path)
      .filter((p) => p.startsWith('components/') || p.startsWith('stores/') || p.startsWith('composables/'))
    expect(anySurface, 'no surface names either wall').toEqual([])
    // ⚠ AND THE POSITIVE CONTROL FOR THE SWEEP ABOVE, added with the re-aim so «no surface» cannot go
    // vacuous: the same filter over the SEAT's flag finds the staff card, which is where T2 put it.
    const seatSurfaces = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('psychologistHired'))
      .map(([path]) => path)
      .filter((p) => p.startsWith('components/'))
    expect(seatSurfaces, 'the sweep really can see a surface when there is one').toEqual([
      'components/SupportStaffTab.vue',
    ])
  })

  it('⭐ ...and the SEAT keys are named only where T2 put them – no voice file, no diary, no stray reader', () => {
    // ⚠ WHAT SURVIVES OF THE SIX-KEY CENSUS FOR THE FOUR SEAT KEYS, written as the claim that is
    // still true rather than dropped. T2 gave three of them readers; the thing worth pinning is that
    // the readers are the ones the wave designed, and in particular that no VOICE or DIARY file has
    // started asking about a staffing decision – §3's fence in its own costume, one field group over.
    const SEAT_KEYS = ['psychologistHired', 'psychologistRung', 'psychologistFocus', 'psychologistFocusSeason'] as const
    for (const key of SEAT_KEYS) {
      const named = srcFiles()
        .filter(([, text]) => codeOnly(text).includes(key))
        .map(([path]) => path)
      expect(named.some((p) => p.includes('diary') || p.includes('voice') || p.includes('lifeBeat')), `${key}`)
        .toBe(false)
    }
    // ⚠⚠ RE-AIMED BY T3 AT THE READERS THE YEAR-FOCUS WAS ALWAYS GOING TO GET, AND THE SENTENCE IT
    // REPLACES IS WHY. This case ended: «AND THE FOCUS HAS NO READER AT ALL ON THIS TREE, which is
    // T3's whole surface area … so a focus reader appearing before T3's command is a finding rather
    // than a tuning miss.» T3 is that command. The four files below are the three writers plus
    // exactly the road the wave designed – the leaf that decides (`world/psychologist.ts`), the
    // builder that puts it on the wire, the wire itself, and the ONE surface that reads it. Holding
    // it to «writer-only» now would assert that T3 never happened; holding it to THIS list is
    // stricter than it looks, because a fifth reader is still a finding.
    //
    // ⚠ `includes('psychologistFocus')` MATCHES `psychologistFocusSeason`, `psychologistFocusOpen`
    // and `psychologistFocusDetail` TOO, by substring – which is the honest superset for this claim
    // and the reason the list below is not the snapshot's member list.
    //
    // ⚠⚠ RE-AIMED AGAIN BY T4, AND THE EIGHTH ENTRY IS THE ONE THE NOTE ABOVE PROMISED WOULD COME.
    // WHAT MOVED: `engine/spirit.ts` joined the list. WHY: T3 shipped a decision that did nothing,
    // and its own comment said so – «the recovery slope inside `accrueSpirit` (T4), the bounded
    // composure walk (T5) …». T4 is the first of the four to land, and `accrueSpirit` is where the
    // wave brief and §0.1 both put it («the ONE writer of `world.spirit`»), so the focus gains its
    // FIRST EFFECT reader and it is exactly the file the design named. T5's is `engine/development.ts`
    // (ruling D) and T6's is `world/lifeBeat.ts` – ⚠ and THAT one will have to be argued against the
    // fence below rather than merely added, because the fence is about what her WORDS may read and
    // T6's draw is about the parent's ears. A ninth entry arriving anywhere else is still a finding.
    const focusNamed = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('psychologistFocus'))
      .map(([path]) => path)
    expect(focusNamed, 'the year-focus is read where T3 put it, and where T4 spends it').toEqual([
      'components/SupportStaffTab.vue',
      'engine/migrations.ts',
      'engine/spirit.ts',
      'engine/world/psychologist.ts',
      'engine/world/snapshot.ts',
      'engine/world/state.ts',
      'engine/world.ts',
      'shared/protocol/snapshot.ts',
    ])
    // ⭐ AND THE HALF THAT WAS ALWAYS THE POINT SURVIVES THE RE-AIM, restated so it cannot be lost
    // with the list above: no VOICE, DIARY or LIFEBEAT file has started asking what the seat is
    // working on – §3's fence in its own costume, and the loop over `SEAT_KEYS` above says it for
    // each key individually.
    expect(
      focusNamed.some((p) => p.includes('diary') || p.includes('voice') || p.includes('lifeBeat')),
      'a staffing decision is still nothing any of her words may read',
    ).toBe(false)
  })
})
