// THE SNAPSHOT CACHE, ASSERTED OVER EVERY SAVE SCHEMA THE GAME HAS EVER WRITTEN – Wave A step A4
// (docs/specs/next-waves-2026-09.md, "The extra safety he asked for").
//
// ⚠⚠ THIS IS THE ARM THAT TURNS A CLAIM INTO A MEASUREMENT. The wave's answer to his question –
// «можно ли что-то сделать для совместимости с предыдущими сейвами дополнительно» – is that nothing
// about saves changes at all, because a content-keyed memo of a pure function is invisible by
// construction. That sentence is an ARGUMENT. This file is the measurement: every golden fixture
// from v0 to the current schema is loaded, migrated and projected TWICE – once through the memo and
// once with it switched off – and the two snapshots must be byte-identical.
//
// AND IT RUNS WITH `TB_SNAPSHOT_VERIFY=1`, which is the finer of the two nets. In that mode every
// memoised fold computes BOTH answers and throws on a difference NAMING THE KEY, so a key that
// misses a dependency is reported as the key it is rather than as a snapshot that differs somewhere.
// The whole-snapshot comparison below is the coarser net underneath it, and it is kept because the
// two catch different things: the verify arm catches a stale VALUE, the comparison catches a memo
// that changed the shape of the projection at all.
//
// ⚠ WHY IT IS A SIM FILE AND NOT A UNIT ONE. 71 fixtures x (migrate + three projections, two of them
// doubled by the verify mode) is minutes of synchronous work – the shape `scripts/sim.mjs`' header
// is entirely about. It is in `HEAVY_SIM_FILES` and therefore out of the unit pool and out of the PR
// gate's bulk pass; `npm run test:sim` runs it, and CLAUDE.md's standing regime already requires that
// of every PR assembly.
//
// ⚠ THE ENV VAR IS SET HERE AND RESTORED AFTERWARDS. `snapshotVerifyEnabled()` reads `process.env` on
// every call rather than caching it at module load, exactly so a test can turn it on for its own
// file without a second process – see its note in world/derivedCache.ts.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION, kitStateOf, setKitGrade, toSnapshot, type WorldState } from '../src/engine/world'
import type { KitGrade } from '../src/shared/protocol'
import { decodeExportFile } from '../src/engine/saveCodec'
import { clearDerivedCache, derivedCacheStats, resetDerivedCacheStats } from '../src/engine/world/derivedCache'
import { FIXTURE_NAMES, readFixtureBytes } from '../tools/e2e-fixtures-read'

const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const FILES = readdirSync(DIR)
  .filter((f) => /^v\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

/** The kit ladder's own order – `KIT_GRADES` in engine/equipment.ts walks the same one. */
const KIT_LADDER: KitGrade[] = ['alloy', 'composite', 'performance', 'pro']

function loadWorld(file: string) {
  return migrateSave(JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8')))
}

/** The projection with the memo switched off, on the same tree and the same world. This is the
 *  control CLAUDE.md's rule about shared checkouts asks for, expressed as a switch rather than a
 *  worktree: the two arms differ by the memo and by nothing else. */
function uncachedSnapshot(world: ReturnType<typeof loadWorld>): unknown {
  const before = process.env.TB_SNAPSHOT_CACHE
  const beforeVerify = process.env.TB_SNAPSHOT_VERIFY
  process.env.TB_SNAPSHOT_CACHE = 'off'
  delete process.env.TB_SNAPSHOT_VERIFY
  try {
    return toSnapshot(world)
  } finally {
    if (before === undefined) delete process.env.TB_SNAPSHOT_CACHE
    else process.env.TB_SNAPSHOT_CACHE = before
    if (beforeVerify !== undefined) process.env.TB_SNAPSHOT_VERIFY = beforeVerify
  }
}

describe('the snapshot cache over the whole golden-fixture corpus', () => {
  let restore: string | undefined
  beforeAll(() => {
    restore = process.env.TB_SNAPSHOT_VERIFY
    process.env.TB_SNAPSHOT_VERIFY = '1'
  })
  afterAll(() => {
    if (restore === undefined) delete process.env.TB_SNAPSHOT_VERIFY
    else process.env.TB_SNAPSHOT_VERIFY = restore
  })

  it('covers every schema version from v0 to the current one', () => {
    // The same floor `tests/goldenSaves.test.ts` enforces, restated here so this file cannot go
    // quietly vacuous if the corpus is ever filtered differently.
    const versions = FILES.map((f) => Number(f.match(/\d+/)![0]))
    for (let v = 0; v <= SAVE_SCHEMA_VERSION; v++) {
      expect(versions, `missing fixture v${v}.json`).toContain(v)
    }
    expect(FILES.length).toBe(SAVE_SCHEMA_VERSION + 1)
  })

  /** The three readings one career is worth, and the third is the one the product actually does.
   *
   *  ⚠ THE UNCACHED ARM GOES FIRST, ON A COLD MEMO, so the cached arm cannot be handed an answer
   *  this very call computed under different rules. Then the memo is exercised TWICE: the first pass
   *  fills it, the second reads it back – and it is the SECOND that is the interesting one, because
   *  a memo that is only ever written is not a memo. */
  function assertCacheIsInvisible(label: string, world: WorldState): void {
    clearDerivedCache()
    const plain = JSON.stringify(uncachedSnapshot(world))

    clearDerivedCache()
    const filled = JSON.stringify(toSnapshot(world))
    const reread = JSON.stringify(toSnapshot(world))

    expect(filled, `${label}: first cached projection differs from the uncached one`).toBe(plain)
    expect(reread, `${label}: the memo's second read differs from the uncached projection`).toBe(plain)
  }

  for (const file of FILES) {
    it(`${file}: the cached snapshot is the uncached snapshot`, () => {
      assertCacheIsInvisible(file, loadWorld(file))
    })
  }

  // ⚠⚠ AND THE ANTI-VACUITY FLOOR, WHICH IS NOT OPTIONAL HERE. Twenty-one of the 71 golden fixtures
  // are at college and project no upcoming feed at all, so a corpus that happened to be ALL of those
  // would exercise the preview memo zero times and still print 71 green tests – a suite measuring its
  // own emptiness, which is the class of dead guard this repo keeps finding. Measured on today's
  // corpus: 49 fixtures carry a feed, and the three memos take 16,229 / 390 / 91 misses across it.
  // The floors below are deliberately far under those, because the point is to catch a memo that has
  // stopped being reached at all, not to pin a count that legitimately drifts with the corpus.
  //
  // ⚠ IT COUNTS RATHER THAN CHECKS, so it runs with the verify mode OFF – that mode does every fold
  // twice and this census walks the whole corpus. The 60 s ceiling is the sim project's own shape
  // (its default is 5 s, which this walk passes on a loaded machine); the work itself is ~7 s.
  it('the corpus actually reaches all three memos', () => {
    const restoreVerify = process.env.TB_SNAPSHOT_VERIFY
    delete process.env.TB_SNAPSHOT_VERIFY
    resetDerivedCacheStats()
    clearDerivedCache()
    try {
      for (const file of FILES) toSnapshot(loadWorld(file))
    } finally {
      if (restoreVerify !== undefined) process.env.TB_SNAPSHOT_VERIFY = restoreVerify
    }
    const stats = derivedCacheStats()
    expect(stats.ranking.miss, 'the ranking memo was never reached').toBeGreaterThan(100)
    expect(stats.ranking.hit, 'the ranking memo never returned a cached answer').toBeGreaterThan(100)
    expect(stats.preview.miss, 'no fixture in the corpus previews a far card').toBeGreaterThan(50)
    expect(stats.preview.hit, 'the preview memo never returned a cached answer').toBeGreaterThan(10)
    expect(stats.rated.miss, 'the rated-field memo was never reached').toBeGreaterThan(10)
  }, 60_000)

  // ⚠ THE GOLDEN CORPUS IS BROAD BUT SHALLOW – every schema, and a career that is mostly at college
  // or in its first season. These two are the deepest LIVE careers the repo keeps (week 120 with a
  // 29-card feed, week 412 with 22), which is where the preview memo does its work, and they are
  // also where a command is actually applied and the projection taken again – the product's own loop
  // rather than a static read.
  for (const name of FIXTURE_NAMES) {
    it(`e2e ${name}: the cache is invisible, before and after a command`, async () => {
      const world = await decodeExportFile(readFixtureBytes(`${name}.tsave`))
      assertCacheIsInvisible(`e2e ${name}`, world)

      // The cheapest command in the game, and deliberately so: `setPhysio` moves one boolean and
      // touches nothing any key folds, which is exactly the case a content-keyed memo must survive.
      // Every table it reuses afterwards is one it computed for the world before the command.
      const after = structuredClone(world)
      after.physioActive = !after.physioActive
      const cached = JSON.stringify(toSnapshot(after))
      expect(cached, `e2e ${name}: the projection after a command differs from an uncached one`).toBe(
        JSON.stringify(uncachedSnapshot(after)),
      )
    })
  }

  // ⚠⚠ THE CASE THE CORPUS ABOVE CANNOT REACH, AND IT WAS FOUND BY MUTATION RATHER THAN BY THOUGHT.
  // The far card's key carries her two RATINGS, because everything she is reaches that card through
  // them. Deleting them from the key left all 79 tests above GREEN – no fixture in the corpus ever
  // presents two worlds that share a week, a cohort and an event id while she is a different player.
  // A guard that cannot fail on the mutation it is written for is not a guard, so this is the arm
  // that closes it: buy her a rung of kit, which moves her rating and nothing either table reads,
  // and project again. With the ratings dropped from the key this goes red on the first fixture.
  //
  // ⚠ AND IT ASSERTS THE RATING ACTUALLY MOVED. Without that the whole case degrades to "two
  // identical worlds agree", which is the null arm this repo has already been bitten by twice.
  it('a purchase that moves only her rating is not served a stale card', async () => {
    let moved = 0
    for (const name of FIXTURE_NAMES) {
      const world = await decodeExportFile(readFixtureBytes(`${name}.tsave`))
      clearDerivedCache()
      const before = toSnapshot(world)
      if (!before.upcoming.length) continue

      const upgraded = structuredClone(world)
      const at = KIT_LADDER.indexOf(kitStateOf(upgraded).grade.strings)
      const to = KIT_LADDER[at + 1] ?? KIT_LADDER[Math.max(0, at - 1)]!
      // An ended career refuses every command – that is `guardNotEnded` being right, and such a
      // fixture simply has nothing to contribute here.
      try {
        setKitGrade(upgraded, 'strings', to)
      } catch {
        continue
      }

      const after = toSnapshot(upgraded)
      const ratingsMoved = after.upcoming.some(
        (row, i) => row.preview.kidRating !== before.upcoming[i]?.preview.kidRating,
      )
      if (!ratingsMoved) continue
      moved++

      expect(JSON.stringify(after), `e2e ${name}: the card after a kit purchase is not the uncached card`).toBe(
        JSON.stringify(uncachedSnapshot(upgraded)),
      )
    }
    expect(moved, 'no fixture actually moved her rating – this case is measuring nothing').toBeGreaterThan(0)
  }, 60_000)
})
